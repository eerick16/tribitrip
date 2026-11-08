import { Link } from "react-router";
import { mostrarImporte } from "../cotizaciones/importes";

const presupuesto = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function Registros({ titulo, registros, render }) {
  return (
    <section className="panel">
      <h3>{titulo}</h3>
      {registros.length ? (
        <ul>
          {registros.map((item) => (
            <li key={item.id}>{render(item)}</li>
          ))}
        </ul>
      ) : (
        <p>Sin registros relacionados.</p>
      )}
    </section>
  );
}

export default function FichaCliente({ ficha, onEdit, busy }) {
  const { cliente, solicitudes, oportunidades, cotizaciones, reservas } = ficha;
  return (
    <>
      <section className="panel">
        <Link className="btn-secondary" to="/clientes">
          Volver a clientes y prospectos
        </Link>
        <h2>{cliente.nombre}</h2>
        <dl>
          <dt>Estado</dt>
          <dd>{cliente.estado}</dd>
          <dt>Correo</dt>
          <dd>{cliente.correo}</dd>
          <dt>Teléfono</dt>
          <dd>{cliente.telefono}</dd>
          <dt>Asesor responsable</dt>
          <dd>{cliente.asesor || "—"}</dd>
          <dt>Origen</dt>
          <dd>{cliente.origen || "—"}</dd>
          <dt>Ubicación</dt>
          <dd>{cliente.ubicacion || "—"}</dd>
          <dt>Contacto preferido</dt>
          <dd>{cliente.contactoPreferido || "—"}</dd>
          <dt>Destino de interés</dt>
          <dd>{cliente.destinoInteres || "—"}</dd>
          <dt>Presupuesto aproximado</dt>
          <dd>
            {cliente.presupuesto == null
              ? "—"
              : presupuesto.format(cliente.presupuesto)}
          </dd>
        </dl>
        <button
          className="btn-primary"
          type="button"
          disabled={busy}
          onClick={() => onEdit(cliente)}
        >
          Editar contacto
        </button>
      </section>
      <Registros
        titulo="Solicitudes de viaje y viajeros"
        registros={solicitudes}
        render={(item) => (
          <>
            <Link to={"/solicitudes/" + item.id}>{item.destino}</Link> ·{" "}
            {item.salida} a {item.regreso} · {item.estado}
            {item.viajeros.length > 0 && (
              <ul aria-label="Viajeros">
                {item.viajeros.map((viajero) => (
                  <li key={viajero.id}>
                    {viajero.nombre} · {viajero.tipo} · {viajero.parentesco}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      />
      <Registros
        titulo="Oportunidades comerciales"
        registros={oportunidades}
        render={(item) => (
          <>
            <Link to={"/oportunidades/" + item.id}>{item.titulo}</Link> ·{" "}
            {item.etapa}
          </>
        )}
      />
      <Registros
        titulo="Cotizaciones relacionadas"
        registros={cotizaciones}
        render={(item) => (
          <>
            <Link to={"/cotizaciones/" + item.id}>{item.folio}</Link> · Versión{" "}
            {item.version} · {item.estado} ·{" "}
            {mostrarImporte(item.totalCentavos)}
          </>
        )}
      />
      <Registros
        titulo="Historial de reservas"
        registros={reservas}
        render={(item) => (
          <>
            <Link to={"/reservas/" + item.id}>{item.folio}</Link> ·{" "}
            {item.destino} · {item.estado} ·{" "}
            {mostrarImporte(item.totalCentavos)}
          </>
        )}
      />
    </>
  );
}
