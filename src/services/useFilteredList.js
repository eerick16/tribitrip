import { useSearchParams } from "react-router";
import { useApiData } from "./useApiData";

export const filterOptions = (values) =>
  values.map((value) => ({ value, label: value }));

export function useFilteredList(path, keys, revision) {
  const [params, setParams] = useSearchParams();
  const search = new URLSearchParams();
  for (const key of [...keys, "pagina"]) {
    const value = params.get(key);
    if (value) search.set(key, value);
  }
  if (!search.has("pagina")) search.set("pagina", "1");
  const result = useApiData(path ? path + "?" + search : null, revision);

  function setFilters(values) {
    const next = new URLSearchParams(params);
    for (const key of keys) {
      const value = values.get(key)?.trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("pagina");
    setParams(next);
  }

  function setPage(pagina) {
    const next = new URLSearchParams(params);
    next.set("pagina", String(pagina));
    setParams(next);
  }

  return { ...result, search, setFilters, setPage };
}
