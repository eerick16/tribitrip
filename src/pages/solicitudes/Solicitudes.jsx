import FormDialog from "../../components/FormDialog";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../services/api";
import SolicitudForm from "./SolicitudForm";

export default function Solicitudes() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState(null);
  const [clientes, setClientes] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");
  const [errorClientes, setErrorClientes] = useState("");

  useEffect(() => {
    let active = true;
    api("/solicitudes")
      .then((data) => {
        if (active) setSolicitudes(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function nuevaSolicitud() {
    setCreando(true);
    setErrorClientes("");
    try {
      setClientes(await api("/clientes"));
    } catch (err) {
      setErrorClientes(err.message);
    }
  }

  return (
    <section className="panel">
      <h2>Solicitudes registradas</h2>
      <button className="btn-primary" onClick={nuevaSolicitud}>
        Nueva solicitud
      </button>
      {creando && (
        <FormDialog
          title="Nueva solicitud"
          onClose={() => setCreando(false)}
          busy={formBusy}
        >
          {errorClientes && <p role="alert">{errorClientes}</p>}
          {!clientes && !errorClientes && (
            <p role="status">Cargando contactos…</p>
          )}
          {clientes?.length === 0 && (
            <p>
              Registra un contacto en{" "}
              <Link to="/clientes">Clientes y prospectos</Link> para continuar.
            </p>
          )}
          {clientes?.length > 0 ? (
            <SolicitudForm
              onBusyChange={setFormBusy}
              clientes={clientes}
              onCancel={() => setCreando(false)}
              onSave={async (body) => {
                const saved = await api("/solicitudes", {
                  method: "POST",
                  body,
                });
                navigate("/solicitudes/" + saved.id);
              }}
            />
          ) : (
            <button className="btn-secondary" onClick={() => setCreando(false)}>
              Cerrar
            </button>
          )}
        </FormDialog>
      )}
      {error && <p role="alert">{error}</p>}
      {!solicitudes && !error && <p role="status">Cargando solicitudes…</p>}
      {solicitudes?.length === 0 && <p>No hay solicitudes registradas.</p>}
      {solicitudes?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead>
              <tr>
                <th>Destino</th>
                <th>Cliente</th>
                <th>Salida</th>
                <th>Regreso</th>
                <th>Viajeros</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>
                    <Link to={solicitud.id}>{solicitud.destino}</Link>
                  </td>
                  <td>{solicitud.cliente.nombre}</td>
                  <td>{solicitud.salida}</td>
                  <td>{solicitud.regreso}</td>
                  <td>{solicitud.cantidadViajeros}</td>
                  <td>{solicitud.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
