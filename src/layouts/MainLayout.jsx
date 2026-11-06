
import { Outlet, useLocation } from "react-router";
import Sidebar from "../components/Sidebar";

const titulos = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes y prospectos",
  "/solicitudes": "Solicitudes de viaje",
  "/oportunidades": "Oportunidades comerciales",
  "/cotizaciones": "Cotizaciones",
  "/reservas": "Reservas",
  "/actividades": "Seguimiento de actividades",
};

function MainLayout() {
  const location = useLocation();
  const titulo = titulos[location.pathname] || "TribiTrip";

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-container">
        <header className="main-header">
          <div>
            <span className="header-subtitulo">
              TribiTrip / CRM
            </span>
            <h1>{titulo}</h1>
          </div>

          <div className="usuario">
            <span className="usuario-avatar">D</span>
            <div>
              <strong>Usuario de prueba</strong>
              <small>Sin autenticación</small>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
