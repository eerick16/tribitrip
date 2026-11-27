import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { Cotizacion, ServicioTuristico } from "./quote-models.js";
import { tokenHash } from "./security.js";
import {
  aCentavos,
  calcularImportes,
  maxCentavos,
} from "../shared/cotizaciones.js";
import { estadoVigente, transicionesDisponibles } from "./quote-lifecycle.js";
import { quoteDocument } from "./quote-document.js";

const oid = () => new mongoose.Types.ObjectId();
const servicioValido = {
  nombre: "Paquete Playa (3 noches)",
  descripcion: "Hospedaje y traslado",
  tipo: "Paquete",
  destino: "Cancún",
  proveedor: "Proveedor de prueba",
  precioReferenciaCentavos: 12345,
};

test("catálogo valida descripción, tipo y precio de referencia en centavos", async () => {
  await new ServicioTuristico(servicioValido).validate();
  for (const invalid of [
    { nombre: " " },
    { descripcion: "" },
    { tipo: "Otro" },
    { precioReferenciaCentavos: -1 },
    { precioReferenciaCentavos: 1.5 },
  ]) {
    await assert.rejects(
      new ServicioTuristico({ ...servicioValido, ...invalid }).validate(),
      { name: "ValidationError" },
    );
  }
});

test("cálculo en centavos y validación del modelo de cotizaciones", async () => {
  assert.equal(aCentavos("0.1"), 10);
  assert.equal(aCentavos("0.01"), 1);
  for (const bad of ["1.005", "-1", "1e3", "10000000000.00", 12.5])
    assert.equal(aCentavos(bad), null);
  assert.equal(
    calcularImportes(
      [{ cantidad: 2, precioUnitarioCentavos: maxCentavos }],
      0,
      0,
    ),
    null,
  );
  const input = {
    folio: "COT-" + String(oid()).toUpperCase(),
    cliente: oid(),
    oportunidad: oid(),
    asesor: oid(),
    vigencia: "2032-02-29",
    conceptos: [
      { descripcion: "Traslado", cantidad: 3, precioUnitarioCentavos: 10 },
    ],
    cargosCentavos: 20,
    totalCentavos: 7777,
  };
  const quote = new Cotizacion(input);
  await quote.validate();
  assert.equal(quote.conceptos[0].subtotalCentavos, 30);
  assert.equal(quote.subtotalCentavos, 30);
  assert.equal(quote.totalCentavos, 50);
  for (const invalid of [
    { folio: "otro" },
    { cliente: null },
    { oportunidad: null },
    { asesor: null },
    { vigencia: "2031-02-29" },
    { conceptos: [] },
    { conceptos: null },
    { estado: "Otro" },
    { estado: "Aceptada" },
    { versionAceptada: 1 },
    { conceptos: [{ ...input.conceptos[0], cantidad: 1.5 }] },
    { conceptos: [{ ...input.conceptos[0], servicio: oid() }] },
  ]) {
    await assert.rejects(new Cotizacion({ ...input, ...invalid }).validate(), {
      name: "ValidationError",
    });
  }
});

test("la vigencia incluye la fecha límite en la zona de Ciudad de México", () => {
  const quote = { vigencia: "2032-02-29", estado: "Enviada" };
  const late = new Date("2032-03-01T05:59:59Z");
  const expired = new Date("2032-03-01T06:00:00Z");
  assert.deepEqual(transicionesDisponibles(quote, late), [
    "Aceptada",
    "Rechazada",
  ]);
  assert.equal(estadoVigente(quote, expired), "Vencida");
  assert.deepEqual(transicionesDisponibles(quote, expired), ["Vencida"]);
  assert.deepEqual(
    transicionesDisponibles({ ...quote, estado: "Vencida" }, expired),
    [],
  );
  assert.equal(
    estadoVigente({ ...quote, estado: "Aceptada" }, expired),
    "Aceptada",
  );
});

test("HTML imprimible contiene entre uno y cincuenta conceptos y los importes guardados", () => {
  for (const count of [1, 50]) {
    const page = quoteDocument("COT-PRUEBA", {
      clienteDocumento: {
        nombre: "<Cliente>",
        correo: "prueba@example.test",
        telefono: "1234567890",
      },
      version: 3,
      estado: "Aceptada",
      enviadaEn: "2032-02-01T12:00:00Z",
      vigencia: "2032-02-29",
      condiciones: "Condición acordada",
      observaciones: "Detalle adicional",
      subtotalCentavos: 5000,
      totalCentavos: 5400,
      impuestosCentavos: 300,
      cargosCentavos: 100,
      conceptos: Array.from({ length: count }, () => ({
        descripcion: "Concepto & servicio",
        cantidad: 2,
        precioUnitarioCentavos: 200,
        subtotalCentavos: 400,
      })),
    });
    assert.equal((page.match(/Concepto &amp; servicio/g) || []).length, count);
    for (const expected of [
      "TribiTrip",
      "&lt;Cliente&gt;",
      "prueba@example.test",
      "1234567890",
      "COT-PRUEBA",
      "Versión 3",
      "1 de febrero de 2032",
      "2032-02-29",
      "Aceptada",
      "Condición acordada",
      "Detalle adicional",
      "54.00",
      "4.00",
      "@media print",
    ])
      assert.ok(page.includes(expected), expected);
  }
});

test("API consulta el catálogo y protege la creación, consulta y edición de cotizaciones", async (t) => {
  const users = {
    asesor: { _id: oid(), rol: "Asesor", activo: true },
    ajeno: { _id: oid(), rol: "Asesor", activo: true },
    admin: { _id: oid(), rol: "Administrador", activo: true },
  };
  const clientes = [
    {
      _id: oid(),
      nombre: "Contacto uno",
      correo: "contacto@example.test",
      telefono: "1234567890",
      asesor: users.asesor._id,
    },
    { _id: oid(), nombre: "Contacto dos", asesor: users.ajeno._id },
  ];
  const oportunidades = clientes.map(({ _id, asesor }) => ({
    _id: oid(),
    cliente: _id,
    asesor,
    titulo: "Viaje de prueba",
  }));
  const services = [
    { ...servicioValido, _id: oid() },
    { ...servicioValido, _id: oid(), nombre: "Museo", destino: "Mérida" },
  ];
  const quotes = [];
  const matches = (row, filter) =>
    Object.entries(filter).every(([field, value]) => {
      if (field === "$or") return value.some((item) => matches(row, item));
      if (value instanceof RegExp) return value.test(row[field]);
      if (value?.$in)
        return value.$in.some((candidate) => row[field].equals(candidate));
      if (row[field] instanceof mongoose.Types.ObjectId)
        return row[field].equals(value);
      return row[field] === value;
    });
  const find = (rows, filter) => rows.find((row) => matches(row, filter));
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({
      usuario: Object.entries(users).find(
        ([key]) => tokenHash(key) === token,
      )?.[1],
    }),
  }));
  t.mock.method(Cliente, "findOne", (filter) => ({
    select: () => ({ lean: async () => find(clientes, filter) }),
  }));
  t.mock.method(Oportunidad, "exists", async (filter) =>
    find(oportunidades, filter),
  );
  t.mock.method(Oportunidad, "findOne", (filter) => ({
    select: async () => find(oportunidades, filter),
  }));
  t.mock.method(ServicioTuristico, "find", (filter) => ({
    sort() {
      return this;
    },
    lean: async () => services.filter((row) => matches(row, filter)),
  }));
  t.mock.method(ServicioTuristico.collection, "insertOne", async (row) => {
    services.push(row);
    return { acknowledged: true, insertedId: row._id };
  });
  t.mock.method(ServicioTuristico, "findById", (_id) => ({
    lean: async () => find(services, { _id }),
  }));

  function quoteQuery(result) {
    let summary = false;
    function populate(row) {
      const copy = {
        ...row,
        cliente: find(clientes, { _id: row.cliente }),
        oportunidad: find(oportunidades, { _id: row.oportunidad }),
      };
      if (summary) delete copy.conceptos;
      return copy;
    }
    return {
      populate() {
        return this;
      },
      sort() {
        return this;
      },
      select(fields) {
        summary = fields.split(" ").includes("-conceptos");
        return this;
      },
      lean: async () =>
        Array.isArray(result)
          ? result.map(populate)
          : result && populate(result),
      then(resolve) {
        return Promise.resolve(
          result ? Cotizacion.hydrate(result.toObject?.() ?? result) : null,
        ).then(resolve);
      },
    };
  }
  t.mock.method(Cotizacion, "findOne", (filter) =>
    quoteQuery(find(quotes, filter)),
  );
  t.mock.method(Cotizacion, "find", (filter) =>
    quoteQuery(quotes.filter((row) => matches(row, filter))),
  );
  t.mock.method(Cotizacion.collection, "insertOne", async (row) => {
    assert.equal(
      quotes.some(({ folio }) => folio === row.folio),
      false,
    );
    quotes.push(row);
    return { acknowledged: true, insertedId: row._id };
  });
  t.mock.method(Cotizacion.collection, "updateOne", async (filter, update) => {
    assert.ok(Number.isInteger(filter.revision));
    const row = find(quotes, filter);
    if (!row) return { matchedCount: 0 };
    if (
      update.$set?.estado === "Aceptada" &&
      quotes.some(
        (item) =>
          !item._id.equals(row._id) &&
          item.oportunidad.equals(row.oportunidad) &&
          item.estado === "Aceptada",
      )
    )
      throw Object.assign(new Error("Duplicate key"), {
        code: 11000,
        keyPattern: { oportunidad: 1 },
      });
    Object.assign(row, update.$set);
    if (update.$push?.historial)
      (row.historial ??= []).push(...update.$push.historial.$each);
    row.revision += update.$inc.revision;
    return { matchedCount: 1 };
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function call(path, session, method = "GET", data) {
    const headers = {
      Origin: process.env.APP_ORIGIN || "http://localhost:5173",
    };
    if (session) headers.Cookie = "session=" + session;
    if (data) headers["Content-Type"] = "application/json";
    const res = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api" + path,
      {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      },
    );
    return {
      status: res.status,
      body: res.headers.get("content-type").includes("text/html")
        ? await res.text()
        : await res.json(),
    };
  }
 
  const catalog = "/servicios-turisticos";
  const path = "/cotizaciones";
  const servicioId = String(services[0]._id);
  assert.equal((await call(catalog)).status, 401);
  assert.equal(
    (await call(catalog + "?q=playa%20%28", "asesor")).body[0].id,
    servicioId,
  );
  assert.equal(
    (await call(catalog + "?q=Canc%C3%BAn&destino=canc", "asesor")).body.length,
    1,
  );
  assert.equal((await call(catalog + "?q=.*", "asesor")).body.length, 0);
  assert.equal((await call(catalog + "?q=a&q=b", "asesor")).status, 400);
  assert.equal(
    (await call(catalog + "/" + servicioId, "asesor")).body.tipo,
    "Paquete",
  );
  assert.equal((await call(catalog + "/" + oid(), "asesor")).status, 404);
  assert.equal((await call(catalog + "/mal", "asesor")).status, 400);
  const serviceInput = {
    nombre: " Traslado al aeropuerto ",
    descripcion: "Traslado privado",
    tipo: "Servicio",
    precioReferencia: "850.25",
    destino: "Oaxaca",
  };
  assert.equal((await call(catalog, null, "POST", serviceInput)).status, 401);
  assert.equal(
    (await call(catalog, "asesor", "POST", { ...serviceInput, tipo: "Otro" }))
      .status,
    400,
  );
  assert.equal(
    (
      await call(catalog, "asesor", "POST", {
        ...serviceInput,
        precioReferencia: "850.255",
      })
    ).status,
    400,
  );
  const nuevoServicio = await call(catalog, "asesor", "POST", serviceInput);
  assert.equal(nuevoServicio.status, 201);
  assert.equal(nuevoServicio.body.nombre, "Traslado al aeropuerto");
  assert.equal(nuevoServicio.body.precioReferenciaCentavos, 85025);
  assert.equal(
    (await call(catalog + "?q=Traslado", "admin")).body[0].id,
    nuevoServicio.body.id,
  );

  const fields = {
    vigencia: "2032-02-29",
    condiciones: "Sujeto a disponibilidad",
    observaciones: "Servicio en español",
    impuestos: "0.20",
    cargos: "0.15",
    conceptos: [
      {
        servicio: servicioId,
        descripcion: "Paquete personalizado",
        cantidad: 2,
        precioUnitario: "124.10",
        subtotalCentavos: 1,
      },
      { descripcion: "Cargo separado", cantidad: 3, precioUnitario: "0.10" },
    ],
  };
  const input = {
    ...fields,
    cliente: String(clientes[0]._id),
    oportunidad: String(oportunidades[0]._id),
    asesor: String(users.ajeno._id),
    folio: "inyectado",
    totalCentavos: 1,
  };
  assert.equal((await call(path)).status, 401);
  assert.equal((await call(path, null, "POST", input)).status, 401);
  assert.equal((await call(path, "ajeno", "POST", input)).status, 404);
  assert.equal(
    (
      await call(path, "admin", "POST", {
        ...input,
        oportunidad: String(oportunidades[1]._id),
      })
    ).status,
    404,
  );
  assert.equal(
    (await call(path, "asesor", "POST", { ...input, cliente: {} })).status,
    400,
  );
  assert.equal(
    (await call(path, "asesor", "POST", { ...input, impuestos: "0.005" }))
      .status,
    400,
  );
  assert.equal(
    (
      await call(path, "asesor", "POST", {
        ...input,
        conceptos: [{ ...fields.conceptos[0], cantidad: "2" }],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(path, "asesor", "POST", {
        ...input,
        conceptos: [{ ...fields.conceptos[0], servicio: String(oid()) }],
      })
    ).status,
    404,
  );

  const created = await Promise.all([
    call(path, "asesor", "POST", input),
    call(path, "admin", "POST", input),
  ]);
  assert.deepEqual(
    created.map(({ status }) => status),
    [201, 201],
  );
  const [first, second] = created.map(({ body }) => body);
  assert.notEqual(first.folio, second.folio);
  assert.equal(first.folio, "COT-" + first.id.toUpperCase());
  assert.equal(first.asesor, String(users.asesor._id));
  assert.equal(first.subtotalCentavos, 24850);
  assert.equal(first.totalCentavos, 24885);
  assert.equal(first.version, 1);
  assert.equal(first.estado, "Borrador");
  assert.equal(first.conceptos[0].subtotalCentavos, 24820);
  assert.equal(first.conceptos[0].referencia.precioReferenciaCentavos, 12345);
  const detail = path + "/" + first.id;
  const related = "/oportunidades/" + input.oportunidad + path;
  assert.equal((await call(path, "asesor")).body.length, 2);
  assert.equal((await call(path, "asesor")).body[0].conceptos, undefined);
  assert.equal((await call(path, "ajeno")).body.length, 0);
  assert.equal((await call(related, "admin")).body.length, 2);
  assert.equal((await call(related, "ajeno")).status, 404);
  assert.equal((await call(detail, "ajeno")).status, 404);
  assert.equal(
    (await call(detail, "ajeno", "PUT", { ...fields, revision: 0 })).status,
    404,
  );

  services[0].nombre = "Catálogo cambiado";
  services[0].precioReferenciaCentavos = 99999;
  assert.equal(
    (await call(detail, "admin")).body.conceptos[0].referencia.nombre,
    servicioValido.nombre,
  );
  const edit = {
    ...fields,
    revision: 0,
    conceptos: [
      {
        id: first.conceptos[0]._id,
        descripcion: "Concepto revisado",
        cantidad: 1,
        precioUnitario: "124.10",
      },
    ],
  };
  assert.equal(
    (await call(detail, "asesor", "PUT", { ...edit, cliente: input.cliente }))
      .status,
    400,
  );
  assert.equal(
    (
      await call(detail, "asesor", "PUT", {
        ...edit,
        conceptos: [{ ...edit.conceptos[0], id: second.conceptos[0]._id }],
      })
    ).status,
    400,
  );
  const edits = await Promise.all([
    call(detail, "asesor", "PUT", edit),
    call(detail, "admin", "PUT", edit),
  ]);
  assert.deepEqual(edits.map(({ status }) => status).sort(), [200, 409]);
  const updated = (await call(detail, "asesor")).body;
  assert.equal(updated.folio, first.folio);
  assert.equal(updated.revision, 1);
  assert.equal(updated.totalCentavos, 12445);
  assert.equal(updated.conceptos.length, 1);
  assert.equal(updated.conceptos[0].referencia.precioReferenciaCentavos, 12345);
  assert.equal(updated.conceptos[0].descripcion, "Concepto revisado");
  assert.equal(updated.version, 2);
  assert.deepEqual(
    updated.versiones.map(({ version }) => version),
    [1],
  );
  const firstVersion = detail + "/versiones/1";
  assert.equal((await call(firstVersion, "ajeno")).status, 404);
  assert.equal((await call(firstVersion + "/documento", "ajeno")).status, 404);
  assert.equal((await call(firstVersion + "/documento")).status, 401);
  assert.equal((await call(detail + "/versiones/0", "asesor")).status, 400);
  assert.equal((await call(detail + "/versiones/3", "asesor")).status, 404);
  const historical = (await call(firstVersion, "admin")).body;
  assert.equal(historical.totalCentavos, 24885);
  assert.equal(
    historical.conceptos[0].referencia.precioReferenciaCentavos,
    12345,
  );
  const printable = (await call(firstVersion + "/documento", "admin")).body;
  assert.ok(printable.includes("248.85"));
  assert.ok(printable.includes("Paquete personalizado"));
  assert.ok(printable.includes("contacto@example.test"));
  assert.equal(printable.includes("Concepto revisado"), false);

  const change = (url, estado, revision, session = "asesor") =>
    call(url + "/estado", session, "PATCH", { estado, revision });
  assert.equal((await change(detail, "Aceptada", 1, "ajeno")).status, 404);
  assert.equal((await change(detail, "Otro", 1)).status, 400);
  assert.equal((await change(detail, "Aceptada", 1)).status, 409);
  assert.equal((await change(detail, "Enviada", 1)).body.estado, "Enviada");
  const sent = await change(path + "/" + second.id, "Enviada", 0, "admin");
  assert.equal(sent.status, 200);
  const accepted = await change(detail, "Aceptada", 2);
  assert.equal(accepted.body.estado, "Aceptada");
  assert.equal(accepted.body.versionAceptada, 2);
  assert.equal(
    (await change(path + "/" + second.id, "Aceptada", 1, "admin")).status,
    409,
  );
  assert.equal(
    (await change(path + "/" + second.id, "Rechazada", 1, "admin")).body.estado,
    "Rechazada",
  );
  assert.equal((await change(detail, "Rechazada", 3)).status, 409);
  assert.equal(
    (await call(detail, "asesor", "PUT", { ...edit, revision: 3 })).status,
    409,
  );
  const acceptedVersion = (await call(detail + "/versiones/2", "asesor")).body;
  assert.equal(acceptedVersion.estado, "Aceptada");
  assert.equal(acceptedVersion.versionAceptada, 2);
  assert.ok(acceptedVersion.resueltaEn);
  assert.equal(
    (await call(related, "admin")).body.find(({ id }) => id === first.id)
      .versionAceptada,
    2,
  );
  const expired = (
    await call(path, "asesor", "POST", { ...input, vigencia: "2000-01-01" })
  ).body;
  assert.equal(expired.estado, "Vencida");
  assert.equal(
    (await change(path + "/" + expired.id, "Enviada", 0)).status,
    409,
  );
  assert.equal(
    (await change(path + "/" + expired.id, "Vencida", 0)).body.estado,
    "Vencida",
  );

  const legacy = quotes.find(({ _id }) => _id.equals(second.id));
  for (const key of [
    "version",
    "estado",
    "historial",
    "clienteDocumento",
    "versionCreadaEn",
    "enviadaEn",
    "resueltaEn",
    "versionAceptada",
  ])
    delete legacy[key];
  const old = (await call(path + "/" + second.id, "asesor")).body;
  assert.equal(old.version, 1);
  assert.equal(old.estado, "Borrador");
  const legacyDocument = await call(
    path + "/" + second.id + "/versiones/1/documento",
    "admin",
  );
  assert.ok(legacyDocument.body.includes("contacto@example.test"));
  const editedLegacy = await call(path + "/" + second.id, "asesor", "PUT", {
    ...fields,
    revision: 2,
  });
  assert.equal(editedLegacy.status, 200);
  assert.equal(editedLegacy.body.version, 2);
  assert.equal(
    (await call(path + "/" + second.id + "/versiones/1", "asesor")).body
      .totalCentavos,
    24885,
  );
});
