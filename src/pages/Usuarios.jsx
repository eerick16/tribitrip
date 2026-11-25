import FormDialog from "../components/FormDialog";
import { useEffect, useState } from "react";
import { api } from "../services/api";
const initial = {
  nombre: "",
  correo: "",
  rol: "Asesor",
  activo: true,
  password: "",
};
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [id, setId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api("/usuarios")
      .then((data) => {
        if (active) setUsuarios(data);
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function closeForm() {
    setShowForm(false);
    setForm(initial);
    setId(null);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/usuarios" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: form,
      });
      setUsuarios(await api("/usuarios"));
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Usuarios y roles</h2>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setShowForm(true)}
      >
        Nuevo usuario
      </button>
      {loadError && <p role="alert">{loadError}</p>}
      {showForm && (
        <FormDialog
          title={id ? "Editar usuario" : "Nuevo usuario"}
          onClose={closeForm}
          busy={busy}
        >
          <form onSubmit={submit} className="account-form formulario-grid">
            {["nombre", "correo", "password"].map((field) => (
              <label key={field}>
                {field === "password"
                  ? id
                    ? "Nueva contraseña (opcional)"
                    : "Contraseña"
                  : field === "correo"
                    ? "Correo"
                    : "Nombre"}
                <input
                  type={
                    field === "password"
                      ? "password"
                      : field === "correo"
                        ? "email"
                        : "text"
                  }
                  value={form[field]}
                  required={field !== "password" || !id}
                  minLength={field === "password" ? 12 : undefined}
                  maxLength={field === "password" ? 128 : 254}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Rol
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              >
                <option>Asesor</option>
                <option>Administrador</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />{" "}
              Cuenta activa
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="formulario-acciones">
              <button className="btn-primary" disabled={busy}>
                {busy ? "Guardando…" : id ? "Guardar cambios" : "Crear usuario"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={closeForm}
              >
                Cancelar
              </button>
            </div>
          </form>
        </FormDialog>
      )}
      <div className="tabla-contenedor">
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setId(u.id);
                      setForm({
                        nombre: u.nombre,
                        correo: u.correo,
                        rol: u.rol,
                        activo: u.activo,
                        password: "",
                      });
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
