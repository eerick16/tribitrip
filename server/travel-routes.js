import mongoose from "mongoose";
import { Cliente } from "./models.js";

export function registerTravelRoutes(app, { scope, fail, validId }) {
  function payload(body, fields) {
    const data = {};
    for (const [field, type] of Object.entries(fields)) {
      if (body?.[field] === undefined) continue;
      if (typeof body[field] !== type)
        throw fail(400, "Campo inválido: " + field);
      data[field] = body[field];
    }
    return data;
  }

  const requestData = (body) =>
    payload(body, {
      destino: "string",
      salida: "string",
      regreso: "string",
      presupuesto: "number",
      cantidadViajeros: "number",
      necesidades: "string",
      estado: "string",
    });
  function travelerData(body) {
    const data = payload(body, {
      nombre: "string",
      parentesco: "string",
      tipo: "string",
      nacimiento: "string",
    });
    if (data.nacimiento === "") data.nacimiento = null;
    return data;
  }

  function requestJson(cliente, solicitud, detail = false) {
    const { _id, viajeros, ...fields } = solicitud.toObject();
    delete fields.revision;
    const result = {
      ...fields,
      id: String(_id),
      cliente: { id: String(cliente._id), nombre: cliente.nombre },
      asesor: String(cliente.asesor),
    };
    if (detail) {
      result.viajeros = viajeros.map(({ _id, ...data }) => ({
        ...data,
        id: String(_id),
      }));
    }
    return result;
  }

  async function findRequest(req) {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const cliente = await Cliente.findOne({
      ...scope(req),
      "solicitudes._id": id,
    }).select("nombre asesor solicitudes");
    const solicitud = cliente?.solicitudes.id(id);
    if (!solicitud) throw fail(404, "Solicitud no encontrada.");
    return { cliente, solicitud };
  }

  async function validateRequest(solicitud) {
    try {
      await solicitud.validate();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidatorError)
        throw fail(
          400,
          "Revisa el campo " +
            error.path +
            ". " +
            (error.path === "cantidadViajeros"
              ? "Indica una cantidad entera que cubra a los viajeros registrados."
              : error.path === "regreso"
                ? "Indica una fecha válida igual o posterior a la salida."
                : "Introduce un valor válido."),
        );
      throw error;
    }
  }

  async function saveRequest(req, cliente, solicitud) {
    const revision = solicitud.revision ?? 0;
    solicitud.revision = revision + 1;
    solicitud.updatedAt = new Date();
    await validateRequest(solicitud);
    // La solicitud ya fue validada. El middleware agregaria una escritura anidada al reemplazo.
    const result = await Cliente.collection.updateOne(
      {
        _id: cliente._id,
        ...scope(req),
        solicitudes: {
          $elemMatch: {
            _id: solicitud._id,
            revision: revision === 0 ? { $in: [0, null] } : revision,
          },
        },
      },
      {
        $set: {
          "solicitudes.$": solicitud.toObject(),
          updatedAt: solicitud.updatedAt,
        },
      },
    );
    if (!result.matchedCount)
      throw fail(
        409,
        "La solicitud cambió. Recarga el detalle e inténtalo de nuevo.",
      );
  }

  app.get("/api/solicitudes", async (req, res) => {
    const rows = await Cliente.aggregate([
      { $match: { ...scope(req), "solicitudes.0": { $exists: true } } },
      { $unwind: "$solicitudes" },
      { $sort: { "solicitudes.createdAt": -1, "solicitudes._id": -1 } },
      {
        $project: {
          _id: 0,
          id: { $toString: "$solicitudes._id" },
          cliente: { id: { $toString: "$_id" }, nombre: "$nombre" },
          asesor: { $toString: "$asesor" },
          destino: "$solicitudes.destino",
          salida: "$solicitudes.salida",
          regreso: "$solicitudes.regreso",
          estado: "$solicitudes.estado",
          cantidadViajeros: "$solicitudes.cantidadViajeros",
        },
      },
    ]);
    res.json(rows);
  });

  app.post("/api/solicitudes", async (req, res) => {
    const { cliente: id } = req.body || {};
    if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id))
      throw fail(400, "Selecciona un cliente válido.");
    const filter = { _id: id, ...scope(req) };
    const cliente = await Cliente.findOne(filter).select("nombre asesor");
    if (!cliente) throw fail(404, "Contacto no encontrado.");
    const now = new Date();
    const solicitud = new Cliente().solicitudes.create({
      ...requestData(req.body),
      createdAt: now,
      updatedAt: now,
    });
    await validateRequest(solicitud);
    const result = await Cliente.updateOne(filter, {
      $push: { solicitudes: solicitud.toObject() },
    });
    if (!result.matchedCount) throw fail(404, "Contacto no encontrado.");
    res.status(201).json(requestJson(cliente, solicitud, true));
  });

  app.get("/api/solicitudes/:id", validId, async (req, res) => {
    const { cliente, solicitud } = await findRequest(req);
    res.json(requestJson(cliente, solicitud, true));
  });

  app.put("/api/solicitudes/:id", validId, async (req, res) => {
    const { cliente, solicitud } = await findRequest(req);
    solicitud.set(requestData(req.body));
    await saveRequest(req, cliente, solicitud);
    res.json(requestJson(cliente, solicitud, true));
  });

  app.get("/api/solicitudes/:id/viajeros", validId, async (req, res) => {
    const { cliente, solicitud } = await findRequest(req);
    res.json(requestJson(cliente, solicitud, true).viajeros);
  });

  app.post("/api/solicitudes/:id/viajeros", validId, async (req, res) => {
    const { cliente, solicitud } = await findRequest(req);
    if (solicitud.viajeros.length >= solicitud.cantidadViajeros)
      throw fail(
        409,
        "Aumenta la cantidad de viajeros de la solicitud para registrar otro.",
      );
    const now = new Date();
    solicitud.viajeros.push({
      ...travelerData(req.body),
      createdAt: now,
      updatedAt: now,
    });
    await saveRequest(req, cliente, solicitud);
    res.status(201).json(requestJson(cliente, solicitud, true));
  });

  app.put(
    "/api/solicitudes/:id/viajeros/:viajeroId",
    validId,
    async (req, res) => {
      if (!mongoose.isObjectIdOrHexString(req.params.viajeroId))
        throw fail(400, "Identificador de viajero inválido.");
      const { cliente, solicitud } = await findRequest(req);
      const viajero = solicitud.viajeros.id(req.params.viajeroId);
      if (!viajero) throw fail(404, "Viajero no encontrado.");
      viajero.set({ ...travelerData(req.body), updatedAt: new Date() });
      await saveRequest(req, cliente, solicitud);
      res.json(requestJson(cliente, solicitud, true));
    },
  );
}
