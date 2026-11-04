import FormDialog from "../../components/FormDialog";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../../services/api";
import SolicitudForm from "./SolicitudForm";
import Viajeros from "./Viajeros";
import "../../components/ficha.css";
import "./solicitudes.css";

const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function mostrarFecha(dia) {
  return fecha.format(new Date(dia + "T00:00:00Z"));
}

function Detalle({ id }) {
  const [solicitud, setSolicitud] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/solicitudes/" + id)
      .then((data) => {
        if (active) setSolicitud(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <div>
        <Link className="btn-secondary" to="/solicitudes">
          ← Volver a solicitudes
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {!solicitud && !error && <p role="status">Cargando solicitud…</p>}
      {solicitud && (
        <>
          <section
            className="panel ficha-panel"
            aria-labelledby="solicitud-destino"
          >
            <header className="ficha-encabezado">
              <div>
                <span className="ficha-estado" data-estado={solicitud.estado}>
                  {solicitud.estado}
                </span>
                <h2 className="ficha-titulo" id="solicitud-destino">
                  {solicitud.destino}
                </h2>
                <p>Cliente · {solicitud.cliente.nombre}</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setEditando(true)}
              >
                Editar solicitud
              </button>
            </header>
            <dl className="ficha-datos">
              <div>
                <dt>Salida</dt>
                <dd>
                  <time dateTime={solicitud.salida}>
                    {mostrarFecha(solicitud.salida)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Regreso</dt>
                <dd>
                  <time dateTime={solicitud.regreso}>
                    {mostrarFecha(solicitud.regreso)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Presupuesto (MXN)</dt>
                <dd>{moneda.format(solicitud.presupuesto)}</dd>
              </div>
              <div>
                <dt>Cupo de viajeros</dt>
                <dd>{solicitud.cantidadViajeros}</dd>
              </div>
            </dl>
            <div className="solicitud-notas">
              <h3>Necesidades específicas</h3>
              <p>
                {solicitud.necesidades ||
                  "Sin necesidades específicas registradas."}
              </p>
            </div>
            {editando && (
              <FormDialog
                title="Editar solicitud"
                onClose={() => setEditando(false)}
                busy={formBusy}
              >
                <SolicitudForm
                  onBusyChange={setFormBusy}
                  solicitud={solicitud}
                  onCancel={() => setEditando(false)}
                  onSave={async (body) => {
                    setSolicitud(
                      await api("/solicitudes/" + id, { method: "PUT", body }),
                    );
                    setEditando(false);
                  }}
                />
              </FormDialog>
            )}
          </section>
          <Viajeros
            solicitud={solicitud}
            onSaved={setSolicitud}
            onEditCapacity={() => setEditando(true)}
          />
        </>
      )}
    </>
  );
}

export default function SolicitudDetalle() {
  const { id } = useParams();
  return <Detalle key={id} id={id} />;
}
