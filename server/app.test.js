import test from "node:test";
import assert from "node:assert/strict";
import { app } from "./app.js";
import { Cliente, Usuario } from "./models.js";
test("API rechaza acceso sin sesión y solicitudes de otro origen", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    const response = await fetch(url + "/api/clientes");
    assert.equal(response.status, 401);
    const forbidden = await fetch(url + "/api/auth/login", {
      method: "POST",
      headers: {
        Origin: "https://otro.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(forbidden.status, 403);
    const invalid = await fetch(url + "/api/auth/login", {
      method: "POST",
      headers: {
        Origin: process.env.APP_ORIGIN || "http://localhost:5173",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("modelos rechazan contactos inválidos y roles desconocidos", async () => {
  const cliente = new Cliente({
    nombre: "Ejemplo",
    correo: "invalido",
    telefono: "123",
    presupuesto: -1,
  });
  await assert.rejects(cliente.validate(), (error) =>
    Boolean(
      error.errors.correo &&
      error.errors.telefono &&
      error.errors.presupuesto &&
      error.errors.asesor,
    ),
  );
  const usuario = new Usuario({
    nombre: "Ejemplo",
    correo: "test@example.com",
    passwordHash: "hash",
    rol: "Otro",
  });
  await assert.rejects(usuario.validate(), (error) =>
    Boolean(error.errors.rol),
  );
});
