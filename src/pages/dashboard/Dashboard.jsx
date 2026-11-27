import { Link } from "react-router";
import { Plane, TrendingUp, Users } from "lucide-react";
import { useSession } from "../../auth/session";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";

const count = new Intl.NumberFormat("es-MX");
const percent = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
});
const accesosAsesor = [
  { ruta: "/clientes", nombre: "Clientes y prospectos", Icono: Users },
  { ruta: "/solicitudes", nombre: "Solicitudes de viaje", Icono: Plane },
  { ruta: "/oportunidades", nombre: "Oportunidades", Icono: TrendingUp },
];

export default function Dashboard() {
  const { usuario } = useSession();
  const admin = usuario.rol === "Administrador";
  const { data, error } = useApiData("/dashboard");
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Cargando indicadores…</p>;

  const cards = [
    ["Clientes registrados", data.clientes, "Activos e inactivos"],
    ["Prospectos", data.prospectos],
    ["Oportunidades abiertas", data.abiertas],
    ["Oportunidades ganadas", data.ganadas],
    ["Oportunidades perdidas", data.perdidas],
    [
      "Conversión",
      percent.format(data.conversion),
      "Ganadas entre ganadas y perdidas",
    ],
    [
      "Ventas registradas",
      mostrarImporte(data.ventasCentavos),
      data.reservas + " reservas no canceladas",
    ],
  ];
  const stages = [
    { key: "abiertas", label: "Abiertas", value: data.abiertas },
    { key: "ganadas", label: "Ganadas", value: data.ganadas },
    { key: "perdidas", label: "Perdidas", value: data.perdidas },
  ];
  const total = stages.reduce((sum, { value }) => sum + value, 0);
  return (
    <div className="dashboard">
      <div className="bienvenida">
        <h2>{admin ? "Indicadores comerciales" : "Mis indicadores comerciales"}</h2>
        {admin ? (
          <Link className="btn-primary" to="/reportes">
            Consultar reportes por periodo
          </Link>
        ) : (
          <nav className="dashboard-accesos" aria-label="Accesos del asesor">
            {accesosAsesor.map(({ ruta, nombre, Icono }) => (
              <Link className="btn-secondary" key={ruta} to={ruta}>
                <Icono size={18} aria-hidden="true" />
                {nombre}
              </Link>
            ))}
          </nav>
        )}
      </div>
      {!total && !data.clientes && !data.prospectos && !data.reservas && (
        <p>Aún no hay registros comerciales.</p>
      )}
      <div className="indicadores">
        {cards.map(([title, value, note]) => (
          <article className="indicador-card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
          </article>
        ))}
      </div>
      <section
        className="panel oportunidades-grafica"
        aria-labelledby="oportunidades-grafica-titulo"
      >
        <header>
          <h3 id="oportunidades-grafica-titulo">
            Distribución de oportunidades
          </h3>
          <span>{count.format(total)} en total</span>
        </header>
        {total > 0 ? (
          <>
            <div className="oportunidades-barra" aria-hidden="true">
              {stages
                .filter(({ value }) => value > 0)
                .map(({ key, value }) => (
                  <span
                    key={key}
                    data-etapa={key}
                    style={{ flexGrow: value }}
                  />
                ))}
            </div>
            <ul className="oportunidades-leyenda" role="list">
              {stages.map(({ key, label, value }) => (
                <li key={key}>
                  <span
                    className="oportunidades-marca"
                    data-etapa={key}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                  <strong>{count.format(value)}</strong>
                  <span className="oportunidades-porcentaje">
                    {percent.format(value / total)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Aún no hay oportunidades registradas.</p>
        )}
      </section>
    </div>
  );
}
