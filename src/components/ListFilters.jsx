export default function ListFilters({ list, searchLabel, selects = [] }) {
  const { search, setFilters } = list;
  return (
    <form
      className="account-form formulario-grid"
      key={search.toString()}
      onSubmit={(event) => {
        event.preventDefault();
        setFilters(new FormData(event.currentTarget));
      }}
    >
      {searchLabel && (
        <label>
          {searchLabel}
          <input
            name="q"
            type="search"
            maxLength={120}
            defaultValue={search.get("q") ?? ""}
          />
        </label>
      )}
      {selects.map(({ name, label, options }) => (
        <label key={name}>
          {label}
          <select name={name} defaultValue={search.get(name) ?? ""}>
            <option value="">Todos</option>
            {options.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="formulario-acciones">
        <button className="btn-primary">Aplicar filtros</button>
        <button
          className="btn-secondary"
          type="button"
          onClick={(event) => {
            event.currentTarget.form.reset();
            setFilters(new FormData());
          }}
        >
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}

export function Pagination({ list }) {
  const { data, setPage } = list;
  if (!data) return null;
  const { pagina, total, limite } = data;
  const pages = Math.max(1, Math.ceil(total / limite));
  return (
    <nav className="formulario-acciones paginacion" aria-label="Paginación">
      <button
        className="btn-secondary"
        type="button"
        disabled={pagina <= 1}
        onClick={() => setPage(pagina > pages ? pages : pagina - 1)}
      >
        Anterior
      </button>
      <span>
        {total} resultados · Página {pagina} de {pages}
      </span>
      <button
        className="btn-secondary"
        type="button"
        disabled={pagina >= pages}
        onClick={() => setPage(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
