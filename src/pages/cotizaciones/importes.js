const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
export const mostrarImporte = (centavos) => moneda.format(centavos / 100);
export const importeEditable = (centavos) => (centavos / 100).toFixed(2);
