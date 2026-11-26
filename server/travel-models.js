import mongoose from "mongoose";

const { Schema } = mongoose;
export const travelStatuses = [
  "Nueva",
  "En revisión",
  "Contactado",
  "Atendida",
  "Cancelada",
];
export const travelerTypes = ["Adulto", "Menor", "Infante"];

export function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

const calendarDate = { type: String, required: true, validate: isCalendarDate };

export const travelerSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    parentesco: { type: String, required: true, trim: true, maxlength: 100 },
    tipo: { type: String, required: true, enum: travelerTypes },
    nacimiento: {
      type: String,
      default: null,
      validate: (value) =>
        value === null ||
        (isCalendarDate(value) &&
          value <= new Date().toISOString().slice(0, 10)),
    },
  },
  { timestamps: true },
);

export const travelRequestSchema = new Schema(
  {
    destino: { type: String, required: true, trim: true, maxlength: 200 },
    salida: calendarDate,
    regreso: {
      ...calendarDate,
      validate: {
        validator(value) {
          return isCalendarDate(value) && value >= this.salida;
        },
        message: "El regreso debe ser igual o posterior a la salida.",
      },
    },
    presupuesto: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite,
    },
    cantidadViajeros: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator(value) {
          return Number.isSafeInteger(value) && value >= this.viajeros.length;
        },
        message:
          "La cantidad debe ser entera y cubrir a los viajeros registrados.",
      },
    },
    necesidades: { type: String, trim: true, maxlength: 1000, default: "" },
    estado: {
      type: String,
      enum: travelStatuses,
      required: true,
      default: "Nueva",
    },
    viajeros: { type: [travelerSchema], default: [] },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);
