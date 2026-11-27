const bad = (message) => Object.assign(new Error(message), { status: 400 });

export function enumFilter(value, allowed, name) {
  if (value !== undefined && !allowed.includes(value))
    throw bad(name + " inválido.");
  return value;
}

export function searchText(value) {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.trim().length > 120)
    throw bad("Búsqueda inválida.");
  return value.trim();
}

export const literal = (text) =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

function positive(value, max) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    Number(value) > max
  )
    throw bad("Paginación inválida.");
  return Number(value);
}

export async function listResult(params, model, filter, query, serialize) {
  if (params.pagina === undefined && params.limite === undefined)
    return (await query).map(serialize);
  const pagina = positive(params.pagina ?? "1", 100000);
  const limite = positive(params.limite ?? "20", 100);
  const [rows, total] = await Promise.all([
    query.skip((pagina - 1) * limite).limit(limite),
    model.countDocuments(filter),
  ]);
  return { items: rows.map(serialize), pagina, limite, total };
}
