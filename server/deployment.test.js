import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { listen } from "./index.js";
import { Sesion, Usuario } from "./models.js";

async function start(t, env = { PORT: "0" }) {
  const server = listen(env);
  t.after(() => {
    if (server.listening) return new Promise((resolve) => server.close(resolve));
  });
  await once(server, "listening");
  return { server, url: "http://127.0.0.1:" + server.address().port };
}

test("el listener usa loopback local, todas las interfaces en Render y HOST explícito", async (t) => {
  const local = await start(t);
  assert.equal(local.server.address().address, "127.0.0.1");
  const render = await start(t, { PORT: "0", RENDER: "true" });
  assert.equal(render.server.address().address, "0.0.0.0");
  const port = local.server.address().port;
  await new Promise((resolve) => local.server.close(resolve));
  const custom = await start(t, { HOST: "127.0.0.1", PORT: String(port), RENDER: "true" });
  assert.equal(custom.server.address().address, "127.0.0.1");
  assert.equal(custom.server.address().port, port);
});

test("Express sirve la SPA compilada cuando existe y conserva los 404 de archivos y API", async (t) => {
  const { url } = await start(t);
  const htmlHeaders = { Accept: "text/html" };
  const index = await readFile(new URL("../dist/index.html", import.meta.url), "utf8")
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });

  const home = await fetch(url + "/");
  assert.equal(home.status, index === null ? 404 : 200);
  if (index !== null) assert.equal(await home.text(), index);
  for (const method of ["GET", "HEAD"]) {
    const response = await fetch(url + "/cotizaciones/abc/versiones/1/documento", {
      method, headers: htmlHeaders,
    });
    assert.equal(response.status, index === null ? 404 : 200);
    if (index !== null) assert.equal(await response.text(), method === "GET" ? index : "");
  }
  if (index !== null) {
    const script = index.match(/<script[^>]+src="([^"]+)"/)?.[1];
    const stylesheet = index.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
    for (const [asset, contentType] of [[script, /javascript/], [stylesheet, /text\/css/]]) {
      assert.ok(asset, "El build debe referenciar sus JS y CSS compilados");
      const response = await fetch(url + asset);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), contentType);
      assert.ok((await response.text()).length > 0);
    }
  }

  for (const path of ["/assets/inexistente", "/assets%2Finexistente", "/inexistente.js", "/inexistente%2Ejs"]) {
    const response = await fetch(url + path, { headers: htmlHeaders });
    assert.equal(response.status, 404);
  }
  const nonNavigation = await fetch(url + "/cotizaciones/abc");
  assert.equal(nonNavigation.status, 404);
  const health = await fetch(url + "/api/health", { headers: htmlHeaders });
  assert.equal(health.status, 503);
  assert.deepEqual(await health.json(), { conectado: false });

  t.mock.method(Sesion, "findOne", () => ({
    populate: async () => ({ usuario: { activo: true } }),
  }));
  const api = await fetch(url + "/api/inexistente", {
    headers: { ...htmlHeaders, Cookie: "session=mock-session" },
  });
  assert.equal(api.status, 404);
  assert.deepEqual(await api.json(), { mensaje: "Ruta no encontrada." });
});

test("los logs HTTP correlacionan errores y excluyen datos de la solicitud", async (t) => {
  const { url } = await start(t);
  const messages = [];
  t.mock.method(console, "log", (value) => messages.push(value));
  t.mock.method(console, "error", (value) => messages.push(value));
  t.mock.method(Usuario, "findOne", () => {
    throw new Error("detalle-interno-privado");
  });

  const normal = await fetch(url + "/api/clientes/ruta-privada?token=query-privado");
  assert.equal(normal.status, 401);
  const login = await fetch(url + "/api/auth/login?token=query-privado", {
    method: "POST",
    headers: {
      Origin: process.env.APP_ORIGIN || "http://localhost:5173",
      "Content-Type": "application/json",
      Cookie: "session=cookie-privada",
      Authorization: "Bearer token-privado",
      "X-Request-ID": "id-externo",
    },
    body: JSON.stringify({ correo: "correo-privado@example.com", password: "password-privada" }),
  });
  assert.equal(login.status, 500);
  assert.deepEqual(await login.json(), { mensaje: "No fue posible completar la operación." });

  const normalId = normal.headers.get("x-request-id");
  const errorId = login.headers.get("x-request-id");
  for (const id of [normalId, errorId]) assert.match(id, /^[\da-f-]{36}$/i);
  assert.notEqual(normalId, errorId);

  const entries = messages.map((line) => JSON.parse(line));
  const normalLog = entries.find((entry) => entry.requestId === normalId);
  assert.equal(normalLog.event, "http_request");
  assert.equal(normalLog.status, 401);
  assert.equal(normalLog.level, "warn");
  const correlated = entries.filter((entry) => entry.requestId === errorId);
  assert.deepEqual(correlated.map((entry) => entry.event), ["http_error", "http_request"]);
  for (const entry of correlated) {
    assert.equal(entry.method, "POST");
    assert.equal(entry.route, "/api/auth/login");
    assert.equal(entry.status, 500);
    assert.equal(entry.level, "error");
    assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
  }
  assert.ok(Number.isFinite(correlated[1].durationMs) && correlated[1].durationMs >= 0);
  assert.doesNotMatch(messages.join("\n"), /privad[oa]|id-externo/i);
});
