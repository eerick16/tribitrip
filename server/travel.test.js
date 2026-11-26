import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { tokenHash } from "./security.js";

const oid = () => new mongoose.Types.ObjectId();
const solicitudValida = {
  destino: "Mérida",
  salida: "2032-02-29",
  regreso: "2032-03-01",
  presupuesto: 5000,
  cantidadViajeros: 2,
};
const viajeroValido = {
  nombre: "Persona de prueba",
  parentesco: "Hija",
  tipo: "Menor",
};
const nuevaSolicitud = (data) => new Cliente().solicitudes.create(data);

test("solicitudes validan destino, calendario, orden, presupuesto y cantidad", async () => {
  await nuevaSolicitud(solicitudValida).validate();
  for (const [field, value] of [
    ["destino", " "],
    ["salida", "2031-02-29"],
    ["regreso", "2032-02-28"],
    ["presupuesto", -1],
    ["presupuesto", Infinity],
    ["cantidadViajeros", 0],
    ["cantidadViajeros", 1.5],
    ["estado", "Otro"],
  ]) {
    await assert.rejects(
      nuevaSolicitud({ ...solicitudValida, [field]: value }).validate(),
      { name: "ValidatorError", path: field },
      field,
    );
  }
});

test("viajeros validan datos y la solicitud no admite más viajeros que su capacidad", async () => {
  const make = (viajeros) => nuevaSolicitud({ ...solicitudValida, viajeros });
  await make([viajeroValido]).validate();
  for (const fields of [
    { nombre: "" },
    { parentesco: "" },
    { tipo: "Otro" },
    { nacimiento: "2999-01-01" },
    { nacimiento: "2022-02-29" },
  ]) {
    await assert.rejects(make([{ ...viajeroValido, ...fields }]).validate(), {
      name: "ValidatorError",
    });
  }
  await assert.rejects(make(Array(3).fill(viajeroValido)).validate(), {
    name: "ValidatorError",
    path: "cantidadViajeros",
  });
});

test("API de viajes usa el alcance de sesión y protege asociaciones y borrado", async (t) => {
  const asesor = oid();
  const ajeno = oid();
  const administrador = oid();
  const id = oid();
  const solicitudes = [];
  const contacto = {
    _id: id,
    nombre: "Contacto de prueba",
    asesor,
    solicitudes,
  };
  const users = new Map(
    [
      ["propio", { _id: asesor, activo: true, rol: "Asesor" }],
      ["ajeno", { _id: ajeno, activo: true, rol: "Asesor" }],
      ["admin", { _id: administrador, activo: true, rol: "Administrador" }],
    ].map(([key, value]) => [tokenHash(key), value]),
  );
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({ usuario: users.get(token) }),
  }));

  let deleted = false;
  let conflict = false;
  const visible = (filter) =>
    !deleted &&
    (!filter._id || id.equals(filter._id)) &&
    (!filter.asesor || asesor.equals(filter.asesor));
  t.mock.method(Cliente.collection, "findOne", async (filter, options) => {
    if (!visible(filter)) return null;
    const solicitudId = filter["solicitudes._id"];
    if (solicitudId && !solicitudes.some((s) => s._id.equals(solicitudId)))
      return null;
    const result = { ...contacto };
    if (options?.projection?.solicitudes !== 1) delete result.solicitudes;
    return result;
  });
  t.mock.method(Cliente.collection, "aggregate", (pipeline) => ({
    toArray: async () =>
      visible(pipeline[0].$match)
        ? solicitudes.map((s) => ({ id: String(s._id), destino: s.destino }))
        : [],
  }));
  t.mock.method(Cliente.collection, "updateOne", async (filter, update) => {
    if (!visible(filter)) return { matchedCount: 0 };
    if (update.$push) solicitudes.push(update.$push.solicitudes);
    else {
      assert.equal(
        Object.keys(update.$set).some((path) =>
          path.startsWith("solicitudes.$."),
        ),
        false,
      );
      assert.ok(update.$set.updatedAt instanceof Date);
      const { _id, revision } = filter.solicitudes.$elemMatch;
      const index = solicitudes.findIndex(
        (s) =>
          s._id.equals(_id) &&
          (revision.$in
            ? revision.$in.includes(s.revision ?? null)
            : s.revision === revision),
      );
      if (index < 0 || conflict) return { matchedCount: 0 };
      solicitudes[index] = update.$set["solicitudes.$"];
    }
    return { matchedCount: 1 };
  });
  t.mock.method(Cliente.collection, "findOneAndDelete", async (filter) => {
    assert.deepEqual(filter["solicitudes.0"], { $exists: false });
    if (!visible(filter) || solicitudes.length) return null;
    deleted = true;
    return contacto;
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
      body: res.status === 204 ? null : await res.json(),
    };
  }

  const create = {
    ...solicitudValida,
    cliente: String(id),
    asesor: String(ajeno),
  };
  assert.equal((await call("/solicitudes")).status, 401);
  assert.equal(
    (await call("/solicitudes", "ajeno", "POST", create)).status,
    404,
  );
  assert.equal(
    (
      await call("/solicitudes", "propio", "POST", {
        ...create,
        presupuesto: "5000",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/solicitudes", "propio", "POST", {
        ...create,
        regreso: "2031-12-31",
      })
    ).status,
    400,
  );
  const created = await call("/solicitudes", "admin", "POST", create);
  assert.equal(created.status, 201);
  assert.equal(created.body.cliente.id, String(id));
  assert.equal(created.body.asesor, String(asesor));
  assert.equal(created.body.revision, undefined);
  const path = "/solicitudes/" + created.body.id;
  const travelers = path + "/viajeros";
  assert.equal((await call("/solicitudes", "propio")).body.length, 1);
  assert.deepEqual((await call("/solicitudes", "ajeno")).body, []);
  assert.equal(
    (await call(path, "admin")).body.destino,
    solicitudValida.destino,
  );
  assert.equal((await call(path, "ajeno")).status, 404);
  assert.equal(
    (await call(path, "ajeno", "PUT", { destino: "Otro" })).status,
    404,
  );
  assert.equal((await call(travelers, "ajeno")).status, 404);
  assert.equal(
    (await call(travelers, "ajeno", "POST", viajeroValido)).status,
    404,
  );
  assert.equal(
    (
      await call(travelers, "propio", "POST", {
        ...viajeroValido,
        tipo: "Otro",
      })
    ).status,
    400,
  );

  delete solicitudes[0].revision;
  const first = await call(travelers, "propio", "POST", {
    ...viajeroValido,
    cliente: String(oid()),
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.cliente.id, String(id));
  const travelerId = first.body.viajeros[0].id;
  assert.equal(
    (await call(travelers + "/" + travelerId, "ajeno", "PUT", viajeroValido))
      .status,
    404,
  );
  assert.equal(
    (await call(travelers + "/" + oid(), "propio", "PUT", viajeroValido))
      .status,
    404,
  );
  assert.equal(
    (
      await call(travelers + "/" + travelerId, "propio", "PUT", {
        ...viajeroValido,
        nombre: "Nombre editado",
      })
    ).status,
    200,
  );
  assert.equal(
    (await call(travelers, "propio")).body[0].nombre,
    "Nombre editado",
  );
  assert.equal(
    (await call(travelers, "propio", "POST", viajeroValido)).status,
    201,
  );
  assert.equal(
    (await call(travelers, "propio", "POST", viajeroValido)).status,
    409,
  );
  assert.equal(
    (await call(path, "propio", "PUT", { cantidadViajeros: 1 })).status,
    400,
  );
  assert.equal(
    (await call(path, "propio", "PUT", { estado: "Atendida" })).body.estado,
    "Atendida",
  );
  conflict = true;
  assert.equal(
    (await call(path, "propio", "PUT", { destino: "Otro" })).status,
    409,
  );
  assert.equal(
    (await call(path, "propio")).body.destino,
    solicitudValida.destino,
  );
  assert.equal(
    (await call("/clientes/" + id, "propio")).body.solicitudes,
    undefined,
  );
  assert.equal((await call("/clientes/" + id, "ajeno", "DELETE")).status, 404);
  assert.equal((await call("/clientes/" + id, "propio", "DELETE")).status, 409);
  solicitudes.length = 0;
  assert.equal((await call("/clientes/" + id, "propio", "DELETE")).status, 204);
  assert.equal(
    (await call("/solicitudes", "propio", "POST", create)).status,
    404,
  );
});
