import { useRef, useState } from "react";
import FormDialog from "../../components/FormDialog";
import { api } from "../../services/api";
import { maxCentavos } from "../../../shared/cotizaciones";

export default function ServicioForm({ onClose, onSaved }) {
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (saving.current) return;

    const body = Object.fromEntries(new FormData(event.currentTarget));
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const servicio = await api("/servicios-turisticos", {
        method: "POST",
        body,
      });
      onSaved(servicio);
    } catch (err) {
      setError(err.message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <FormDialog title="Nuevo servicio o paquete" onClose={onClose} busy={busy}>
      <form className="account-form formulario-grid" onSubmit={submit}>
        <label>
          Nombre
          <input name="nombre" required maxLength={150} />
        </label>
        <label>
          Tipo
          <select name="tipo">
            <option>Servicio</option>
            <option>Paquete</option>
          </select>
        </label>
        <label>
          Descripción
          <textarea name="descripcion" required maxLength={400} rows={3} />
        </label>
        <label>
          Precio de referencia (MXN)
          <input
            name="precioReferencia"
            type="number"
            required
            min="0"
            max={maxCentavos / 100}
            step="0.01"
          />
        </label>
        <label>
          Categoría (opcional)
          <input name="categoria" maxLength={100} />
        </label>
        <label>
          Destino (opcional)
          <input name="destino" maxLength={120} />
        </label>
        <label>
          Proveedor (opcional)
          <input name="proveedor" maxLength={150} />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="formulario-acciones">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar en el catálogo"}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
