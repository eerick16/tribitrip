import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import FormDialog from "../../components/FormDialog";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import CotizacionForm from "./CotizacionForm";
import { mostrarImporte } from "./importes";
import "../../components/ficha.css";
import "./cotizacion-detalle.css";

const acciones = {
  Enviada: "Marcar como enviada",
  Aceptada: "Registrar aceptación",
  Rechazada: "Registrar rechazo",
  Vencida: "Registrar vencimiento",
};

function Detalle({ id }) {
  const location = useLocation();
  const path = "/cotizaciones/" + id;
  const { data, error } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const quote = updated ?? data;
  const preview = (version) =>
    "/cotizaciones/" + id + "/versiones/" + version + "/documento";

  function adopt(saved) {
    setUpdated({
      ...saved,
      cliente: quote.cliente,
      oportunidad: quote.oportunidad,
    });
  }

  function closeStatus() {
    setPending(null);
    setActionError("");
  }

  async function changeStatus() {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      adopt(
        await api(path + "/estado", {
          method: "PATCH",
          body: { estado: pending, revision: quote.revision },
        }),
      );
      setPending(null);
      setNotice("Estado actualizado.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <Link className="btn-secondary" to="/cotizaciones">
          ← Volver a cotizaciones
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {!quote && !error && <p role="status">Cargando cotización…</p>}
      {quote && (
        <>
          <section
            className="panel ficha-panel"
            aria-labelledby="cotizacion-folio"
          >
            <header className="ficha-encabezado">
              <div>
                <span className="ficha-estado" data-estado={quote.estado}>
                  {quote.estado}
                </span>
                <h2
                  className="ficha-titulo cotizacion-folio"
                  id="cotizacion-folio"
                >
                  {quote.folio}
                </h2>
              </div>
              <Link className="btn-secondary" to={preview(quote.version)}>
                Ver documento imprimible
              </Link>
            </header>

            {(notice || (!editing && location.state?.creada)) && (
              <p className="cotizacion-aviso" role="status">
                {notice || "Cotización guardada."}
              </p>
            )}

            <dl className="ficha-datos">
              <div>
                <dt>Cliente</dt>
                <dd>{quote.cliente?.nombre ?? "—"}</dd>
              </div>
              <div>
                <dt>Oportunidad</dt>
                <dd>
                  {quote.oportunidad ? (
                    <Link to={"/oportunidades/" + quote.oportunidad._id}>
                      {quote.oportunidad.titulo}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Fecha de creación</dt>
                <dd>{new Date(quote.createdAt).toLocaleDateString("es-MX")}</dd>
              </div>
              <div>
                <dt>Vigencia hasta</dt>
                <dd>
                  <time dateTime={quote.vigencia}>{quote.vigencia}</time>
                </dd>
              </div>
              <div>
                <dt>Versión actual</dt>
                <dd>{quote.version}</dd>
              </div>
              {quote.versionAceptada && (
                <div>
                  <dt>Versión aceptada</dt>
                  <dd>{quote.versionAceptada}</dd>
                </div>
              )}
            </dl>

            <div className="ficha-enlaces">
              {quote.estado === "Aceptada" ? (
                <Link
                  className="btn-primary"
                  to={"/reservas/nueva?cotizacion=" + id}
                >
                  Registrar o consultar reserva
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setNotice("");
                    setEditing(true);
                  }}
                >
                  Crear nueva versión
                </button>
              )}
              {quote.transiciones.map((estado) => (
                <button
                  key={estado}
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setActionError("");
                    setPending(estado);
                  }}
                >
                  {acciones[estado]}
                </button>
              ))}
            </div>

            {editing && (
              <CotizacionForm
                cotizacion={quote}
                aviso={`Al guardar, se archivará la versión ${quote.version} y se creará un borrador.`}
                onCancel={() => setEditing(false)}
                onSave={async (body) => {
                  adopt(await api(path, { method: "PUT", body }));
                  setEditing(false);
                  setNotice("Nueva versión guardada.");
                }}
              />
            )}
            {pending && (
              <FormDialog
                title={acciones[pending]}
                onClose={closeStatus}
                busy={busy}
              >
                <p>
                  {pending === "Aceptada"
                    ? `La versión ${quote.version} quedará bloqueada para edición.`
                    : `Estado de la cotización después de confirmar: ${pending}.`}
                </p>
                {actionError && <p role="alert">{actionError}</p>}
                <div className="formulario-acciones">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={closeStatus}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={changeStatus}
                  >
                    {busy ? "Guardando…" : "Confirmar cambio"}
                  </button>
                </div>
              </FormDialog>
            )}
          </section>

          <section
            className="panel ficha-panel cotizacion-conceptos"
            aria-labelledby="cotizacion-conceptos"
          >
            <h2 id="cotizacion-conceptos">Conceptos e importes</h2>
            <div className="tabla-contenedor">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.conceptos.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.descripcion}
                        {item.referencia && (
                          <small>
                            {item.referencia.nombre}
                            {item.referencia.proveedor &&
                              " · " + item.referencia.proveedor}
                          </small>
                        )}
                      </td>
                      <td>{item.cantidad}</td>
                      <td>{mostrarImporte(item.precioUnitarioCentavos)}</td>
                      <td>{mostrarImporte(item.subtotalCentavos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ficha-datos">
              <div>
                <dt>Subtotal</dt>
                <dd>{mostrarImporte(quote.subtotalCentavos)}</dd>
              </div>
              <div>
                <dt>Impuestos</dt>
                <dd>{mostrarImporte(quote.impuestosCentavos)}</dd>
              </div>
              <div>
                <dt>Cargos</dt>
                <dd>{mostrarImporte(quote.cargosCentavos)}</dd>
              </div>
              <div className="cotizacion-total">
                <dt>Total (MXN)</dt>
                <dd>{mostrarImporte(quote.totalCentavos)}</dd>
              </div>
            </dl>
          </section>

          <section
            className="panel cotizacion-notas"
            aria-label="Condiciones y observaciones"
          >
            <div>
              <h3>Condiciones comerciales</h3>
              <p>{quote.condiciones || "Sin condiciones registradas."}</p>
            </div>
            <div>
              <h3>Observaciones</h3>
              <p>{quote.observaciones || "Sin observaciones registradas."}</p>
            </div>
          </section>

          <section
            className="panel cotizacion-versiones"
            aria-labelledby="cotizacion-versiones"
          >
            <h2 id="cotizacion-versiones">Versiones anteriores</h2>
            {quote.versiones?.length ? (
              <ul>
                {[...quote.versiones].reverse().map(({ version, estado }) => (
                  <li key={version}>
                    <Link to={preview(version)}>Ver versión {version}</Link>
                    <span className="ficha-estado" data-estado={estado}>
                      {estado}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aún no hay versiones anteriores.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default function CotizacionDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}
