import { useSearchParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import { mostrarImporte } from "../cotizaciones/importes";

const todayMexico = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function ReportTable({ title, columns, rows, render }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p>Sin registros para el periodo seleccionado.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead>
              <tr>
                {columns.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.map(render)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Reportes() {
  const [params, setParams] = useSearchParams();
  const today = todayMexico();
  const { data, error } = useApiData("/reportes/comerciales?" + params);
  function submit(event) {
    event.preventDefault();
    setParams(new URLSearchParams(new FormData(event.currentTarget)));
  }
  return (
    <>
      <section className="panel">
        <h2>Reportes comerciales</h2>
        <form
          className="account-form formulario-grid"
          key={params.toString()}
          onSubmit={submit}
        >
          <label>
            Desde
            <input
              type="date"
              name="desde"
              required
              defaultValue={params.get("desde") ?? today.slice(0, 7) + "-01"}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              name="hasta"
              required
              defaultValue={params.get("hasta") ?? today}
            />
          </label>
          <button className="btn-primary">Consultar periodo</button>
        </form>
        <p>
          Fechas inclusivas en Ciudad de México. Periodo máximo de 366 días.
        </p>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Cargando reportes…</p>}
      </section>
      {data && (
        <>
          <ReportTable
            title="Destinos más solicitados"
            columns={["Destino", "Solicitudes"]}
            rows={data.destinos}
            render={({ destino, cantidad }) => (
              <tr key={destino}>
                <td>{destino}</td>
                <td>{cantidad}</td>
              </tr>
            )}
          />
          <ReportTable
            title="Ventas registradas por mes"
            columns={["Mes", "Reservas no canceladas", "Importe acordado"]}
            rows={data.ventas}
            render={({ periodo, cantidad, totalCentavos }) => (
              <tr key={periodo}>
                <td>{periodo}</td>
                <td>{cantidad}</td>
                <td>{mostrarImporte(totalCentavos)}</td>
              </tr>
            )}
          />
        </>
      )}
    </>
  );
}
