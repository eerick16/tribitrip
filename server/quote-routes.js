import mongoose from "mongoose"; 
import { aCentavos, maxConceptos } from "../shared/cotizaciones.js";
import { Cliente } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion, ServicioTuristico } from "./quote-models.js";
import { isCalendarDate } from "./travel-models.js";
import {
  datosCliente,
  estadosCotizacion,
  estadoVigente,
  fechaCiudadMexico,
  transicionesDisponibles,
  versionActual,
} from "./quote-lifecycle.js";
import { enumFilter, listResult, literal, searchText } from "./list-queries.js";
import { quoteDocument } from "./quote-document.js";

const asJson = ({ _id, ...data }) => ({ id: String(_id), ...data });
const quoteQuery = (query) =>
  query.populate("cliente", "nombre").populate("oportunidad", "titulo").lean();
const conflict =
  "La cotización cambió. Recarga el detalle y vuelve a intentarlo.";

function quoteJson(quote) {
  const { historial, ...data } = quote;
  delete data.clienteDocumento;
  return {
    ...asJson(data),
    estado: estadoVigente(data),
    version: data.version ?? 1,
    versionAceptada: data.versionAceptada ?? null,
    transiciones: transicionesDisponibles(data),
    versiones: historial?.map(({ version, estado, versionCreadaEn }) => ({
      version,
      estado,
      versionCreadaEn,
    })),
  };
}

export function registerQuoteRoutes(app, { scope, fail, validId }) {
  const path = "/api/cotizaciones";

  function id(value, name) {
    if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value))
      throw fail(400, "Identificador inválido: " + name + ".");
    return new mongoose.Types.ObjectId(value);
  }

  function text(value, field, max, required = false) {
    if (
      typeof value !== "string" ||
      value.trim().length > max ||
      (required && !value.trim())
    )
      throw fail(400, "Revisa el campo " + field + ".");
    return value.trim();
  }

  function amount(value, field) {
    const cents = aCentavos(value);
    if (cents === null)
      throw fail(
        400,
        "Importe inválido: " + field + ". Usa hasta dos decimales.",
      );
    return cents;
  }

  function searchTerm(value, field) {
    const term = text(value ?? "", field, 120);
    return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  async function quoteData(body, previous = []) {
    if (!isCalendarDate(body?.vigencia))
      throw fail(400, "Introduce una fecha de vigencia válida.");
    if (
      !Array.isArray(body.conceptos) ||
      !body.conceptos.length ||
      body.conceptos.length > maxConceptos
    )
      throw fail(400, "Agrega entre 1 y " + maxConceptos + " conceptos.");
    const previousById = new Map(
      previous.map((item) => [String(item._id), item]),
    );
    const seen = new Set();
    const lines = body.conceptos.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw fail(400, "Concepto inválido.");
      const saved =
        item.id === undefined
          ? null
          : previousById.get(String(id(item.id, "concepto")));
      if (item.id !== undefined && (!saved || seen.has(item.id.toLowerCase())))
        throw fail(
          400,
          "El concepto indicado no pertenece a esta cotización o está repetido.",
        );
      if (saved) seen.add(String(saved._id));
      if (saved && item.servicio !== undefined)
        throw fail(
          400,
          "Para sustituir el servicio, elimina el concepto y agrega uno nuevo.",
        );
      return {
        saved,
        servicio:
          saved?.servicio ??
          (item.servicio === undefined ? null : id(item.servicio, "servicio")),
        descripcion: text(
          item.descripcion,
          "descripción del concepto " + (index + 1),
          400,
          true,
        ),
        cantidad: typeof item.cantidad === "number" ? item.cantidad : NaN,
        precioUnitarioCentavos: amount(
          item.precioUnitario,
          "precio unitario del concepto " + (index + 1),
        ),
      };
    });
    const serviceIds = lines
      .filter(({ saved, servicio }) => !saved && servicio)
      .map(({ servicio }) => servicio);
    const services = serviceIds.length
      ? await ServicioTuristico.find({ _id: { $in: serviceIds } }).lean()
      : [];
    const byId = new Map(
      services.map((service) => [String(service._id), service]),
    );
    const conceptos = lines.map(({ saved, servicio, ...data }) => {
      if (saved)
        return {
          ...data,
          _id: saved._id,
          servicio,
          referencia: saved.referencia,
        };
      if (!servicio) return data;
      const service = byId.get(String(servicio));
      if (!service) throw fail(404, "Servicio turístico no encontrado.");
      const {
        nombre,
        descripcion,
        destino,
        proveedor,
        precioReferenciaCentavos,
      } = service;
      return {
        ...data,
        servicio,
        referencia: {
          nombre,
          descripcion,
          destino,
          proveedor,
          precioReferenciaCentavos,
        },
      };
    });
    return {
      vigencia: body.vigencia,
      conceptos,
      impuestosCentavos: amount(body.impuestos ?? "0", "impuestos"),
      cargosCentavos: amount(body.cargos ?? "0", "cargos"),
      condiciones: text(body.condiciones ?? "", "condiciones", 2000),
      observaciones: text(body.observaciones ?? "", "observaciones", 2000),
    };
  }

  async function listQuotes(params, filter) {
    const q = searchText(params.q);
    if (q) filter.folio = literal(q);
    const estado = enumFilter(
      params.estado,
      estadosCotizacion,
      "Estado de cotización",
    );
    const today = fechaCiudadMexico();
    const draft = { $or: [{ estado: "Borrador" }, { estado: null }] };
    if (estado === "Vencida")
      filter.$or = [
        { estado: "Vencida" },
        {
          vigencia: { $lt: today },
          $or: [{ estado: "Enviada" }, ...draft.$or],
        },
      ];
    else if (estado === "Borrador")
      Object.assign(filter, draft, { vigencia: { $gte: today } });
    else if (estado === "Enviada")
      Object.assign(filter, { estado, vigencia: { $gte: today } });
    else if (estado) filter.estado = estado;
    return listResult(
      params,
      Cotizacion,
      filter,
      quoteQuery(
        Cotizacion.find(filter)
          .select(
            "-conceptos -condiciones -observaciones -historial -clienteDocumento",
          )
          .sort({ createdAt: -1, _id: -1 }),
      ),
      quoteJson,
    );
  }

  async function editableQuote(req) {
    const quote = await Cotizacion.findOne({
      _id: req.params.id,
      ...scope(req),
    });
    if (!quote) throw fail(404, "Cotización no encontrada.");
    const { revision } = req.body || {};
    if (!Number.isSafeInteger(revision) || revision < 0)
      throw fail(400, "Revisión inválida.");
    if (quote.revision !== revision) throw fail(409, conflict);
    return quote;
  }

  async function saveQuote(quote) {
    try {
      await quote.save();
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError)
        throw fail(409, conflict);
      if (error.code === 11000 && error.keyPattern?.oportunidad)
        throw fail(409, "La oportunidad ya tiene una cotización aceptada.");
      if (error.code === 10334 || error.code === 17419)
        throw fail(
          413,
          "El historial alcanzó el límite de almacenamiento de esta cotización.",
        );
      throw error;
    }
  }

  async function savedVersion(req) {
    const version = Number(req.params.version);
    if (
      !/^[1-9]\d*$/.test(req.params.version) ||
      !Number.isSafeInteger(version)
    )
      throw fail(400, "Número de versión inválido.");
    const quote = await Cotizacion.findOne({
      _id: req.params.id,
      ...scope(req),
    })
      .populate("cliente", "nombre correo telefono")
      .lean();
    if (!quote) throw fail(404, "Cotización no encontrada.");
    const current = versionActual(quote);
    const selected =
      current.version === version
        ? current
        : quote.historial?.find((item) => item.version === version);
    if (!selected) throw fail(404, "Versión de cotización no encontrada.");
    return {
      ...selected,
      folio: quote.folio,
      id: String(quote._id),
      versionAceptada: quote.versionAceptada ?? null,
      cliente: quote.cliente?._id ?? null,
      oportunidad: quote.oportunidad,
      asesor: quote.asesor,
    };
  }

  app.get("/api/servicios-turisticos", async (req, res) => {
    const { q, destino } = req.query;
    const filter = {};
    if (q) {
      const term = searchTerm(q, "búsqueda");
      filter.$or = [{ nombre: term }, { destino: term }];
    }
    if (destino) filter.destino = searchTerm(destino, "destino");
    res.json(
      (
        await ServicioTuristico.find(filter).sort({ nombre: 1, _id: 1 }).lean()
      ).map(asJson),
    );
  });

  app.post("/api/servicios-turisticos", async (req, res) => {
    const body = req.body ?? {};
    const tipo =
      enumFilter(body.tipo, ["Servicio", "Paquete"], "Tipo de servicio") ??
      "Servicio";
    const servicio = await ServicioTuristico.create({
      nombre: text(body.nombre, "nombre", 150, true),
      descripcion: text(body.descripcion, "descripción", 400, true),
      tipo,
      categoria: text(body.categoria ?? "", "categoría", 100),
      destino: text(body.destino ?? "", "destino", 120),
      proveedor: text(body.proveedor ?? "", "proveedor", 150),
      precioReferenciaCentavos: amount(
        body.precioReferencia,
        "precio de referencia",
      ),
    });
    res.status(201).json(asJson(servicio.toObject()));
  });

  app.get("/api/servicios-turisticos/:id", validId, async (req, res) => {
    const servicio = await ServicioTuristico.findById(req.params.id).lean();
    if (!servicio) throw fail(404, "Servicio turístico no encontrado.");
    res.json(asJson(servicio));
  });

  app.get(path, async (req, res) =>
    res.json(await listQuotes(req.query, scope(req))),
  );
  app.get("/api/oportunidades/:id/cotizaciones", validId, async (req, res) => {
    const filter = scope(req);
    if (!(await Oportunidad.exists({ _id: req.params.id, ...filter })))
      throw fail(404, "Oportunidad no encontrada.");
    res.json(
      await listQuotes(req.query, { ...filter, oportunidad: req.params.id }),
    );
  });

  app.get(path + "/:id", validId, async (req, res) => {
    const quote = await quoteQuery(
      Cotizacion.findOne({ _id: req.params.id, ...scope(req) }).select(
        "-historial.conceptos -historial.clienteDocumento -historial.condiciones -historial.observaciones",
      ),
    );
    if (!quote) throw fail(404, "Cotización no encontrada.");
    res.json(quoteJson(quote));
  });
  app.get(path + "/:id/versiones/:version", validId, async (req, res) => {
    res.set("Cache-Control", "private, no-store").json(await savedVersion(req));
  });
  app.get(
    path + "/:id/versiones/:version/documento",
    validId,
    async (req, res) => {
      const version = await savedVersion(req);
      res
        .set("Cache-Control", "private, no-store")
        .type("html")
        .send(quoteDocument(version.folio, version));
    },
  );

  app.post(path, async (req, res) => {
    const cliente = id(req.body?.cliente, "cliente");
    const oportunidad = id(req.body?.oportunidad, "oportunidad");
    const related = await Oportunidad.findOne({
      _id: oportunidad,
      cliente,
      ...scope(req),
    }).select("asesor");
    const contacto =
      related &&
      (await Cliente.findOne({ _id: cliente, asesor: related.asesor })
        .select("nombre correo telefono")
        .lean());
    if (!contacto)
      throw fail(404, "Oportunidad no encontrada para ese cliente.");
    const _id = new mongoose.Types.ObjectId();
    const folio = "COT-" + String(_id).toUpperCase();
    const data = await quoteData(req.body);
    const quote = await Cotizacion.create({
      ...data,
      _id,
      folio,
      cliente,
      oportunidad,
      asesor: related.asesor,
      clienteDocumento: datosCliente(contacto),
      versionCreadaEn: new Date(),
    });
    res.status(201).json(quoteJson(quote.toObject()));
  });

  app.put(path + "/:id", validId, async (req, res) => {
    const quote = await editableQuote(req);
    if (quote.estado === "Aceptada")
      throw fail(409, "Una cotización aceptada queda bloqueada.");
    if (
      ["cliente", "oportunidad", "asesor", "folio"].some((field) =>
        Object.hasOwn(req.body, field),
      )
    )
      throw fail(
        400,
        "El folio y las relaciones de la cotización se conservan.",
      );
    const data = await quoteData(req.body, quote.conceptos);
    const before = quote.toObject();
    const contacto = await Cliente.findOne({
      _id: quote.cliente,
      asesor: quote.asesor,
    })
      .select("nombre correo telefono")
      .lean();
    if (!contacto)
      throw fail(404, "El cliente de la cotización no está disponible.");
    const client = datosCliente(contacto);
    const snapshot = versionActual(before);
    snapshot.clienteDocumento ??= client;
    quote.historial.push(snapshot);
    quote.set({
      ...data,
      version: snapshot.version + 1,
      estado: "Borrador",
      versionCreadaEn: new Date(),
      clienteDocumento: client,
      enviadaEn: null,
      resueltaEn: null,
    });
    quote.markModified("conceptos");
    await saveQuote(quote);
    res.json(quoteJson(quote.toObject()));
  });

  app.patch(path + "/:id/estado", validId, async (req, res) => {
    const quote = await editableQuote(req);
    const { estado } = req.body;
    if (!estadosCotizacion.includes(estado))
      throw fail(400, "Estado de cotización inválido.");
    const now = new Date();
    if (!transicionesDisponibles(quote, now).includes(estado))
      throw fail(
        409,
        "La transición no está permitida para el estado y vigencia actuales.",
      );
    if (!quote.clienteDocumento) {
      const contacto = await Cliente.findOne({
        _id: quote.cliente,
        asesor: quote.asesor,
      })
        .select("nombre correo telefono")
        .lean();
      quote.clienteDocumento = datosCliente(contacto);
    }
    quote.estado = estado;
    if (estado === "Enviada") quote.enviadaEn = now;
    else quote.resueltaEn = now;
    if (estado === "Aceptada") quote.versionAceptada = quote.version;
    await saveQuote(quote);
    res.json(quoteJson(quote.toObject()));
  });
}
