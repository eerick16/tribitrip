import mongoose from "mongoose";
import { etapas } from "../shared/oportunidades.js";

const { Schema } = mongoose;
const opportunitySchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
      immutable: true,
    },
    solicitud: { type: Schema.Types.ObjectId, required: true, immutable: true },
    asesor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      immutable: true,
    },
    etapa: { type: String, enum: etapas, required: true, default: etapas[0] },
    cerradaEn: { type: Date, default: null },
    revision: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

opportunitySchema.index({ asesor: 1, etapa: 1, createdAt: -1 });
opportunitySchema.index({ cliente: 1, solicitud: 1 });
export const Oportunidad = mongoose.model("Oportunidad", opportunitySchema);
