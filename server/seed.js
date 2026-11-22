import mongoose from "mongoose";
import { connect, Usuario } from "./models.js";
import { hashPassword } from "./security.js";
try {
  await connect();
  if (await Usuario.exists({ rol: "Administrador" }))
    throw new Error(
      "Ya existe un administrador; utiliza la gestión de usuarios.",
    );
  await Usuario.create({
    nombre: process.env.ADMIN_NAME || "Administrador",
    correo: process.env.ADMIN_EMAIL,
    passwordHash: await hashPassword(process.env.ADMIN_PASSWORD),
    rol: "Administrador",
  });
  console.log("Administrador creado.");
} catch (error) {
  console.error(
    error.name === "MongoServerError"
      ? "No se pudo crear el administrador."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
