const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  currencyDisplay: "code",
});
const date = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeZone: "America/Mexico_City",
});
const symbols = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => symbols[character]);
const amount = (cents) => money.format(cents / 100);
const paragraph = (title, value) =>
  value ? `<section><h2>${title}</h2><p>${escape(value)}</p></section>` : "";

export function quoteDocument(folio, version) {
  const client = version.clienteDocumento;
  const rows = version.conceptos
    .map(
      (line) => `<tr>
    <td>${escape(line.descripcion)}${line.referencia?.proveedor ? `<small>${escape(line.referencia.proveedor)}</small>` : ""}</td>
    <td>${escape(line.cantidad)}</td><td>${amount(line.precioUnitarioCentavos)}</td><td>${amount(line.subtotalCentavos)}</td>
  </tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="es-MX"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cotización ${escape(folio)} · Versión ${escape(version.version)}</title>
<style>
  @page { margin: 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0 auto; max-width: 850px; padding: 30px; color: #172234; font: 14px/1.45 system-ui, sans-serif; }
  header { border-bottom: 2px solid #254467; padding-bottom: 14px; }
  header strong { color: #254467; font-size: 24px; }
  h1 { margin: 6px 0 0; font-size: 24px; }
  h2 { font-size: 16px; margin-bottom: 4px; }
  p { margin: 4px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; }
  dt { font-weight: 600; } dd { margin: 0; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #c8d3df; text-align: right; }
  th:first-child, td:first-child { text-align: left; overflow-wrap: anywhere; }
  td:not(:first-child) { white-space: nowrap; }
  small { display: block; }
  .totales { margin-left: auto; width: fit-content; break-inside: avoid; }
  @media print {
    body { padding: 0; max-width: none; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    h2 { break-after: avoid; }
  }
</style></head><body>
<header><strong>TribiTrip</strong><p>Agencia de viajes</p><h1>Cotización</h1></header>
<dl>
  <dt>Cliente</dt><dd>${escape(client?.nombre ?? "Datos no disponibles")}</dd>
  ${client?.correo ? `<dt>Correo</dt><dd>${escape(client.correo)}</dd>` : ""}
  ${client?.telefono ? `<dt>Teléfono</dt><dd>${escape(client.telefono)}</dd>` : ""}
  <dt>Folio</dt><dd>${escape(folio)}</dd>
  <dt>Versión</dt><dd>${escape(version.version)}</dd>
  <dt>Estado de la versión</dt><dd>${escape(version.estado)}</dd>
  <dt>Emisión</dt><dd>${date.format(new Date(version.enviadaEn ?? version.versionCreadaEn))}</dd>
  <dt>Vigencia hasta</dt><dd>${escape(version.vigencia)}</dd>
</dl>
<table><thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
<tbody>${rows}</tbody></table>
<dl class="totales">
  <dt>Subtotal</dt><dd>${amount(version.subtotalCentavos)}</dd>
  <dt>Impuestos</dt><dd>${amount(version.impuestosCentavos)}</dd>
  <dt>Cargos</dt><dd>${amount(version.cargosCentavos)}</dd>
  <dt>Total general</dt><dd><strong>${amount(version.totalCentavos)}</strong></dd>
</dl>
${paragraph("Condiciones comerciales", version.condiciones)}
${paragraph("Observaciones", version.observaciones)}
</body></html>`;
}
