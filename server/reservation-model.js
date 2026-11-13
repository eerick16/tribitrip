import mongoose from "mongoose";
import { maxCentavos } from "../shared/cotizaciones.js";
import { clientSnapshot, conceptSchema } from "./quote-models.js";
import { fechaCiudadMexico } from "./quote-lifecycle.js";
import { isCalendarDate } from "./travel-models.js";

const { Schema } = mongoose;
export const transicionesReserva = {
  "Pendiente de pago": ["Confirmada", "Cancelada"],
  Confirmada: ["En viaje", "Cancelada"],
  "En viaje": ["Completada"],
  Completada: [],
  Cancelada: [],
};

const relation = (ref) => ({
  type: Schema.Types.ObjectId,
  ref,
  required: true,
  immutable: true,
});
const money = {
  type: Number,
  required: true,
  min: 0,
  max: maxCentavos,
  validate: Number.isSafeInteger,
};
const date = { type: String, required: true, validate: isCalendarDate };
const texto = (maxlength, required = false) => ({
  type: String,
  required,
  trim: true,
  maxlength,
  default: "",
});

export const clavePagoValida = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
export const referenciaPago = ({ tipo = "Pago", metodo, referencia }) =>
  [tipo, metodo, referencia].map((value) =>
    String(value).trim().replace(/\s+/g, " ").toLowerCase(),
  );

export const pagoInformativoSchema = new Schema({
  tipo: {
    type: String,
    enum: ["Pago", "Devolución"],
    default: "Pago",
    required: true,
  },
  clave: {
    type: String,
    required: true,
    lowercase: true,
    validate: clavePagoValida,
  },
  fecha: {
    ...date,
    validate: (value) => isCalendarDate(value) && value <= fechaCiudadMexico(),
  },
  montoCentavos: { ...money, min: 1 },
  metodo: texto(80, true),
  referencia: texto(120, true),
  observaciones: texto(500),
  registradoPor: relation("Usuario"),
  registradoEn: { type: Date, required: true, default: Date.now },
});

const reservaSchema = new Schema(
  {
    folio: {
      type: String,
      required: true,
      immutable: true,
      unique: true,
      match: /^RES-[0-9A-F]{24}$/,
    },
    cliente: relation("Cliente"),
    oportunidad: relation("Oportunidad"),
    solicitud: { type: Schema.Types.ObjectId, required: true, immutable: true },
    cotizacion: { ...relation("Cotizacion"), unique: true },
    folioCotizacion: {
      type: String,
      required: true,
      immutable: true,
      match: /^COT-[0-9A-F]{24}$/,
    },
    versionAceptada: {
      type: Number,
      required: true,
      immutable: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    asesor: relation("Usuario"),
    registradaPor: relation("Usuario"),
    clienteDocumento: { type: clientSnapshot, required: true, immutable: true },
    destino: { ...texto(200, true), immutable: true },
    salida: { ...date, immutable: true },
    regreso: {
      ...date,
      immutable: true,
      validate(value) {
        return isCalendarDate(value) && value >= this.salida;
      },
    },
    vigenciaCotizacion: { ...date, immutable: true },
    conceptos: {
      type: [conceptSchema],
      immutable: true,
      validate: (items) => items?.length > 0,
    },
    subtotalCentavos: { ...money, immutable: true },
    impuestosCentavos: { ...money, immutable: true },
    cargosCentavos: { ...money, immutable: true },
    totalCentavos: { ...money, immutable: true },
    condiciones: { ...texto(2000), immutable: true },
    observaciones: { ...texto(2000), immutable: true },
    localizador: texto(120),
    proveedorReferencia: texto(150),
    estado: {
      type: String,
      enum: Object.keys(transicionesReserva),
      default: "Pendiente de pago",
      required: true,
    },
    estadoActualizadoEn: Date,
    estadoActualizadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    pagos: { type: [pagoInformativoSchema], default: [] },
    pagadoCentavos: { ...money, default: 0 },
  },
  { timestamps: true, versionKey: "revision", optimisticConcurrency: true },
);

reservaSchema.pre("validate", function () {
  if (
    this.subtotalCentavos !==
      this.conceptos?.reduce((sum, line) => sum + line?.subtotalCentavos, 0) ||
    this.totalCentavos !==
      this.subtotalCentavos + this.impuestosCentavos + this.cargosCentavos
  )
    this.invalidate(
      "totalCentavos",
      "Los importes de la reserva deben coincidir con la cotización.",
    );
  const claves = new Set();
  const referencias = new Set();
  let pagado = 0;
  for (const pago of this.pagos ?? []) {
    if (!pago) {
      this.invalidate("pagos", "Pago inválido.");
      continue;
    }
    const referencia = JSON.stringify(referenciaPago(pago));
    if (claves.has(pago.clave) || referencias.has(referencia))
      this.invalidate("pagos", "Hay pagos duplicados.");
    claves.add(pago.clave);
    referencias.add(referencia);
    if (pago.tipo === "Devolución") {
      if (pago.montoCentavos > pagado - this.totalCentavos)
        this.invalidate(
          "pagos",
          "La devolución supera el excedente disponible.",
        );
      pagado -= pago.montoCentavos;
    } else {
      pagado += pago.montoCentavos;
    }
  }
  this.pagadoCentavos = pagado;
});

reservaSchema.index({ asesor: 1, estado: 1, createdAt: -1 });
reservaSchema.index({ estado: 1, createdAt: -1 });
reservaSchema.index({ cliente: 1, createdAt: -1 });
export const Reserva = mongoose.model("Reserva", reservaSchema);

// Apply the confirmation rule to reservations paid before it was introduced.
export async function confirmarReservasPagadas() {
  await Reserva.updateMany(
    {
      estado: "Pendiente de pago",
      "pagos.0": { $exists: true },
      $expr: { $gte: ["$pagadoCentavos", "$totalCentavos"] },
    },
    [
      {
        $set: {
          estado: "Confirmada",
          estadoActualizadoEn: "$$NOW",
          estadoActualizadoPor: {
            $ifNull: [
              { $arrayElemAt: ["$pagos.registradoPor", -1] },
              "$registradaPor",
            ],
          },
          revision: { $add: [{ $ifNull: ["$revision", 0] }, 1] },
        },
      },
    ],
    { updatePipeline: true },
  );
}
