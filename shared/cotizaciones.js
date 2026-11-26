export const maxConceptos = 50;
export const maxCantidad = 9999;
export const maxCentavos = 999_999_999_999;

export function aCentavos(value) {
  if (typeof value !== "string" || !/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) return null;
  const [entero, decimal = ""] = value.split(".");
  const centavos = Number(entero) * 100 + Number(decimal.padEnd(2, "0"));
  return centavos <= maxCentavos ? centavos : null;
}

export function calcularImportes(conceptos, impuestosCentavos, cargosCentavos) {
  if (!Array.isArray(conceptos) || conceptos.length < 1 || conceptos.length > maxConceptos) return null;
  const importeValido = (value) => Number.isSafeInteger(value) && value >= 0 && value <= maxCentavos;
  if (!importeValido(impuestosCentavos) || !importeValido(cargosCentavos)) return null;
  const importes = [];
  let subtotalCentavos = 0;
  for (const concepto of conceptos) {
    if (!concepto) return null;
    const { cantidad, precioUnitarioCentavos } = concepto;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > maxCantidad ||
      !importeValido(precioUnitarioCentavos)) return null;
    const importe = cantidad * precioUnitarioCentavos;
    if (!importeValido(importe)) return null;
    importes.push(importe);
    subtotalCentavos += importe;
  }
  const totalCentavos = subtotalCentavos + impuestosCentavos + cargosCentavos;
  return importeValido(totalCentavos) ? { importes, subtotalCentavos, totalCentavos } : null;
}
