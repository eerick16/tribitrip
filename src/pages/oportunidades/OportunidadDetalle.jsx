import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { etapas } from "../../../shared/oportunidades.js";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import "../../components/ficha.css";

function Detalle({ id }) {
  const path = "/oportunidades/" + id;
  const { data, error: loadError } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const oportunidad = updated ?? data;

  function closeEditor() {
    setEditing(false);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      setUpdated(
        await api(path, {
          method: "PUT",
          body: { ...fields, revision: oportunidad.revision },
        }),
      );
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <Link className="btn-secondary" to="/oportunidades">
          ← Volver a oportunidades
        </Link>
      </div>
      {loadError && <p role="alert">{loadError}</p>}
      {!oportunidad && !loadError && <p role="status">Cargando oportunidad…</p>}
      {oportunidad && (
        <section
          className="panel ficha-panel"
          aria-labelledby="oportunidad-titulo"
        >
          <header className="ficha-encabezado">
            <div>
              <span className="ficha-estado" data-estado={oportunidad.etapa}>
                {oportunidad.etapa}
              </span>
              <h2 className="ficha-titulo" id="oportunidad-titulo">
                {oportunidad.titulo}
              </h2>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setEditing(true)}
            >
              Editar oportunidad
            </button>
          </header>

          <dl className="ficha-datos">
            <div>
              <dt>Cliente</dt>
              <dd>{oportunidad.cliente?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{oportunidad.asesor?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Resultado</dt>
              <dd>{oportunidad.resultado ?? "Abierta"}</dd>
            </div>
            <div>
              <dt>Fecha de cierre</dt>
              <dd>
                {oportunidad.cerradaEn ? (
                  <time dateTime={oportunidad.cerradaEn}>
                    {new Date(oportunidad.cerradaEn).toLocaleString("es-MX")}
                  </time>
                ) : (
                  "Pendiente"
                )}
              </dd>
            </div>
          </dl>

          <nav className="ficha-enlaces" aria-label="Registros vinculados">
            <Link
              className="btn-secondary"
              to={"/solicitudes/" + oportunidad.solicitud}
            >
              Consultar solicitud de viaje
            </Link>
            <Link
              className="btn-secondary"
              to={"/cotizaciones?oportunidad=" + id}
            >
              Consultar cotizaciones
            </Link>
          </nav>
          {editing && (
            <FormDialog
              title="Editar oportunidad"
              onClose={closeEditor}
              busy={busy}
            >
              <form className="account-form formulario-grid" onSubmit={submit}>
                <label>
                  Título
                  <input
                    name="titulo"
                    required
                    maxLength={120}
                    defaultValue={oportunidad.titulo}
                  />
                </label>
                <label>
                  Etapa
                  <select name="etapa" defaultValue={oportunidad.etapa}>
                    {etapas.map((etapa) => (
                      <option key={etapa}>{etapa}</option>
                    ))}
                  </select>
                </label>
                {error && <p role="alert">{error}</p>}
                <div className="formulario-acciones">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={closeEditor}
                  >
                    Cancelar
                  </button>
                  <button className="btn-primary" disabled={busy}>
                    {busy ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </FormDialog>
          )}
        </section>
      )}
    </>
  );
}

export default function OportunidadDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}
