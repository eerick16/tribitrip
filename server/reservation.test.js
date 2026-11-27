import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion } from "./quote-models.js";
import { Reserva } from "./reservation-model.js";
import { tokenHash } from "./security.js";

const oid = () => new mongoose.Types.ObjectId();
const folio = (prefix, id = oid()) => prefix + "-" + String(id).toUpperCase();
const commercial = {
  conceptos: [
    {
      _id: oid(),
      descripcion: "Traslado",
      cantidad: 2,
      precioUnitarioCentavos: 5000,
      subtotalCentavos: 10000,
    },
  ],
  subtotalCentavos: 10000,
  impuestosCentavos: 1200,
  cargosCentavos: 100,
  totalCentavos: 11300,
  condiciones: "Según lo convenido",
  observaciones: "Llegada por la mañana",
  clienteDocumento: { nombre: "Contacto al aceptar" },
};
const dates = {
  destino: "Mérida",
  salida: "2032-06-01",
  regreso: "2032-06-05",
};
const todayPayment = () => ({
  clave: randomUUID(),
  fecha: "2020-02-29",
  monto: "30.00",
  metodo: "Transferencia informada",
  referencia: "REF-01",
  observaciones: "Reportado por el cliente",
});

test("modelo valida fechas, origen e importes y deriva el monto pagado", async () => {
  const opts = {
    ...commercial,
    ...dates,
    folio: folio("RES"),
    folioCotizacion: folio("COT"),
    vigenciaCotizacion: "2032-05-01",
    versionAceptada: 2,
    cliente: oid(),
    oportunidad: oid(),
    solicitud: oid(),
    cotizacion: oid(),
    asesor: oid(),
    registradaPor: oid(),
    estadoActualizadoPor: oid(),
  };
  const payment = {
    ...todayPayment(),
    montoCentavos: 3000,
    registradoPor: oid(),
  };
  const reserva = new Reserva({ ...opts, pagos: [payment] });
  await reserva.validate();
  assert.equal(reserva.estado, "Pendiente de pago");
  assert.equal(reserva.pagadoCentavos, 3000);
  for (const invalid of [
    { estado: "Otro" },
    { cliente: null },
    { versionAceptada: 1.5 },
    { regreso: "2032-05-31" },
    { totalCentavos: 0 },
    { conceptos: [] },
    { folio: "otro" },
    { pagos: [{ ...payment, referencia: "" }] },
    { pagos: [{ ...payment, clave: "mal" }] },
    { pagos: [{ ...payment, fecha: "2999-01-01" }] },
    { pagos: [{ ...payment, montoCentavos: 11.1 }] },
    {
      pagos: [
        payment,
        { ...payment, clave: randomUUID(), referencia: "  ref-01 " },
      ],
    },
  ]) {
    await assert.rejects(new Reserva({ ...opts, ...invalid }).validate(), {
      name: "ValidationError",
    });
  }
});

test("API protege reservas y pagos y conserva el saldo ante reintentos y concurrencia", async (t) => {
  const users = {
    propio: { _id: oid(), rol: "Asesor", activo: true },
    ajeno: { _id: oid(), rol: "Asesor", activo: true },
    admin: { _id: oid(), rol: "Administrador", activo: true },
  };
  const clients = Object.values(users)
    .slice(0, 2)
    .map(({ _id }) => ({
      _id: oid(),
      nombre: "Contacto",
      asesor: _id,
      solicitudes: [{ _id: oid(), ...dates }],
    }));
  const opportunities = clients.map((client) => ({
    _id: oid(),
    cliente: client._id,
    solicitud: client.solicitudes[0]._id,
    asesor: client.asesor,
    etapa: "Ganada",
  }));
  const quotes = opportunities.map((op) => ({
    ...commercial,
    _id: oid(),
    cliente: op.cliente,
    oportunidad: op._id,
    asesor: op.asesor,
    version: 2,
    versionAceptada: 2,
    estado: "Aceptada",
    folio: folio("COT"),
    vigencia: "2032-05-01",
  }));
  const reservas = [];
  function matches(row, filter) {
    return Object.entries(filter).every(([field, value]) => {
      if (field === "solicitudes._id")
        return row.solicitudes.some(({ _id }) => _id.equals(value));
      if (row[field] instanceof mongoose.Types.ObjectId)
        return row[field].equals(value);
      return row[field] === value;
    });
  }
  const find = (rows, filter) => rows.find((row) => matches(row, filter));
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({
      usuario: Object.entries(users).find(
        ([key]) => tokenHash(key) === token,
      )?.[1],
    }),
  }));
  t.mock.method(Cliente, "findOne", (filter) => ({
    select: () => ({ lean: async () => find(clients, filter) }),
  }));
  t.mock.method(Cliente, "exists", async (filter) => find(clients, filter));
  t.mock.method(Cotizacion, "findOne", (filter) => ({
    select: () => ({ lean: async () => find(quotes, filter) }),
  }));
  t.mock.method(Cotizacion, "exists", async (filter) => find(quotes, filter));
  t.mock.method(Oportunidad, "findOne", (filter) => ({
    lean: async () => find(opportunities, filter),
  }));
  t.mock.method(Reserva, "findOne", (filter) => {
    const row = find(reservas, filter);
    return {
      select() {
        return this;
      },
      lean: async () => row,
      then(resolve) {
        return Promise.resolve(row ? Reserva.hydrate(row) : null).then(resolve);
      },
    };
  });
  t.mock.method(Reserva, "find", (filter) => ({
    select() {
      return this;
    },
    sort() {
      return this;
    },
    lean: async () =>
      reservas
        .filter((row) => matches(row, filter))
        .map((row) => {
          const copy = { ...row };
          delete copy.pagos;
          delete copy.conceptos;
          return copy;
        }),
  }));
  t.mock.method(Reserva.collection, "insertOne", async (row) => {
    if (find(reservas, { cotizacion: row.cotizacion }))
      throw Object.assign(new Error("Duplicate key"), { code: 11000 });
    assert.equal(find(reservas, { folio: row.folio }), undefined);
    reservas.push(row);
    return { acknowledged: true, insertedId: row._id };
  });
  t.mock.method(Reserva.collection, "updateOne", async (filter, update) => {
    assert.ok(Number.isInteger(filter.revision));
    const row = find(reservas, filter);
    if (!row) return { matchedCount: 0 };
    Object.assign(row, update.$set);
    if (update.$push?.pagos) row.pagos.push(...update.$push.pagos.$each);
    row.revision += update.$inc.revision;
    return { matchedCount: 1 };
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function call(path, session, method = "GET", body) {
    const headers = {
      Origin: process.env.APP_ORIGIN || "http://localhost:5173",
    };
    if (session) headers.Cookie = "session=" + session;
    if (body) headers["Content-Type"] = "application/json";
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api" + path,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    return { status: response.status, body: await response.json() };
  }

  const quote = quotes[0];
  const creation = {
    cotizacion: String(quote._id),
    localizador: "ABC-123",
    totalCentavos: 1,
  };
  const create = (session, body = creation) =>
    call("/reservas", session, "POST", body);
  assert.equal((await call("/reservas")).status, 401);
  assert.equal((await create(null)).status, 401);
  assert.equal((await create("ajeno")).status, 404);
  assert.equal((await create("propio", { cotizacion: "mal" })).status, 400);
  assert.equal(
    (await create("propio", { cotizacion: String(oid()) })).status,
    404,
  );
  for (const state of ["Borrador", "Vencida", "Rechazada", "Enviada"]) {
    quote.estado = state;
    assert.equal((await create("propio")).status, 409);
  }
  quote.estado = "Aceptada";
  quote.versionAceptada = 1;
  assert.equal((await create("propio")).status, 409);
  quote.versionAceptada = 2;
  opportunities[0].etapa = "Negociación";
  assert.equal((await create("propio")).status, 409);
  opportunities[0].etapa = "Ganada";
  const correctClient = quote.cliente;
  quote.cliente = clients[1]._id;
  assert.equal((await create("admin")).status, 409);
  quote.cliente = correctClient;
  const legitimateRequest = opportunities[0].solicitud;
  opportunities[0].solicitud = clients[1].solicitudes[0]._id;
  assert.equal((await create("admin")).status, 409);
  opportunities[0].solicitud = legitimateRequest;

  const linked = "/cotizaciones/" + quote._id + "/reserva";
  assert.equal((await call(linked, "propio")).body, null);
  const created = await Promise.all([create("propio"), create("admin")]);
  assert.deepEqual(created.map(({ status }) => status).sort(), [200, 201]);
  const {
    id,
    folio: resultFolio,
    versionAceptada,
    totalCentavos,
    asesor,
    clienteDocumento,
    localizador,
  } = created[0].body;
  assert.equal(created[1].body.id, id);
  assert.equal(resultFolio, folio("RES", id));
  assert.equal(versionAceptada, 2);
  assert.equal(totalCentavos, 11300);
  assert.equal(asesor, String(quote.asesor));
  assert.equal(clienteDocumento.nombre, commercial.clienteDocumento.nombre);
  assert.equal(localizador, "ABC-123");
  assert.equal(
    (await create("propio", { ...creation, localizador: "No sustituye" })).body
      .localizador,
    "ABC-123",
  );
  const other = await create("admin", { cotizacion: String(quotes[1]._id) });
  assert.notEqual(other.body.folio, resultFolio);

  const path = "/reservas/" + id;
  const payments = path + "/pagos";
  quotes[0].conceptos = [{ descripcion: "Datos ajenos a la reserva" }];
  clients[0].solicitudes[0].salida = "2032-06-02";
  const detail = await call(path, "admin");
  assert.equal(detail.body.conceptos[0].descripcion, "Traslado");
  assert.equal(detail.body.salida, dates.salida);
  assert.equal((await call(linked, "propio")).body.id, id);
  assert.equal((await call(linked, "ajeno")).status, 404);
  assert.equal((await call(path, "ajeno")).status, 404);
  assert.equal((await call("/reservas?estado=Otro", "admin")).status, 400);
  assert.equal(
    (await call("/reservas?estado=Pendiente%20de%20pago", "propio")).body
      .length,
    1,
  );
  assert.equal((await call("/reservas", "admin")).body.length, 2);
  assert.equal(
    (await call("/clientes/" + clients[0]._id + "/reservas", "propio")).body[0]
      .id,
    id,
  );
  assert.equal(
    (await call("/clientes/" + clients[0]._id + "/reservas", "ajeno")).status,
    404,
  );

  const state = (estado, revision, session = "propio", url = path) =>
    call(url + "/estado", session, "PATCH", { estado, revision });
  assert.equal((await state("Confirmada", 0, "ajeno")).status, 404);
  assert.equal((await state("Otra", 0)).status, 400);
  assert.equal((await state("Completada", 0)).status, 409);
  assert.equal((await state("En viaje", 0)).status, 409);
  const locator = await call(path + "/estado", "propio", "PATCH", {
    revision: 0,
    localizador: "NUEVO",
    proveedorReferencia: "Proveedor manual",
  });
  assert.equal(locator.body.localizador, "NUEVO");
  assert.equal(locator.body.proveedorReferencia, "Proveedor manual");

  const payment = todayPayment();
  const pay = (body, session = "propio", url = payments) =>
    call(url, session, "POST", body);
  assert.equal((await call(payments, "ajeno")).status, 404);
  assert.equal((await pay(payment, "ajeno")).status, 404);
  for (const invalid of [
    { fecha: "2021-02-29" },
    { monto: "0" },
    { monto: "1.005" },
    { referencia: "" },
    { clave: 7 },
  ])
    assert.equal((await pay({ ...payment, ...invalid })).status, 400);
  const same = await Promise.all([pay(payment), pay(payment)]);
  assert.deepEqual(same.map(({ status }) => status).sort(), [200, 201]);
  assert.equal(same[0].body.pagos.length, 1);
  assert.equal(same[0].body.pagadoCentavos, 3000);
  assert.equal(same[0].body.saldoCentavos, 8300);
  assert.equal(same[0].body.estado, "Pendiente de pago");
  assert.equal(same[0].body.pagos[0].registradoPor, String(users.propio._id));
  assert.equal((await pay({ ...payment, monto: "1.00" })).status, 409);
  assert.equal(
    (await pay({ ...payment, clave: randomUUID(), referencia: "ref-01" }))
      .status,
    409,
  );
  const concurrent = await Promise.all([
    pay({
      ...payment,
      clave: randomUUID(),
      monto: "50.00",
      referencia: "REF-02",
    }),
    pay({
      ...payment,
      clave: randomUUID(),
      monto: "50.00",
      referencia: "REF-03",
    }),
  ]);
  assert.deepEqual(concurrent.map(({ status }) => status).sort(), [201, 201]);
  const balance = (await call(payments, "admin")).body;
  assert.equal(balance.pagadoCentavos, 13000);
  assert.equal(balance.saldoCentavos, 0);
  assert.equal(balance.pagos.length, 3);
  assert.equal(balance.excedenteCentavos, 1700);
  assert.equal(balance.estado, "Confirmada");
  assert.deepEqual(balance.transiciones, ["En viaje", "Cancelada"]);
  const confirmed = (await call(path, "propio")).body;
  assert.equal(confirmed.estado, "Confirmada");
  assert.equal(confirmed.estadoActualizadoPor, String(users.propio._id));
  assert.equal((await state("En viaje", locator.body.revision)).status, 409);
  const travelling = (await state("En viaje", balance.revision)).body;
  assert.equal(travelling.estado, "En viaje");
  assert.equal((await state("Cancelada", travelling.revision)).status, 409);
  const done = await state("Completada", travelling.revision);
  assert.equal(done.body.estado, "Completada");
  const extra = await pay({
    ...payment,
    clave: randomUUID(),
    monto: "33.00",
    referencia: "REF-04",
  });
  assert.equal(extra.status, 201);
  assert.equal(extra.body.saldoCentavos, 0);
  assert.equal(extra.body.excedenteCentavos, 5000);
  assert.equal(extra.body.estado, "Completada");
  const refunds = path + "/devoluciones";
  const refund = { ...todayPayment(), monto: "50.00", referencia: "DEV-01" };
  const refundCall = (body, session = "propio") =>
    call(refunds, session, "POST", body);
  assert.equal((await refundCall(refund, "ajeno")).status, 404);
  assert.equal((await refundCall({ ...refund, monto: "50.01" })).status, 409);
  const duplicate = { ...refund, clave: randomUUID(), referencia: "DEV-02" };
  const results = await Promise.all([
    refundCall(refund),
    refundCall(duplicate),
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409]);
  const winner = results[0].status === 201 ? refund : duplicate;
  const retry = await refundCall(winner);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.excedenteCentavos, 0);
  assert.equal(retry.body.saldoCentavos, 0);
  assert.equal(retry.body.pagadoCentavos, 11300);
  assert.equal(
    retry.body.pagos.filter(({ tipo }) => tipo === "Devolución").length,
    1,
  );
  assert.equal(
    retry.body.pagos.find(({ tipo }) => tipo === "Devolución").montoCentavos,
    5000,
  );
  const afterRefund = (await call(path, "propio")).body;
  assert.equal(afterRefund.excedenteCentavos, 0);

  const otherPath = "/reservas/" + other.body.id;
  const exact = await pay(
    {
      ...todayPayment(),
      monto: (other.body.totalCentavos / 100).toFixed(2),
    },
    "admin",
    otherPath + "/pagos",
  );
  assert.equal(exact.status, 201);
  assert.equal(exact.body.estado, "Confirmada");
  assert.equal(exact.body.excedenteCentavos, 0);
  assert.equal(
    (await state("Cancelada", exact.body.revision, "admin", otherPath)).status,
    200,
  );
  assert.equal(
    (await pay(todayPayment(), "admin", otherPath + "/pagos")).status,
    409,
  );
});
