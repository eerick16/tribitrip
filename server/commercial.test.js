import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion } from "./quote-models.js";
import { Reserva } from "./reservation-model.js";
import { reportRange } from "./commercial-routes.js";
import { tokenHash } from "./security.js";

const oid = () => new mongoose.Types.ObjectId();

test("el periodo incluye ambos días en Ciudad de México y limita rangos", () => {
  const fail = (status) => Object.assign(new Error(), { status });
  const now = new Date("2032-03-01T05:59:59Z");
  const month = reportRange({}, fail, now);
  assert.equal(month.desde, "2032-02-01");
  assert.equal(month.hasta, "2032-02-29");
  assert.equal(month.dates.$gte.toISOString(), "2032-02-01T06:00:00.000Z");
  assert.equal(month.dates.$lt.toISOString(), "2032-03-01T06:00:00.000Z");
  const historical = reportRange(
    { desde: "2021-04-04", hasta: "2021-04-04" },
    fail,
  );
  assert.equal(historical.dates.$gte.toISOString(), "2021-04-04T06:00:00.000Z");
  assert.equal(historical.dates.$lt.toISOString(), "2021-04-05T05:00:00.000Z");
  for (const input of [
    { desde: ["2032-02-01"] },
    { desde: "2031-02-29" },
    { desde: "2032-03-02" },
    { desde: "2020-01-01", hasta: "2032-02-15" },
  ])
    assert.throws(() => reportRange(input, fail, now), { status: 400 });
});

function matches(row, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$and") return condition.every((item) => matches(row, item));
    if (key === "$or") return condition.some((item) => matches(row, item));
    const value = row[key];
    if (condition instanceof RegExp) return condition.test(value);
    if (condition?.$in) return condition.$in.includes(value);
    if (condition?.$exists !== undefined)
      return condition.$exists === (value !== undefined);
    if (condition?.$gte !== undefined && !(value >= condition.$gte))
      return false;
    if (condition?.$lt !== undefined && !(value < condition.$lt)) return false;
    if (condition?.$gte !== undefined || condition?.$lt !== undefined)
      return true;
    if (condition === null) return value == null;
    return value instanceof mongoose.Types.ObjectId
      ? value.equals(condition)
      : value === condition;
  });
}

function query(rows, transform, single = false) {
  let start = 0;
  let end;
  let withTravel = false;
  let lean = false;
  const populated = new Set();
  return {
    populate(field) {
      populated.add(field);
      return this;
    },
    select(fields) {
      withTravel = fields === "+solicitudes";
      return this;
    },
    sort() {
      return this;
    },
    skip(value) {
      start = value;
      return this;
    },
    limit(value) {
      end = start + value;
      return this;
    },
    lean() {
      lean = true;
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve()
        .then(() => {
          const data = rows
            .slice(start, end)
            .map((row) => transform(row, { withTravel, lean, populated }));
          return single ? (data[0] ?? null) : data;
        })
        .then(resolve, reject);
    },
  };
}

test("API aísla la ficha, protege ediciones y combina filtros con paginación", async (t) => {
  const asesor = oid();
  const otro = oid();
  const people = [
    { _id: asesor, nombre: "Responsable" },
    { _id: otro, nombre: "Otro asesor" },
  ];
  const viaje = {
    _id: oid(),
    destino: "Cancún",
    estado: "Nueva",
    salida: "2030-01-02",
    regreso: "2030-01-08",
    viajeros: [
      { _id: oid(), nombre: "Viajera", parentesco: "Titular", tipo: "Adulto" },
    ],
  };
  const contacts = [
    {
      _id: oid(),
      asesor,
      nombre: "Ana (Rojo)",
      correo: "ana@example.test",
      telefono: "5551234567",
      estado: "Activo",
      solicitudes: [viaje],
    },
    {
      _id: oid(),
      asesor: otro,
      nombre: "Ana ajena",
      correo: "ajena@example.test",
      telefono: "5552222222",
      estado: "Activo",
      solicitudes: [],
    },
    {
      _id: oid(),
      asesor,
      nombre: "Ana nueva",
      correo: "nueva@example.test",
      telefono: "5553456789",
      estado: "Activo",
      solicitudes: [],
    },
  ];
  const opportunities = [
    {
      _id: oid(),
      cliente: contacts[0]._id,
      asesor,
      titulo: "Viaje",
      etapa: "Cotización",
      solicitud: viaje._id,
    },
    {
      _id: oid(),
      cliente: contacts[1]._id,
      asesor: otro,
      titulo: "Ajena",
      etapa: "Ganada",
      solicitud: oid(),
    },
  ];
  const quotes = [
    {
      _id: oid(),
      cliente: contacts[0]._id,
      oportunidad: opportunities[0]._id,
      asesor,
      estado: "Aceptada",
      folio: "COT-UNO",
      vigencia: "2000-01-01",
      totalCentavos: 12500,
    },
    {
      _id: oid(),
      cliente: contacts[1]._id,
      oportunidad: opportunities[1]._id,
      asesor: otro,
      estado: "Aceptada",
      folio: "COT-OTRA",
      vigencia: "2000-01-01",
      totalCentavos: 25000,
    },
    {
      _id: oid(),
      cliente: contacts[0]._id,
      oportunidad: opportunities[0]._id,
      asesor,
      estado: "Enviada",
      folio: "COT-VENCIDA",
      vigencia: "2000-01-01",
      totalCentavos: 18500,
    },
  ];
  const reservations = [
    {
      _id: oid(),
      cliente: contacts[0]._id,
      asesor,
      estado: "Confirmada",
      folio: "RES-UNO",
      totalCentavos: 12500,
      clienteDocumento: { nombre: "Nombre histórico" },
      pagadoCentavos: 100,
    },
    {
      _id: oid(),
      cliente: contacts[1]._id,
      asesor: otro,
      estado: "Confirmada",
      folio: "RES-OTRA",
      totalCentavos: 25000,
      pagadoCentavos: 0,
    },
  ];
  const users = {
    admin: { _id: oid(), rol: "Administrador", activo: true },
    asesor: { _id: asesor, rol: "Asesor", activo: true },
  };
  mockSessions(t, users);
  function output(row, { withTravel, lean, populated }) {
    const copy = { ...row };
    if (populated.has("asesor"))
      copy.asesor = people.find(({ _id }) => _id.equals(row.asesor));
    if (populated.has("cliente"))
      copy.cliente = contacts.find(({ _id }) => _id.equals(row.cliente));
    if (populated.has("oportunidad"))
      copy.oportunidad = opportunities.find(({ _id }) =>
        _id.equals(row.oportunidad),
      );
    if (!withTravel) delete copy.solicitudes;
    return lean ? copy : { ...copy, toObject: () => ({ ...copy }) };
  }
  for (const [model, fixtures] of [
    [Cliente, contacts],
    [Oportunidad, opportunities],
    [Cotizacion, quotes],
    [Reserva, reservations],
  ]) {
    t.mock.method(model, "find", (filter) =>
      query(
        fixtures.filter((item) => matches(item, filter)),
        output,
      ),
    );
    t.mock.method(
      model,
      "countDocuments",
      async (filter) => fixtures.filter((item) => matches(item, filter)).length,
    );
  }
  t.mock.method(Cliente, "findOne", (filter) =>
    query(
      contacts.filter((item) => matches(item, filter)),
      output,
      true,
    ),
  );
  t.mock.method(Cliente, "aggregate", async ([{ $match }]) => [
    {
      _id: "Activo",
      cantidad: contacts.filter((item) => matches(item, $match)).length,
    },
  ]);
  t.mock.method(Cliente, "exists", async (filter) =>
    contacts.some((item) => matches(item, filter)),
  );
  t.mock.method(
    Cliente,
    "findOneAndUpdate",
    async (filter, update, options) => {
      assert.equal(options.runValidators, true);
      const contact = contacts.find((item) => matches(item, filter));
      if (!contact) return null;
      if (
        contacts.some(
          (item) =>
            item !== contact &&
            (item.correo === update.$set.correo ||
              item.telefono === update.$set.telefono),
        )
      )
        throw Object.assign(new Error("duplicado"), { code: 11000 });
      Object.assign(contact, update.$set);
      contact.revisionContacto =
        (contact.revisionContacto ?? 0) + update.$inc.revisionContacto;
      return output(contact, { populated: new Set() });
    },
  );

  const call = await http(t);
  const contactPath = "/clientes/" + contacts[0]._id;
  assert.equal((await call(contactPath + "/ficha")).status, 401);
  assert.equal(
    (await call("/clientes/" + contacts[1]._id + "/ficha", "asesor")).status,
    404,
  );
  const ficha = (await call(contactPath + "/ficha", "asesor")).body;
  assert.equal(ficha.cliente.asesor, "Responsable");
  assert.equal(ficha.cliente.solicitudes, undefined);
  assert.equal(ficha.solicitudes[0].viajeros[0].nombre, "Viajera");
  assert.equal(ficha.oportunidades[0].titulo, "Viaje");
  assert.deepEqual(
    ficha.cotizaciones.map(({ estado }) => estado),
    ["Aceptada", "Vencida"],
  );
  assert.equal(ficha.reservas[0].folio, "RES-UNO");
  const edits = await Promise.all([
    call(contactPath, "asesor", "PUT", {
      nombre: "Ana actualizada",
      revisionContacto: 0,
      asesor: String(otro),
    }),
    call(contactPath, "admin", "PUT", {
      nombre: "Ana actualizada",
      revisionContacto: 0,
    }),
  ]);
  assert.deepEqual(edits.map(({ status }) => status).sort(), [200, 409]);
  assert.equal(
    (await call(contactPath, "asesor")).body.nombre,
    "Ana actualizada",
  );
  assert.equal(String(contacts[0].asesor), String(asesor));
  assert.equal(reservations[0].clienteDocumento.nombre, "Nombre histórico");
  assert.equal(
    (
      await call(contactPath, "asesor", "PUT", {
        correo: contacts[1].correo,
        revisionContacto: 1,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call("/clientes/" + contacts[1]._id, "asesor", "PUT", {
        nombre: "Cambio ajeno",
        revisionContacto: 0,
      })
    ).status,
    404,
  );
  assert.equal(
    (await call(contactPath, "asesor", "PUT", { revisionContacto: "1" }))
      .status,
    400,
  );

  const page = await call(
    "/clientes?q=ANA&estado=Activo&pagina=2&limite=1",
    "asesor",
  );
  assert.equal(page.body.total, 2);
  assert.deepEqual(page.body.resumen, { Activo: 2 });
  assert.equal(page.body.items[0].id, String(contacts[2]._id));
  assert.equal(
    (
      await call(
        "/clientes?q=" + encodeURIComponent("(555) 123-4567"),
        "asesor",
      )
    ).body.length,
    1,
  );
  assert.equal(
    (await call("/clientes?q=example.test", "asesor")).body.length,
    2,
  );
  assert.equal((await call("/clientes?q=.*", "asesor")).body.length, 0);
  assert.equal((await call("/clientes?pagina=0", "asesor")).status, 400);
  assert.equal((await call("/clientes?limite=101", "asesor")).status, 400);
  assert.equal(
    (await call("/clientes?estado=Activo&estado=Inactivo", "asesor")).status,
    400,
  );
  assert.equal(
    (await call("/oportunidades?asesor=" + asesor, "asesor")).status,
    403,
  );
  assert.equal((await call("/oportunidades?asesor=no", "admin")).status, 400);
  assert.equal(
    (
      await call(
        "/oportunidades?asesor=" + otro + "&estado=Ganada&pagina=1",
        "admin",
      )
    ).body.total,
    1,
  );
  assert.equal(
    (await call("/oportunidades?estado=Abierta&etapa=Ganada", "asesor")).body
      .length,
    0,
  );
  assert.equal(
    (await call("/cotizaciones?q=COT-&estado=Vencida&pagina=1", "asesor")).body
      .items[0].folio,
    "COT-VENCIDA",
  );
  assert.equal(
    (await call("/cotizaciones?estado=Enviada", "asesor")).body.length,
    0,
  );
  assert.equal((await call("/cotizaciones?q=OTRA", "asesor")).body.length, 0);
  assert.equal(
    (await call("/reservas?q=RES-&estado=Confirmada&pagina=1", "asesor")).body
      .total,
    1,
  );
  assert.equal((await call("/reservas?q=OTRA", "asesor")).body.length, 0);
});

test("dashboard y reportes usan agregaciones protegidas y la misma definición de ventas", async (t) => {
  const asesor = oid();
  mockSessions(t, {
    admin: { _id: oid(), rol: "Administrador", activo: true },
    asesor: { _id: asesor, rol: "Asesor", activo: true },
  });
  const start = new Date("2032-02-01T06:00:00.000Z");
  const before = new Date(start - 1);
  const end = new Date("2032-03-01T06:00:00.000Z");
  const records = [
    {
      estado: "Confirmada",
      asesor,
      totalCentavos: 10000,
      pagadoCentavos: 555,
      createdAt: start,
    },
    {
      estado: "Cancelada",
      asesor,
      totalCentavos: 99999,
      pagadoCentavos: 555,
      createdAt: start,
    },
    {
      estado: "Pendiente de pago",
      totalCentavos: 2000,
      pagadoCentavos: 100,
      createdAt: before,
    },
    {
      estado: "Completada",
      totalCentavos: 3000,
      pagadoCentavos: 100,
      createdAt: end,
    },
  ];
  const requests = [
    { destino: "Ciudad  de México", createdAt: start },
    { destino: "ciudad de mexico", createdAt: new Date(start.getTime() + 1) },
    { destino: "Mérida", createdAt: start },
    { destino: "Cancún", createdAt: before },
  ];
  const groupRows = (rows, key) => {
    const groups = new Map();
    for (const value of rows)
      groups.set(value[key], (groups.get(value[key]) ?? 0) + 1);
    return [...groups].map(([_id, cantidad]) => ({ _id, cantidad }));
  };
  t.mock.method(Cliente, "aggregate", (pipeline) => {
    if (pipeline.length <= 2) {
      assert.equal(pipeline.at(-1).$group._id, "$estado");
      return groupRows(
        [
          { estado: "Activo", asesor },
          { estado: "Inactivo" },
          { estado: "Prospecto" },
        ].filter((item) => matches(item, pipeline[0].$match ?? {})),
        "estado",
      );
    }
    return {
      collation(options) {
        assert.deepEqual(options, { locale: "es", strength: 1 });
        const match = pipeline.find(
          ({ $match }, i) => i > 1 && $match?.["solicitudes.createdAt"],
        );
        assert.ok(match);
        assert.ok(pipeline.some(({ $unwind }) => $unwind === "$solicitudes"));
        assert.ok(pipeline.some(({ $project }) => $project?.destino?.$reduce));
        const filtered = requests.filter((item) =>
          matches(item, { createdAt: match.$match["solicitudes.createdAt"] }),
        );
        const normalized = filtered.map(({ destino }) => ({
          destino: destino
            .replace(/\s+/g, " ")
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase(),
        }));
        return groupRows(normalized, "destino").map(({ _id, cantidad }) => ({
          destino: _id,
          cantidad,
        }));
      },
    };
  });
  t.mock.method(Oportunidad, "aggregate", async (pipeline) => {
    assert.equal(pipeline.at(-1).$group._id, "$etapa");
    return groupRows(
      [
        { etapa: "Ganada", asesor },
        { etapa: "Ganada" },
        { etapa: "Perdida" },
        { etapa: "Cotización", asesor },
        { etapa: "Negociación" },
      ].filter((item) => matches(item, pipeline[0].$match ?? {})),
      "etapa",
    );
  });
  t.mock.method(Reserva, "aggregate", async ([match, group]) => {
    assert.equal(group.$group.totalCentavos.$sum, "$totalCentavos");
    const rows = records.filter((item) => matches(item, match.$match));
    if (!rows.length) return [];
    const total = {
      cantidad: rows.length,
      totalCentavos: rows.reduce((sum, item) => sum + item.totalCentavos, 0),
    };
    if (group.$group._id === null) return [total];
    assert.equal(
      group.$group._id.$dateToString.timezone,
      "America/Mexico_City",
    );
    return [{ ...total, periodo: "2032-02" }];
  });
  const call = await http(t);
  assert.equal((await call("/dashboard")).status, 401);
  const asesorDashboard = await call("/dashboard?asesor=" + oid(), "asesor");
  assert.equal(asesorDashboard.status, 200);
  assert.deepEqual(asesorDashboard.body, {
    clientes: 1,
    prospectos: 0,
    abiertas: 1,
    ganadas: 1,
    perdidas: 0,
    conversion: 1,
    ventasCentavos: 10000,
    reservas: 1,
  });
  assert.equal((await call("/reportes/comerciales", "asesor")).status, 403);
  const dashboard = (await call("/dashboard", "admin")).body;
  assert.deepEqual(dashboard, {
    clientes: 2,
    prospectos: 1,
    abiertas: 2,
    ganadas: 2,
    perdidas: 1,
    conversion: 2 / 3,
    ventasCentavos: 15000,
    reservas: 3,
  });
  const reports = "/reportes/comerciales";
  const february = (
    await call(reports + "?desde=2032-02-01&hasta=2032-02-29", "admin")
  ).body;
  assert.deepEqual(february.ventas, [
    { periodo: "2032-02", cantidad: 1, totalCentavos: 10000 },
  ]);
  assert.deepEqual(
    february.destinos.map(({ cantidad }) => cantidad),
    [2, 1],
  );
  const empty = (
    await call(reports + "?desde=2032-04-01&hasta=2032-04-10", "admin")
  ).body;
  assert.deepEqual([empty.destinos, empty.ventas], [[], []]);
  assert.equal(
    (await call(reports + "?desde=2032-03-01&hasta=2032-02-01", "admin"))
      .status,
    400,
  );
  records.length = 0;
  assert.equal((await call("/dashboard", "admin")).body.ventasCentavos, 0);
});

function mockSessions(t, users) {
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({
      usuario: Object.entries(users).find(
        ([session]) => tokenHash(session) === token,
      )?.[1],
    }),
  }));
}

async function http(t) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return async (path, session, method = "GET", body) => {
    const headers = {
      Origin: process.env.APP_ORIGIN || "http://localhost:5173",
    };
    if (session) headers.Cookie = "session=" + session;
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api" + path,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    return { status: res.status, body: await res.json() };
  };
}
