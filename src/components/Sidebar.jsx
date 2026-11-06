
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  Plane,
  TrendingUp,
  FileText,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";

const secciones = [
  {
    ruta: "/dashboard",
    nombre: "Dashboard",
    icono: LayoutDashboard,
  },
  {
    ruta: "/clientes",
    nombre: "Clientes y prospectos",
    icono: Users,
  },
  {
    ruta: "/solicitudes",
    nombre: "Solicitudes de viaje",
    icono: Plane,
  },
  {
    ruta: "/oportunidades",
    nombre: "Oportunidades",
    icono: TrendingUp,
  },
  {
    ruta: "/cotizaciones",
    nombre: "Cotizaciones",
    icono: FileText,
  },
  {
    ruta: "/reservas",
    nombre: "Reservas",
    icono: CalendarCheck,
  },
  {
    ruta: "/actividades",
    nombre: "Actividades",
    icono: ClipboardList,
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icono">T</span>

        <div>
          <strong>TribiTrip</strong>
          <small>Gestión CRM</small>
        </div>
      </div>

      <p className="sidebar-titulo">
        MENÚ PRINCIPAL
      </p>

      <nav
        className="sidebar-nav"
        aria-label="Menú principal"
      >
        {secciones.map((seccion) => {
          const Icono = seccion.icono;

          return (
            <NavLink
              key={seccion.ruta}
              to={seccion.ruta}
              className={({ isActive }) =>
                isActive ? "activo" : ""
              }
            >
              <Icono size={19} aria-hidden="true" />
              <span>{seccion.nombre}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        TribiTrip CRM
        <small>Versión de desarrollo</small>
      </div>
    </aside>
  );
}

export default Sidebar;
