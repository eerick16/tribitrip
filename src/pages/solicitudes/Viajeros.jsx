import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { api } from "../../services/api";

const tipos = ["Adulto", "Menor", "Infante"];

export default function Viajeros({ solicitud, onSaved, onEditCapacity }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { viajeros, cantidadViajeros } = solicitud;

  function openNewTraveler() {
    openForm(
      viajeros.length === 0
        ? {
            nombre: solicitud.cliente.nombre,
            parentesco: "Titular de la solicitud",
          }
        : {},
    );
  }

  function openForm(viajero) {
    setError("");
    setForm(viajero);
  }

  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const path = "/solicitudes/" + solicitud.id + "/viajeros";
    setBusy(true);
    setError("");
    try {
      const saved = await api(form.id ? path + "/" + form.id : path, {
        method: form.id ? "PUT" : "POST",
        body,
      });
      onSaved(saved);
      setForm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="panel ficha-panel solicitud-viajeros"
      aria-labelledby="solicitud-viajeros"
    >
      <header className="ficha-encabezado">
        <div>
          <h2 id="solicitud-viajeros">Viajeros y acompañantes</h2>
          <p>
            {viajeros.length} de {cantidadViajeros} registrados
          </p>
        </div>
        {viajeros.length < cantidadViajeros ? (
          <button
            type="button"
            className="btn-primary"
            onClick={openNewTraveler}
          >
            Registrar viajero
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={onEditCapacity}
          >
            Aumentar cupo
          </button>
        )}
      </header>
      <dl className="ficha-datos solicitud-tipos">
        {tipos.map((tipo) => (
          <div key={tipo}>
            <dt>{tipo}</dt>
            <dd>
              {viajeros.filter((viajero) => viajero.tipo === tipo).length}
            </dd>
          </div>
        ))}
      </dl>
      {viajeros.length === 0 && (
        <p className="solicitud-viajeros-vacio">
          Aún no hay viajeros registrados.
        </p>
      )}
      {viajeros.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Relación con el cliente</th>
                <th>Tipo</th>
                <th>Nacimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajeros.map((viajero) => (
                <tr key={viajero.id}>
                  <td>{viajero.nombre}</td>
                  <td>{viajero.parentesco}</td>
                  <td>{viajero.tipo}</td>
                  <td>{viajero.nacimiento || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => openForm(viajero)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <FormDialog
          title={form.id ? "Editar viajero" : "Registrar viajero"}
          onClose={() => setForm(null)}
          busy={busy}
        >
          <form
            key={form.id || "nuevo"}
            className="account-form formulario-grid"
            onSubmit={submit}
          >
            <label>
              Nombre
              <input
                name="nombre"
                required
                maxLength={120}
                defaultValue={form.nombre}
              />
            </label>
            <label>
              Relación con el cliente principal
              <input
                name="parentesco"
                required
                maxLength={100}
                defaultValue={form.parentesco}
              />
            </label>
            <label>
              Tipo
              <select name="tipo" defaultValue={form.tipo ?? "Adulto"}>
                {tipos.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha de nacimiento (opcional)
              <input
                name="nacimiento"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                defaultValue={form.nacimiento ?? ""}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="formulario-acciones">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button className="btn-primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar viajero"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
    </section>
  );
}
