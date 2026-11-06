
const secciones = [
  { id: "dashboard", nombre: "Dashboard" },
  { id: "clientes", nombre: "Clientes y prospectos" },
  { id: "solicitudes", nombre: "Solicitudes de viaje" },
  { id: "oportunidades", nombre: "Oportunidades" },
  { id: "cotizaciones", nombre: "Cotizaciones" },
  { id: "reservas", nombre: "Reservas" },
  { id: "actividades", nombre: "Actividades" },
];

function Sidebar({ paginaActual, cambiarPagina }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icono">T</span>
        <div>
          <strong>TribiTrip</strong>
          <small>Gestión CRM</small>
        </div>
      </div>

      <p className="sidebar-titulo">MENÚ PRINCIPAL</p>

      <nav className="sidebar-nav" aria-label="Menú principal">
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={
              paginaActual === seccion.id ? "activo" : ""
            }
            aria-current={
              paginaActual === seccion.id ? "page" : undefined
            }
            onClick={() => cambiarPagina(seccion.id)}
          >
            {seccion.nombre}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        TribiTrip CRM
        <small>Versión de desarrollo</small>
      </div>
    </aside>
  );
}

export default Sidebar;
