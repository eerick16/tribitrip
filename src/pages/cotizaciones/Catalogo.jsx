import { useState } from "react";
import { Link } from "react-router";
import { useApiData } from "../../services/useApiData";
import ServicioForm from "./ServicioForm";
import { mostrarImporte } from "./importes";

function ServicioDetalle({ id }) {
  const { data, error } = useApiData("/servicios-turisticos/" + id);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Cargando servicio…</p>;
  return (
    <dl>
      <dt>Descripción</dt>
      <dd>{data.descripcion}</dd>
      <dt>Tipo y categoría</dt>
      <dd>{[data.tipo, data.categoria].filter(Boolean).join(" · ")}</dd>
      <dt>Destino</dt>
      <dd>{data.destino || "—"}</dd>
      <dt>Proveedor</dt>
      <dd>{data.proveedor || "—"}</dd>
      <dt>Precio de referencia</dt>
      <dd>{mostrarImporte(data.precioReferenciaCentavos)}</dd>
    </dl>
  );
}

export default function Catalogo({ onSelect, disabled = false }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const { data, error } = useApiData(
    "/servicios-turisticos?" + query,
    revision,
  );

  function addService(servicio) {
    setCreating(false);
    setQuery("");
    setSelected(servicio.id);
    setRevision((value) => value + 1);
    setNotice(servicio.nombre + " se guardó en el catálogo.");
  }

  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(event.currentTarget));
    setQuery(params.toString());
    setSelected(null);
  }

  return (
    <section className="panel">
      {!onSelect && (
        <Link className="btn-secondary" to="/cotizaciones">
          Volver a cotizaciones
        </Link>
      )}
      <h2>Catálogo de servicios turísticos</h2>
      {!onSelect && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setNotice("");
            setCreating(true);
          }}
        >
          Nuevo servicio
        </button>
      )}
      {creating && (
        <ServicioForm onClose={() => setCreating(false)} onSaved={addService} />
      )}
      {notice && <p role="status">{notice}</p>}
      <form
        key={revision}
        className="account-form formulario-grid"
        onSubmit={search}
      >
        <label>
          Nombre o destino
          <input name="q" type="search" maxLength={120} />
        </label>
        <label>
          Filtrar por destino
          <input name="destino" type="search" maxLength={120} />
        </label>
        <button className="btn-secondary">Buscar</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Cargando catálogo…</p>}
      {data?.length === 0 && <p>No se encontraron servicios o paquetes.</p>}
      {data?.map((servicio) => (
        <article className="panel" key={servicio.id}>
          <h3>{servicio.nombre}</h3>
          <p>{servicio.descripcion}</p>
          <p>
            {[
              servicio.destino,
              servicio.proveedor,
              mostrarImporte(servicio.precioReferenciaCentavos),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <button
            type="button"
            className="btn-secondary"
            aria-expanded={selected === servicio.id}
            onClick={() => {
              setSelected(selected === servicio.id ? null : servicio.id);
            }}
          >
            {selected === servicio.id ? "Ocultar detalle" : "Ver detalle"}
          </button>{" "}
          {onSelect ? (
            <button
              type="button"
              className="btn-primary"
              disabled={disabled}
              onClick={() => onSelect(servicio)}
            >
              Agregar a la cotización
            </button>
          ) : (
            <Link
              className="btn-primary"
              to={"/cotizaciones/nueva?servicio=" + servicio.id}
            >
              Cotizar este servicio
            </Link>
          )}
          {selected === servicio.id && <ServicioDetalle id={servicio.id} />}
        </article>
      ))}
    </section>
  );
}
