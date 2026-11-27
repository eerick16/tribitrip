import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";
import PagosInformativos from "./PagosInformativos";
import "../../components/ficha.css";
import "./reserva-detalle.css";

function Detalle({ id }) {
  const path = "/reservas/" + id;
  const location = useLocation();
  const { data, error: loadError } = useApiData(path);
  const [updated, setUpdated] = useState(null);
  const [estado, setEstado] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const reserva = updated ?? data;

  function closeEditor() {
    setEstado("");
    setError("");
    setEditing(false);
  }

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setNotice("");
    setError("");
    try {
      setUpdated(
        await api(path + "/estado", {
          method: "PATCH",
          body: {
            ...fields,
            revision: reserva.revision,
            ...(estado ? { estado } : {}),
          },
        }),
      );
      setEstado("");
      setEditing(false);
      setNotice("Reserva actualizada.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <Link className="btn-secondary" to="/reservas">
          ← Volver a reservas
        </Link>
      </div>
      {loadError && <p role="alert">{loadError}</p>}
      {!reserva && !loadError && <p role="status">Cargando reserva…</p>}
      {reserva && (
        <>
          <section
            className="panel ficha-panel"
            aria-labelledby="reserva-folio"
          >
            <header className="ficha-encabezado">
              <div>
                <span className="ficha-estado" data-estado={reserva.estado}>
                  {reserva.estado}
                </span>
                <h2 className="ficha-titulo" id="reserva-folio">
                  {reserva.folio}
                </h2>
                <p>{reserva.destino}</p>
              </div>
              {reserva.transiciones.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={paymentBusy}
                  onClick={() => setEditing(true)}
                >
                  Actualizar reserva
                </button>
              )}
            </header>

            {(notice || location.state?.registrada) && (
              <p className="reserva-aviso" role="status">
                {notice || "Reserva interna registrada."}
              </p>
            )}

            <dl className="ficha-datos">
              <div>
                <dt>Cliente</dt>
                <dd>
                  <Link to={"/reservas?cliente=" + reserva.cliente}>
                    {reserva.clienteDocumento.nombre}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Cotización de origen</dt>
                <dd>
                  <Link to={"/cotizaciones/" + reserva.cotizacion}>
                    {reserva.folioCotizacion}
                  </Link>{" "}
                  · versión {reserva.versionAceptada}
                </dd>
              </div>
              <div>
                <dt>Fechas del viaje</dt>
                <dd>
                  <time dateTime={reserva.salida}>{reserva.salida}</time> a{" "}
                  <time dateTime={reserva.regreso}>{reserva.regreso}</time>
                </dd>
              </div>
              <div>
                <dt>Fecha de registro</dt>
                <dd>
                  {new Date(reserva.createdAt).toLocaleDateString("es-MX")}
                </dd>
              </div>
              <div>
                <dt>Localizador externo</dt>
                <dd>{reserva.localizador || "—"}</dd>
              </div>
              <div>
                <dt>Proveedor de referencia</dt>
                <dd>{reserva.proveedorReferencia || "—"}</dd>
              </div>
            </dl>

            <nav className="ficha-enlaces" aria-label="Registros vinculados">
              <Link
                className="btn-secondary"
                to={"/oportunidades/" + reserva.oportunidad}
              >
                Consultar oportunidad
              </Link>
              <Link
                className="btn-secondary"
                to={"/solicitudes/" + reserva.solicitud}
              >
                Consultar solicitud de viaje
              </Link>
            </nav>
            {editing && (
              <FormDialog
                title="Actualizar reserva"
                onClose={closeEditor}
                busy={busy}
              >
                <form
                  className="account-form formulario-grid"
                  onSubmit={submit}
                >
                  <label className="campo-ancho">
                    Nuevo estado
                    <select
                      value={estado}
                      onChange={(event) => setEstado(event.target.value)}
                    >
                      <option value="">Conservar estado actual</option>
                      {reserva.transiciones.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Localizador externo
                    <input
                      name="localizador"
                      maxLength={120}
                      defaultValue={reserva.localizador}
                    />
                  </label>
                  <label>
                    Proveedor de referencia
                    <input
                      name="proveedorReferencia"
                      maxLength={150}
                      defaultValue={reserva.proveedorReferencia}
                    />
                  </label>
                  {estado === "Cancelada" && (
                    <p>
                      La cancelación es definitiva. Los pagos informativos
                      existentes se conservan.
                    </p>
                  )}
                  {error && <p role="alert">{error}</p>}
                  <div className="formulario-acciones">
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={closeEditor}
                    >
                      Cancelar edición
                    </button>
                    <button
                      className="btn-primary"
                      disabled={busy || paymentBusy}
                    >
                      {busy ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              </FormDialog>
            )}
          </section>

          <section
            className="panel ficha-panel reserva-tabla"
            aria-labelledby="reserva-servicios"
          >
            <h2 id="reserva-servicios">Servicios acordados</h2>
            <div className="tabla-contenedor">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Proveedor</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {reserva.conceptos.map((item) => (
                    <tr key={item._id}>
                      <td>{item.descripcion}</td>
                      <td>{item.referencia?.proveedor || "—"}</td>
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
                <dd>{mostrarImporte(reserva.subtotalCentavos)}</dd>
              </div>
              <div>
                <dt>Impuestos</dt>
                <dd>{mostrarImporte(reserva.impuestosCentavos)}</dd>
              </div>
              <div>
                <dt>Cargos</dt>
                <dd>{mostrarImporte(reserva.cargosCentavos)}</dd>
              </div>
              <div className="reserva-importe">
                <dt>Total (MXN)</dt>
                <dd>{mostrarImporte(reserva.totalCentavos)}</dd>
              </div>
            </dl>
          </section>

          <PagosInformativos
            reserva={reserva}
            disabled={busy}
            onBusyChange={setPaymentBusy}
            onSaved={(summary) => setUpdated({ ...reserva, ...summary })}
          />

          <section
            className="panel reserva-notas"
            aria-label="Condiciones y observaciones"
          >
            <div>
              <h3>Condiciones comerciales</h3>
              <p>{reserva.condiciones || "Sin condiciones registradas."}</p>
            </div>
            <div>
              <h3>Observaciones de la cotización</h3>
              <p>{reserva.observaciones || "Sin observaciones registradas."}</p>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function ReservaDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}
