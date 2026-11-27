import { Cliente } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion } from "./quote-models.js";
import { estadoVigente, fechaCiudadMexico } from "./quote-lifecycle.js";
import { Reserva, transicionesReserva } from "./reservation-model.js";
import { isCalendarDate } from "./travel-models.js";

const zone = "America/Mexico_City";
const offset = new Intl.DateTimeFormat("en", {
  timeZone: zone,
  timeZoneName: "shortOffset",
});
const day = 86400000;
const saleStates = Object.keys(transicionesReserva).filter(
  (estado) => estado !== "Cancelada",
);
const salesMatch = { estado: { $in: saleStates } };

function midnight(utcDate) {
  let adjusted = utcDate;
  for (let i = 0; i < 3; i++) {
    const name = offset
      .formatToParts(adjusted)
      .find((part) => part.type === "timeZoneName").value;
    const [, sign, hours = "0", minutes = "0", seconds = "0"] =
      /^GMT(?:([+-])(\d+)(?::(\d+)(?::(\d+))?)?)?$/.exec(name);
    adjusted =
      utcDate -
      (sign === "-" ? -1 : 1) *
        (Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)) *
        1000;
  }
  return new Date(adjusted);
}

export function reportRange(params, fail, now = new Date()) {
  const today = fechaCiudadMexico(now);
  const desde = params.desde ?? today.slice(0, 7) + "-01";
  const hasta = params.hasta ?? today;
  if (!isCalendarDate(desde) || !isCalendarDate(hasta) || desde > hasta)
    throw fail(400, "Selecciona un rango de fechas válido.");
  const first = Date.parse(desde + "T00:00:00Z");
  const last = Date.parse(hasta + "T00:00:00Z");
  if (last - first >= 366 * day)
    throw fail(400, "El periodo puede incluir hasta 366 días.");
  return {
    desde,
    hasta,
    dates: { $gte: midnight(first), $lt: midnight(last + day) },
  };
}

const countGroup = (field) => ({
  $group: { _id: "$" + field, cantidad: { $sum: 1 } },
});
const sumGroup = (_id) => ({
  $group: {
    _id,
    cantidad: { $sum: 1 },
    totalCentavos: { $sum: "$totalCentavos" },
  },
});
const countMap = (rows) =>
  new Map(rows.map(({ _id, cantidad }) => [_id, cantidad]));

function normalizedDestination() {
  const whitespace = ["\t", "\n", "\r", "\u00a0"].reduce(
    (input, find) => ({ $replaceAll: { input, find, replacement: " " } }),
    { $ifNull: ["$solicitudes.destino", ""] },
  );
  return {
    $reduce: {
      input: { $split: [{ $trim: { input: whitespace } }, " "] },
      initialValue: "",
      in: {
        $cond: [
          { $eq: ["$$this", ""] },
          "$$value",
          {
            $cond: [
              { $eq: ["$$value", ""] },
              "$$this",
              { $concat: ["$$value", " ", "$$this"] },
            ],
          },
        ],
      },
    },
  };
}

const row = ({ _id, ...data }) => ({ id: String(_id), ...data });

export function registerCommercialRoutes(
  app,
  { scope, fail, validId, admin, clientJson },
) {
  app.get("/api/clientes/:id/ficha", validId, async (req, res) => {
    const access = scope(req);
    const cliente = await Cliente.findOne({ _id: req.params.id, ...access })
      .select("+solicitudes")
      .populate("asesor", "nombre");
    if (!cliente) throw fail(404, "Contacto no encontrado.");
    const filter = { ...access, cliente: cliente._id };
    const sort = { createdAt: -1, _id: -1 };
    const [oportunidades, cotizaciones, reservas] = await Promise.all([
      Oportunidad.find(filter)
        .select("titulo etapa solicitud")
        .sort(sort)
        .lean(),
      Cotizacion.find(filter)
        .select("folio estado version vigencia totalCentavos")
        .sort(sort)
        .lean(),
      Reserva.find(filter)
        .select("folio estado destino salida totalCentavos")
        .sort(sort)
        .lean(),
    ]);
    const solicitudes = [...cliente.solicitudes].reverse().map((solicitud) => ({
      id: String(solicitud._id),
      destino: solicitud.destino,
      salida: solicitud.salida,
      regreso: solicitud.regreso,
      estado: solicitud.estado,
      viajeros: solicitud.viajeros.map(({ _id, nombre, tipo, parentesco }) => ({
        id: String(_id),
        nombre,
        tipo,
        parentesco,
      })),
    }));
    const { asesor, ...datos } = clientJson(cliente);
    res.json({
      cliente: { ...datos, asesor: asesor?.nombre ?? null },
      solicitudes,
      oportunidades: oportunidades.map(row),
      cotizaciones: cotizaciones.map((item) =>
        row({
          ...item,
          estado: estadoVigente(item),
          version: item.version ?? 1,
        }),
      ),
      reservas: reservas.map(row),
    });
  });

  app.get("/api/dashboard", admin, async (req, res) => {
    const [clients, opportunities, [sales]] = await Promise.all([
      Cliente.aggregate([countGroup("estado")]),
      Oportunidad.aggregate([countGroup("etapa")]),
      Reserva.aggregate([{ $match: salesMatch }, sumGroup(null)]),
    ]);
    const byClient = countMap(clients);
    const byStage = countMap(opportunities);
    const ganadas = byStage.get("Ganada") ?? 0;
    const perdidas = byStage.get("Perdida") ?? 0;
    const abiertas =
      opportunities.reduce((sum, { cantidad }) => sum + cantidad, 0) -
      ganadas -
      perdidas;
    res.json({
      clientes: (byClient.get("Activo") ?? 0) + (byClient.get("Inactivo") ?? 0),
      prospectos: byClient.get("Prospecto") ?? 0,
      abiertas,
      ganadas,
      perdidas,
      conversion: ganadas + perdidas ? ganadas / (ganadas + perdidas) : 0,
      ventasCentavos: sales?.totalCentavos ?? 0,
      reservas: sales?.cantidad ?? 0,
    });
  });

  app.get("/api/reportes/comerciales", admin, async (req, res) => {
    const { desde, hasta, dates } = reportRange(req.query, fail);
    const [destinos, ventas] = await Promise.all([
      Cliente.aggregate([
        { $match: { "solicitudes.createdAt": dates } },
        { $unwind: "$solicitudes" },
        { $match: { "solicitudes.createdAt": dates } },
        {
          $project: {
            destino: normalizedDestination(),
            id: "$solicitudes._id",
            fecha: "$solicitudes.createdAt",
          },
        },
        { $match: { destino: { $ne: "" } } },
        { $sort: { fecha: -1, id: -1 } },
        {
          $group: {
            _id: "$destino",
            destino: { $first: "$destino" },
            cantidad: { $sum: 1 },
          },
        },
        { $sort: { cantidad: -1, destino: 1 } },
        { $project: { _id: 0, destino: 1, cantidad: 1 } },
      ]).collation({ locale: "es", strength: 1 }),
      Reserva.aggregate([
        { $match: { ...salesMatch, createdAt: dates } },
        sumGroup({
          $dateToString: {
            date: "$createdAt",
            format: "%Y-%m",
            timezone: zone,
          },
        }),
        { $sort: { _id: 1 } },
        {
          $project: { _id: 0, periodo: "$_id", cantidad: 1, totalCentavos: 1 },
        },
      ]),
    ]);
    res.json({ desde, hasta, destinos, ventas });
  });
}
