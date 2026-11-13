import FormDialog from "../../components/FormDialog";
import { useRef, useState } from "react";
import { api } from "../../services/api";
import { importeEditable, mostrarImporte } from "../cotizaciones/importes";

const hoy = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function PagosInformativos({
  reserva,
  onSaved,
  disabled,
  onBusyChange,
}) {
  const intento = useRef(null);
  const [movement, setMovement] = useState(null);
  const refund = movement === "devoluciones";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function closeEditor() {
    setError("");
    setMovement(null);
  }

  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (refund) data.monto = importeEditable(reserva.excedenteCentavos);
    const serialized = JSON.stringify({ movement, data });
    if (intento.current?.serialized !== serialized)
      intento.current = { serialized, clave: crypto.randomUUID() };
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const summary = await api("/reservas/" + reserva.id + "/" + movement, {
        method: "POST",
        body: { ...data, clave: intento.current.clave },
      });
      onSaved(summary);
      intento.current = null;
      setMovement(null);
      if (refund) setNotice("Devolución registrada.");
      else if (
        reserva.estado === "Pendiente de pago" &&
        summary.estado === "Confirmada"
      )
        setNotice("Pago registrado. La reserva se confirmó automáticamente.");
      else setNotice("Pago informativo registrado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <section
      className="panel ficha-panel reserva-tabla"
      aria-labelledby="reserva-pagos"
    >
      <header className="ficha-encabezado">
        <div>
          <h2 id="reserva-pagos">Pagos informativos</h2>
          <p>
            TribiTrip registra los pagos reportados por el cliente. El registro
            no realiza ningún cobro.
          </p>
        </div>
        <div className="formulario-acciones">
          {reserva.estado !== "Cancelada" && (
            <button
              type="button"
              className="btn-primary"
              disabled={disabled}
              onClick={() => {
                setNotice("");
                setMovement("pagos");
              }}
            >
              Registrar pago informativo
            </button>
          )}
          {reserva.excedenteCentavos > 0 && (
            <button
              type="button"
              className="btn-secondary"
              disabled={disabled}
              onClick={() => {
                setNotice("");
                setMovement("devoluciones");
              }}
            >
              Devolver cambio
            </button>
          )}
        </div>
      </header>
      <dl className="ficha-datos">
        <div>
          <dt>Importe acordado</dt>
          <dd>{mostrarImporte(reserva.totalCentavos)}</dd>
        </div>
        <div>
          <dt>Pago neto registrado</dt>
          <dd>{mostrarImporte(reserva.pagadoCentavos)}</dd>
        </div>
        {reserva.excedenteCentavos > 0 ? (
          <div className="reserva-importe">
            <dt>Excedente de pago</dt>
            <dd>{mostrarImporte(reserva.excedenteCentavos)}</dd>
          </div>
        ) : (
          <div className="reserva-importe">
            <dt>
              {reserva.saldoCentavos > 0
                ? "Saldo pendiente"
                : "Saldo liquidado"}
            </dt>
            <dd>{mostrarImporte(reserva.saldoCentavos)}</dd>
          </div>
        )}
      </dl>
      {reserva.estado === "Cancelada" && (
        <p>
          La reserva está cancelada. Los pagos anteriores se conservan en el
          historial.
        </p>
      )}
      {notice && (
        <p className="reserva-aviso" role="status">
          {notice}
        </p>
      )}
      {movement && (
        <FormDialog
          title={refund ? "Devolver cambio" : "Registrar pago informativo"}
          onClose={closeEditor}
          busy={busy}
        >
          <form className="account-form formulario-grid" onSubmit={submit}>
            {refund && (
              <p>
                Registra el cambio de{" "}
                {mostrarImporte(reserva.excedenteCentavos)} entregado al cliente
                por el medio indicado.
              </p>
            )}
            <label>
              Fecha {refund ? "de devolución" : "del pago"}
              <input
                name="fecha"
                type="date"
                required
                max={hoy()}
                defaultValue={hoy()}
              />
            </label>
            {!refund && (
              <label>
                Monto (MXN)
                <input
                  name="monto"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                />
              </label>
            )}
            <label>
              {refund ? "Método de devolución" : "Método informado"}
              <input name="metodo" required maxLength={80} />
            </label>
            <label>
              {refund ? "Referencia de devolución" : "Referencia del pago"}
              <input name="referencia" required maxLength={120} />
            </label>
            <label>
              Observaciones
              <textarea name="observaciones" maxLength={500} rows={3} />
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
              <button className="btn-primary" disabled={busy || disabled}>
                {busy
                  ? "Guardando…"
                  : refund
                    ? "Registrar devolución"
                    : "Guardar registro"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
      {reserva.pagos.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th>Monto</th>
                <th>Método informado</th>
                <th>Referencia</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {reserva.pagos.map((pago) => (
                <tr key={pago._id}>
                  <td>{pago.fecha}</td>
                  <td>{pago.tipo ?? "Pago"}</td>
                  <td>
                    {mostrarImporte(
                      pago.tipo === "Devolución"
                        ? -pago.montoCentavos
                        : pago.montoCentavos,
                    )}
                  </td>
                  <td>{pago.metodo}</td>
                  <td>{pago.referencia}</td>
                  <td>{pago.observaciones || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
