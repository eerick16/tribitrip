
const indicadores = [
  {
    titulo: "Clientes registrados",
    valor: "—",
    descripcion: "Sin datos disponibles",
  },
  {
    titulo: "Oportunidades activas",
    valor: "—",
    descripcion: "Sin datos disponibles",
  },
  {
    titulo: "Cotizaciones",
    valor: "—",
    descripcion: "Sin datos disponibles",
  },
  {
    titulo: "Reservas confirmadas",
    valor: "—",
    descripcion: "Sin datos disponibles",
  },
];

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="bienvenida">
        <h2>Bienvenido a TribiTrip</h2>
        <p>
          Administra clientes, solicitudes de viaje,
          oportunidades comerciales y reservas
          desde un solo lugar.
        </p>
      </div>

      <div className="indicadores">
        {indicadores.map((indicador) => (
          <article
            className="indicador-card"
            key={indicador.titulo}
          >
            <span>{indicador.titulo}</span>
            <strong>{indicador.valor}</strong>
            <small>{indicador.descripcion}</small>
          </article>
        ))}
      </div>

      <section className="panel">
        <h3>Actividad reciente</h3>
        <div className="estado-vacio">
          <p>No hay actividades registradas.</p>
          <span>
            Las interacciones y tareas de seguimiento
            aparecerán aquí cuando estén disponibles.
          </span>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
