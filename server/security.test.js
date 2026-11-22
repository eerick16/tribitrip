import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, tokenHash } from "./security.js";
test("hash con sal aleatoria y comprobación de contraseñas", async () => {
  const hash = await hashPassword("MiClaveSegura123!");
  assert.notEqual(hash, await hashPassword("MiClaveSegura123!"));
  assert.equal(await verifyPassword("MiClaveSegura123!", hash), true);
  assert.equal(await verifyPassword("OtraClave123!", hash), false);
  await assert.rejects(hashPassword("corta"));
  assert.notEqual(tokenHash("token"), "token");
});
