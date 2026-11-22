import { Navigate, Outlet, Route, Routes } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Reportes from "../pages/dashboard/Reportes";
import Clientes from "../pages/clientes/Clientes";
import Login from "../pages/Login";
import Usuarios from "../pages/Usuarios";
import Solicitudes from "../pages/solicitudes/Solicitudes";
import SolicitudDetalle from "../pages/solicitudes/SolicitudDetalle";
import Oportunidades from "../pages/oportunidades/Oportunidades";
import OportunidadDetalle from "../pages/oportunidades/OportunidadDetalle";
import Embudo from "../pages/oportunidades/Embudo";
import Catalogo from "../pages/cotizaciones/Catalogo";
import Cotizaciones from "../pages/cotizaciones/Cotizaciones";
import NuevaCotizacion from "../pages/cotizaciones/NuevaCotizacion";
import CotizacionDetalle from "../pages/cotizaciones/CotizacionDetalle";
import CotizacionDocumento from "../pages/cotizaciones/CotizacionDocumento";
import Reservas from "../pages/reservas/Reservas";
import NuevaReserva from "../pages/reservas/NuevaReserva";
import ReservaDetalle from "../pages/reservas/ReservaDetalle";
import { useSession } from "../auth/session";
function PrivateRoute() {
  const { usuario, cargando } = useSession();
  if (cargando) return <p role="status">Verificando sesión…</p>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
function AdminRoute() {
  const { usuario } = useSession();
  return usuario?.rol === "Administrador" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<Clientes />} />
          <Route element={<AdminRoute />}>
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="oportunidades/embudo" element={<Embudo />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
          <Route path="solicitudes" element={<Solicitudes />} />
          <Route path="solicitudes/:id" element={<SolicitudDetalle />} />
          <Route path="oportunidades" element={<Oportunidades />} />
          <Route path="oportunidades/:id" element={<OportunidadDetalle />} />
          <Route path="cotizaciones" element={<Cotizaciones />}>
            <Route path="nueva" element={<NuevaCotizacion />} />
          </Route>
          <Route path="cotizaciones/catalogo" element={<Catalogo />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetalle />} />
          <Route
            path="cotizaciones/:id/versiones/:version/documento"
            element={<CotizacionDocumento />}
          />
          <Route path="reservas" element={<Reservas />}>
            <Route path="nueva" element={<NuevaReserva />} />
          </Route>
          <Route path="reservas/:id" element={<ReservaDetalle />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
