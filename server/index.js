import { connect } from "./models.js";
import { app } from "./app.js";
import { confirmarReservasPagadas } from "./reservation-model.js";

export function listen(env = process.env) {
  const host = env.HOST || (env.RENDER === "true" ? "0.0.0.0" : "127.0.0.1");
  const port = Number(env.PORT || 3001);
  return app.listen(port, host);
}

if (import.meta.main) {
  try {
    await connect();
    await confirmarReservasPagadas();
    const server = listen();
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { address, port } = server.address();
    console.log("TribiTrip escuchando en", address, port);
  } catch (error) {
    console.error("No se pudo iniciar TribiTrip:", error.name);
    process.exitCode = 1;
  }
}
