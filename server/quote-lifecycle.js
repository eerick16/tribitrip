export const estadosCotizacion = [
  "Borrador",
  "Enviada",
  "Aceptada",
  "Rechazada",
  "Vencida",
];

const businessDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const fechaCiudadMexico = (now = new Date()) => businessDate.format(now);

export function estadoVigente(cotizacion, now = new Date()) {
  const estado = cotizacion.estado ?? "Borrador";
  if (
    ["Borrador", "Enviada"].includes(estado) &&
    cotizacion.vigencia < fechaCiudadMexico(now)
  )
    return "Vencida";
  return estado;
}

export function transicionesDisponibles(cotizacion, now = new Date()) {
  const vigente = estadoVigente(cotizacion, now);
  if (vigente === "Vencida" && cotizacion.estado !== "Vencida")
    return ["Vencida"];
  if (vigente === "Borrador") return ["Enviada"];
  if (vigente === "Enviada") return ["Aceptada", "Rechazada"];
  return [];
}

export function datosCliente(cliente) {
  if (!cliente?.nombre) return null;
  const { nombre, correo, telefono } = cliente;
  return { nombre, correo, telefono };
}

export function versionActual(quote) {
  return {
    version: quote.version ?? 1,
    estado: estadoVigente(quote),
    versionCreadaEn: quote.versionCreadaEn ?? quote.createdAt,
    enviadaEn: quote.enviadaEn ?? null,
    resueltaEn: quote.resueltaEn ?? null,
    clienteDocumento: quote.clienteDocumento ?? datosCliente(quote.cliente),
    vigencia: quote.vigencia,
    conceptos: quote.conceptos,
    impuestosCentavos: quote.impuestosCentavos,
    cargosCentavos: quote.cargosCentavos,
    subtotalCentavos: quote.subtotalCentavos,
    totalCentavos: quote.totalCentavos,
    condiciones: quote.condiciones,
    observaciones: quote.observaciones,
  };
}
