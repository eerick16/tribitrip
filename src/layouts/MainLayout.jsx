import { Outlet, useLocation } from "react-router";
import { useState } from "react";
import { useSession } from "../auth/session";
import Sidebar from "../components/Sidebar";

const titulos = {
  "/usuarios": "Usuarios y roles",
  "/dashboard": "Dashboard",
  "/clientes": "Clientes y prospectos",
  "/solicitudes": "Solicitudes de viaje",
  "/oportunidades": "Oportunidades comerciales",
  "/oportunidades/embudo": "Embudo de ventas",
  "/cotizaciones": "Cotizaciones",
  "/reservas": "Reservas",
  "/reportes": "Reportes comerciales",
};

function MainLayout() {
  const location = useLocation();
  const { usuario, logout } = useSession();
  const [error, setError] = useState("");
  const seccion = "/" + location.pathname.split("/")[1];
  const titulo = titulos[location.pathname] || titulos[seccion] || "TribiTrip";

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-container">
        <header className="main-header">
          <div>
            <span className="header-subtitulo">TribiTrip / CRM</span>
            <h1>{titulo}</h1>
          </div>

          <div className="header-cuenta">
            <div className="usuario">
              <span className="usuario-avatar">
                {usuario.nombre.slice(0, 1)}
              </span>
              <div>
                <strong>{usuario.nombre}</strong>
                <small>{usuario.rol}</small>
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="main-content">
          {error && <p role="alert">{error}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
