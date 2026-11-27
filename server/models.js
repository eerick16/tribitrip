import mongoose from "mongoose";
import dns from "node:dns";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion, ServicioTuristico } from "./quote-models.js";
import { Reserva } from "./reservation-model.js";
import { travelRequestSchema } from "./travel-models.js";

const { Schema } = mongoose;
const email = {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
  maxlength: 254,
  match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    correo: { ...email, unique: true },
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, enum: ["Administrador", "Asesor"], default: "Asesor" },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const sessionSchema = new Schema({
  token: { type: String, required: true, unique: true },
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});
const clientSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    correo: { ...email, unique: true },
    telefono: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{10,15}$/,
    },
    ubicacion: { type: String, trim: true, maxlength: 200, default: "" },
    estado: {
      type: String,
      enum: ["Prospecto", "Activo", "Inactivo"],
      default: "Prospecto",
    },
    origen: { type: String, maxlength: 100, default: "Otro" },
    contactoPreferido: { type: String, maxlength: 100, default: "WhatsApp" },
    destinoInteres: { type: String, maxlength: 200, default: "" },
    presupuesto: { type: Number, min: 0, default: null },
    revisionContacto: { type: Number, default: 0 },
    solicitudes: { type: [travelRequestSchema], select: false },
    asesor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);
clientSchema.index({ "solicitudes._id": 1 }, { sparse: true });
clientSchema.index({ "solicitudes.createdAt": 1 });
clientSchema.index({ asesor: 1, createdAt: -1, _id: -1 });
export const Usuario = mongoose.model("Usuario", userSchema);
export const Sesion = mongoose.model("Sesion", sessionSchema);
export const Cliente = mongoose.model("Cliente", clientSchema);
export async function connect() {
  if (!process.env.MONGODB_URI)
    throw new Error("Configura MONGODB_URI en server/.env.");
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  await Promise.all([
    Usuario.init(),
    Sesion.init(),
    Cliente.init(),
    Oportunidad.init(),
    ServicioTuristico.init(),
    Cotizacion.init(),
    Reserva.init(),
  ]);
}
