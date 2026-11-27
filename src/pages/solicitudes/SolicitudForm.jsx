import { useState } from "react";
import "./solicitudes.css";

const estados = ["Nueva", "En revisión", "Contactado", "Atendida", "Cancelada"];

export default function SolicitudForm({
  solicitud,
  clientes,
  onSave,
  onCancel,
  onBusyChange,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.regreso < data.salida) {
      setError("El regreso debe ser igual o posterior a la salida.");
      return;
    }
    setError("");
    setBusy(true);
    onBusyChange?.(true);
    try {
      await onSave({
        ...data,
        presupuesto: Number(data.presupuesto),
        cantidadViajeros: Number(data.cantidadViajeros),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="account-form formulario-grid solicitud-form"
    >
      <fieldset>
        <legend>Datos de la solicitud</legend>
        <div className="formulario-grid">
          {!solicitud && (
            <label className="campo-ancho">
              Cliente o prospecto
              <select name="cliente" required defaultValue="">
                <option value="" disabled>
                  Selecciona un contacto
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.correo})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Destino
            <input
              name="destino"
              required
              maxLength={200}
              defaultValue={solicitud?.destino}
            />
          </label>
          <label>
            Estado
            <select name="estado" defaultValue={solicitud?.estado ?? "Nueva"}>
              {estados.map((estado) => (
                <option key={estado}>{estado}</option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Fechas del viaje</legend>
        <div className="formulario-grid">
          <label>
            Salida
            <input
              name="salida"
              type="date"
              required
              defaultValue={solicitud?.salida}
            />
          </label>
          <label>
            Regreso
            <input
              name="regreso"
              type="date"
              required
              defaultValue={solicitud?.regreso}
            />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Presupuesto y viajeros</legend>
        <div className="formulario-grid">
          <label>
            Presupuesto (MXN)
            <input
              name="presupuesto"
              type="number"
              required
              min={0}
              step="any"
              defaultValue={solicitud?.presupuesto}
            />
          </label>
          <label>
            Número de viajeros
            <input
              name="cantidadViajeros"
              type="number"
              required
              min={Math.max(1, solicitud?.viajeros.length ?? 0)}
              step={1}
              defaultValue={solicitud?.cantidadViajeros ?? 1}
            />
          </label>
          <label>
            Necesidades específicas
            <textarea
              name="necesidades"
              maxLength={1000}
              rows={3}
              defaultValue={solicitud?.necesidades}
            />
          </label>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <div className="formulario-acciones">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Guardando…" : "Guardar solicitud"}
        </button>
      </div>
    </form>
  );
}
