
import { Navigate, Route, Routes } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Clientes from "../pages/clientes/Clientes";

function ModuloPendiente({ titulo }) {
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      <p>Este módulo se encuentra en desarrollo.</p>
    </section>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          index
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="clientes"
          element={<Clientes />}
        />

        <Route
          path="solicitudes"
          element={
            <ModuloPendiente titulo="Solicitudes de viaje" />
          }
        />

        <Route
          path="oportunidades"
          element={
            <ModuloPendiente titulo="Oportunidades comerciales" />
          }
        />

        <Route
          path="cotizaciones"
          element={
            <ModuloPendiente titulo="Cotizaciones" />
          }
        />

        <Route
          path="reservas"
          element={
            <ModuloPendiente titulo="Reservas" />
          }
        />

        <Route
          path="actividades"
          element={
            <ModuloPendiente titulo="Seguimiento de actividades" />
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
