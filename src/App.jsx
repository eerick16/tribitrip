
import { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import "./App.css";

const paginas = {
  dashboard: "Dashboard",
  clientes: "Clientes y prospectos",
  solicitudes: "Solicitudes de viaje",
  oportunidades: "Oportunidades comerciales",
  cotizaciones: "Cotizaciones",
  reservas: "Reservas",
  actividades: "Seguimiento de actividades",
};

function App() {
  const [paginaActual, setPaginaActual] =
    useState("dashboard");

  const titulo = paginas[paginaActual];

  return (
    <MainLayout
      paginaActual={paginaActual}
      cambiarPagina={setPaginaActual}
      titulo={titulo}
    >
      {paginaActual === "dashboard" ? (
        <Dashboard />
      ) : (
        <section className="panel">
          <h2>{titulo}</h2>
          <p>
            Este módulo se encuentra en desarrollo.
          </p>
        </section>
      )}
    </MainLayout>
  );
}

export default App;
