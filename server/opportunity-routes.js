import mongoose from "mongoose";
import { etapas, etapasCerradas, estados } from "../shared/oportunidades.js";
import { Cliente } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { enumFilter, listResult } from "./list-queries.js";

function withNames(query) {
  return query
    .populate("cliente", "nombre")
    .populate("asesor", "nombre")
    .lean();
}

const reference = (doc) =>
  doc ? { id: String(doc._id), nombre: doc.nombre } : null;

function opportunityJson(row) {
  return {
    id: String(row._id),
    titulo: row.titulo,
    cliente: reference(row.cliente),
    asesor: reference(row.asesor),
    solicitud: String(row.solicitud),
    etapa: row.etapa,
    resultado: etapasCerradas.includes(row.etapa) ? row.etapa : null,
    cerradaEn: row.cerradaEn,
    revision: row.revision,
  };
}

export function registerOpportunityRoutes(
  app,
  { scope, fail, validId, admin },
) {
  const path = "/api/oportunidades";
  function objectId(value, label) {
    if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value))
      throw fail(400, "Identificador inválido: " + label + ".");
    return new mongoose.Types.ObjectId(value);
  }

  function title(body) {
    const value = body?.titulo;
    if (typeof value !== "string" || !value.trim() || value.trim().length > 120)
      throw fail(400, "Introduce un título de entre 1 y 120 caracteres.");
    return value.trim();
  }

  const list = (filter) =>
    withNames(Oportunidad.find(filter).sort({ createdAt: -1, _id: -1 }));

  app.get(path, async (req, res) => {
    const filter = scope(req);
    const { asesor } = req.query;
    if (asesor !== undefined) {
      if (req.usuario.rol !== "Administrador")
        throw fail(403, "Filtro exclusivo para administradores.");
      filter.asesor = objectId(asesor, "asesor");
    }
    const estado = enumFilter(
      req.query.estado,
      estados,
      "Estado de oportunidad",
    );
    const etapa = enumFilter(req.query.etapa, etapas, "Etapa de oportunidad");
    if (estado)
      filter.etapa =
        estado === "Abierta" ? { $in: etapas.slice(0, -2) } : estado;
    if (etapa) {
      if (estado) filter.$and = [{ etapa }];
      else filter.etapa = etapa;
    }
    res.json(
      await listResult(
        req.query,
        Oportunidad,
        filter,
        list(filter),
        opportunityJson,
      ),
    );
  });

  app.get(path + "/embudo", admin, async (req, res) => {
    const { asesor, estado } = req.query;
    const filter = {};
    if (asesor !== undefined) filter.asesor = objectId(asesor, "asesor");
    if (estado !== undefined) {
      if (!estados.includes(estado))
        throw fail(400, "Estado de oportunidad inválido.");
      filter.etapa =
        estado === "Abierta" ? { $in: etapas.slice(0, -2) } : estado;
    }
    const grupos = new Map(etapas.map((etapa) => [etapa, []]));
    for (const row of await list(filter))
      grupos.get(row.etapa).push(opportunityJson(row));
    res.json(
      Array.from(grupos, ([etapa, oportunidades]) => ({
        etapa,
        oportunidades,
        cantidad: oportunidades.length,
      })),
    );
  });

  app.post(path, async (req, res) => {
    const titulo = title(req.body);
    const solicitud = objectId(req.body.solicitud, "solicitud");
    const cliente = objectId(req.body.cliente, "cliente");
    const contacto = await Cliente.findOne({
      _id: cliente,
      "solicitudes._id": solicitud,
      ...scope(req),
    }).select("asesor");
    if (!contacto)
      throw fail(404, "Solicitud no encontrada para ese contacto.");
    if (
      req.body.asesor !== undefined &&
      !contacto.asesor.equals(objectId(req.body.asesor, "asesor"))
    )
      throw fail(400, "El responsable debe ser el propietario del contacto.");
    const created = await Oportunidad.create({
      titulo,
      cliente,
      solicitud,
      asesor: contacto.asesor,
    });
    const row = await withNames(Oportunidad.findById(created._id));
    res.status(201).json(opportunityJson(row));
  });

  app.get(path + "/:id", validId, async (req, res) => {
    const row = await withNames(
      Oportunidad.findOne({ _id: req.params.id, ...scope(req) }),
    );
    if (!row) throw fail(404, "Oportunidad no encontrada.");
    res.json(opportunityJson(row));
  });

  app.put(path + "/:id", validId, async (req, res) => {
    const filter = { _id: req.params.id, ...scope(req) };
    const current = await Oportunidad.findOne(filter).lean();
    if (!current) throw fail(404, "Oportunidad no encontrada.");
    const { etapa, revision } = req.body || {};
    if (
      !etapas.includes(etapa) ||
      !Number.isSafeInteger(revision) ||
      revision < 0
    )
      throw fail(400, "Etapa o revisión inválida.");
    if (
      ["cliente", "solicitud", "asesor"].some((key) =>
        Object.hasOwn(req.body, key),
      )
    )
      throw fail(
        400,
        "La oportunidad conserva el cliente, solicitud y responsable asignados.",
      );
    const cerradaEn = etapasCerradas.includes(etapa)
      ? etapa === current.etapa
        ? current.cerradaEn
        : new Date()
      : null;
    const row = await withNames(
      Oportunidad.findOneAndUpdate(
        { ...filter, revision },
        {
          $set: { titulo: title(req.body), etapa, cerradaEn },
          $inc: { revision: 1 },
        },
        { new: true, runValidators: true },
      ),
    );
    if (!row)
      throw fail(
        409,
        "La oportunidad cambió. Recarga el detalle y vuelve a intentarlo.",
      );
    res.json(opportunityJson(row));
  });
}
