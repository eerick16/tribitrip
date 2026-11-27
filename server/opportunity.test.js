import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { app } from "./app.js";
import { Cliente, Sesion } from "./models.js";
import { Oportunidad } from "./opportunity-model.js";
import { tokenHash } from "./security.js";
import { etapas } from "../shared/oportunidades.js";

const oid = () => new mongoose.Types.ObjectId();

test("oportunidad exige título, relaciones y etapa comercial válida", async () => {
  const input = {
    titulo: "Viaje familiar",
    cliente: oid(),
    solicitud: oid(),
    asesor: oid(),
  };
  const record = new Oportunidad(input);
  await record.validate();
  assert.equal(record.etapa, "Solicitud recibida");
  assert.equal(record.revision, 0);
  for (const [key, value] of [
    ["titulo", " "],
    ["titulo", "x".repeat(121)],
    ["cliente", undefined],
    ["solicitud", undefined],
    ["asesor", "mal"],
    ["etapa", "Archivada"],
  ]) {
    await assert.rejects(
      new Oportunidad({ ...input, [key]: value }).validate(),
      {
        name: "ValidationError",
      },
    );
  }
});

test("API de oportunidades valida alcance, vínculos, revisiones y embudo", async (t) => {
  const users = {
    propio: { _id: oid(), nombre: "Asesor uno", rol: "Asesor", activo: true },
    ajeno: { _id: oid(), nombre: "Asesor dos", rol: "Asesor", activo: true },
    admin: {
      _id: oid(),
      nombre: "Administración",
      rol: "Administrador",
      activo: true,
    },
  };
  const contacts = [
    {
      _id: oid(),
      nombre: "Contacto uno",
      asesor: users.propio._id,
      solicitud: oid(),
    },
    {
      _id: oid(),
      nombre: "Contacto dos",
      asesor: users.ajeno._id,
      solicitud: oid(),
    },
  ];
  const records = [];
  const matches = (record, filter) =>
    Object.entries(filter).every(([key, value]) => {
      if (value?.$in) return value.$in.includes(record[key]);
      if (record[key] instanceof mongoose.Types.ObjectId)
        return record[key].equals(value);
      return record[key] === value;
    });
  t.mock.method(Sesion, "findOne", ({ token }) => ({
    populate: async () => ({
      usuario: Object.entries(users).find(
        ([key]) => tokenHash(key) === token,
      )?.[1],
    }),
  }));
  t.mock.method(Cliente, "findOne", (filter) => ({
    select: async () => {
      const { "solicitudes._id": solicitud, ...rest } = filter;
      assert.ok(solicitud);
      return contacts.find((record) => matches(record, { ...rest, solicitud }));
    },
  }));

  function query(value) {
    const fields = new Set();
    return {
      sort() {
        return this;
      },
      populate(field) {
        fields.add(field);
        return this;
      },
      async lean() {
        function result(row) {
          if (!row) return null;
          const copy = { ...row };
          if (fields.has("cliente"))
            copy.cliente = contacts.find(({ _id }) => _id.equals(row.cliente));
          if (fields.has("asesor"))
            copy.asesor = Object.values(users).find(({ _id }) =>
              _id.equals(row.asesor),
            );
          return copy;
        }
        return Array.isArray(value) ? value.map(result) : result(value);
      },
    };
  }
  t.mock.method(Oportunidad, "find", (filter) =>
    query(records.filter((record) => matches(record, filter))),
  );
  t.mock.method(Oportunidad, "findOne", (filter) =>
    query(records.find((record) => matches(record, filter))),
  );
  t.mock.method(Oportunidad, "findById", (id) =>
    query(records.find((record) => record._id.equals(id))),
  );
  t.mock.method(Oportunidad, "create", async (data) => {
    const row = new Oportunidad(data);
    await row.validate();
    records.push(row.toObject());
    return row;
  });
  t.mock.method(Oportunidad, "findOneAndUpdate", (filter, update) => {
    const row = records.find((record) => matches(record, filter));
    if (!row) return query(null);
    Object.assign(row, update.$set);
    row.revision += update.$inc.revision;
    return query(row);
  });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function call(path = "", session, method = "GET", body) {
    const headers = {
      Origin: process.env.APP_ORIGIN || "http://localhost:5173",
    };
    if (session) headers.Cookie = "session=" + session;
    if (body) headers["Content-Type"] = "application/json";
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/oportunidades" + path,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    return { status: response.status, data: await response.json() };
  }

  const [first, second] = contacts;
  const input = {
    titulo: "Viaje de prueba",
    cliente: String(first._id),
    solicitud: String(first.solicitud),
  };
  assert.equal((await call()).status, 401);
  assert.equal((await call("", null, "POST", input)).status, 401);
  assert.equal((await call("/embudo", "propio")).status, 403);
  assert.equal((await call("", "ajeno", "POST", input)).status, 404);
  assert.equal(
    (
      await call("", "admin", "POST", {
        ...input,
        solicitud: String(second.solicitud),
      })
    ).status,
    404,
  );
  assert.equal(
    (await call("", "admin", "POST", { ...input, solicitud: String(oid()) }))
      .status,
    404,
  );
  assert.equal(
    (await call("", "propio", "POST", { ...input, solicitud: {} })).status,
    400,
  );
  assert.equal(
    (await call("", "propio", "POST", { ...input, titulo: " " })).status,
    400,
  );
  assert.equal(
    (
      await call("", "admin", "POST", {
        ...input,
        asesor: String(users.ajeno._id),
      })
    ).status,
    400,
  );
  const created = await call("", "admin", "POST", input);
  assert.equal(created.status, 201);
  assert.equal(created.data.cliente.id, input.cliente);
  assert.equal(created.data.solicitud, input.solicitud);
  assert.equal(created.data.asesor.id, String(users.propio._id));
  assert.equal(created.data.resultado, null);

  const path = "/" + created.data.id;
  const change = { titulo: "Título actualizado", etapa: "Ganada", revision: 0 };
  assert.equal((await call("/incorrecto", "propio")).status, 400);
  assert.equal((await call(path, "propio")).status, 200);
  assert.equal((await call(path, "ajeno")).status, 404);
  assert.equal((await call(path, "ajeno", "PUT", change)).status, 404);
  assert.equal((await call("", "ajeno")).data.length, 0);
  assert.equal(
    (
      await call(path, "propio", "PUT", {
        ...change,
        asesor: String(users.ajeno._id),
      })
    ).status,
    400,
  );
  assert.equal(
    (await call(path, "propio", "PUT", { ...change, etapa: "Otra" })).status,
    400,
  );
  assert.equal(
    (await call(path, "propio", "PUT", { ...change, revision: "0" })).status,
    400,
  );
  const writes = await Promise.all([
    call(path, "propio", "PUT", change),
    call(path, "admin", "PUT", change),
  ]);
  assert.deepEqual(writes.map(({ status }) => status).sort(), [200, 409]);
  const won = writes.find(({ status }) => status === 200).data;
  assert.equal(won.titulo, change.titulo);
  assert.equal(won.resultado, "Ganada");
  assert.ok(won.cerradaEn);
  const edited = await call(path, "admin", "PUT", {
    ...change,
    revision: won.revision,
  });
  assert.equal(edited.data.cerradaEn, won.cerradaEn);
  const reopened = await call(path, "propio", "PUT", {
    ...change,
    etapa: "Negociación",
    revision: edited.data.revision,
  });
  assert.equal(reopened.data.resultado, null);
  assert.equal(reopened.data.cerradaEn, null);
  const lost = await call(path, "propio", "PUT", {
    ...change,
    etapa: "Perdida",
    revision: reopened.data.revision,
  });
  assert.equal(lost.data.resultado, "Perdida");
  assert.ok(lost.data.cerradaEn);

  const other = await call("", "ajeno", "POST", {
    ...input,
    cliente: String(second._id),
    solicitud: String(second.solicitud),
  });
  assert.equal(other.status, 201);
  assert.equal((await call("", "admin")).data.length, 2);
  assert.equal((await call("/embudo?asesor=no", "admin")).status, 400);
  assert.equal((await call("/embudo?estado=Otro", "admin")).status, 400);
  const board = (await call("/embudo", "admin")).data;
  assert.deepEqual(
    board.map(({ etapa }) => etapa),
    etapas,
  );
  assert.deepEqual(
    board.map(({ cantidad }) => cantidad),
    [1, 0, 0, 0, 0, 1],
  );
  assert.equal(board.at(-1).oportunidades[0].id, lost.data.id);
  assert.equal(
    (await call("/embudo?estado=Abierta", "admin")).data[0].oportunidades[0].id,
    other.data.id,
  );
  const own = "/embudo?asesor=" + users.propio._id;
  assert.equal(
    (await call(own + "&estado=Perdida", "admin")).data.at(-1).cantidad,
    1,
  );
  assert.ok(
    (await call(own + "&estado=Abierta", "admin")).data.every(
      ({ cantidad }) => cantidad === 0,
    ),
  );
});
