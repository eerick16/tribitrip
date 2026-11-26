import {
  randomBytes,
  scrypt as derive,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(derive);
export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw Object.assign(
      new Error("La contraseña debe tener entre 12 y 128 caracteres."),
      { status: 400 },
    );
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + (await scrypt(password, salt, 64)).toString("hex");
}
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [salt, key] = stored.split(":");
  const candidate = await scrypt(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(key, "hex"));
}
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
export const publicUser = (u) => ({
  id: String(u._id),
  nombre: u.nombre,
  correo: u.correo,
  rol: u.rol,
  activo: u.activo,
});
