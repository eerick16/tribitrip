import { useSession } from "../auth/session";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  Plane,
  TrendingUp,
  ChartNoAxesCombined,
  FileText,
  CalendarCheck,
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
    ruta: "/oportunidades/embudo",
    nombre: "Embudo de ventas",
    icono: ChartNoAxesCombined,
    admin: true,
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
    ruta: "/reportes",
    nombre: "Reportes comerciales",
    icono: ChartNoAxesCombined,
    admin: true,
  },
];

function Sidebar() {
  const { usuario } = useSession();
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
        {[
          ...secciones,
          ...(usuario.rol === "Administrador"
            ? [{ ruta: "/usuarios", nombre: "Usuarios", icono: Users }]
            : []),
        ]
          .filter(
            (seccion) => !seccion.admin || usuario.rol === "Administrador",
          )
          .map((seccion) => {
            const Icono = seccion.icono;

            return (
              <NavLink
                key={seccion.ruta}
                to={seccion.ruta}
                end={
                  seccion.ruta === "/oportunidades" &&
                  usuario.rol === "Administrador"
                }
                className={({ isActive }) => (isActive ? "activo" : "")}
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
