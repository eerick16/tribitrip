import { Link, Outlet, useSearchParams } from "react-router";
import ListFilters, { Pagination } from "../../components/ListFilters";
import { filterOptions, useFilteredList } from "../../services/useFilteredList";
import { mostrarImporte } from "./importes";
 
export default function Cotizaciones() {
  const [params] = useSearchParams();
  const oportunidad = params.get("oportunidad");
  const path = oportunidad
    ? "/oportunidades/" + encodeURIComponent(oportunidad) + "/cotizaciones"
    : "/cotizaciones";
  const list = useFilteredList(path, ["q", "estado"]);
  const { error } = list;
  const data = list.data?.items;
  return (
    <>
      <section className="panel">
        <h2>
          {oportunidad
            ? "Cotizaciones de la oportunidad"
            : "Cotizaciones registradas"}
        </h2>
        <div className="formulario-acciones">
          <Link
            className="btn-primary"
            to={{ pathname: "nueva", search: params.toString() }}
          >
            Nueva cotización
          </Link>
          <Link className="btn-secondary" to="catalogo">
            Catálogo de servicios
          </Link>
          {oportunidad && (
            <Link className="btn-secondary" to="/cotizaciones">
              Ver todas
            </Link>
          )}
        </div>
        <ListFilters
          list={list}
          searchLabel="Folio de cotización"
          selects={[
            {
              name: "estado",
              label: "Estado",
              options: filterOptions([
                "Borrador",
                "Enviada",
                "Aceptada",
                "Rechazada",
                "Vencida",
              ]),
            },
          ]}
        />
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Cargando cotizaciones…</p>}
        {data?.length === 0 && <p>No hay cotizaciones para estos filtros.</p>}
        {data?.length > 0 && (
          <div className="tabla-contenedor">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Oportunidad</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Vigencia</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={item.id}>{item.folio}</Link>
                    </td>
                    <td>{item.cliente?.nombre}</td>
                    <td>{item.oportunidad?.titulo}</td>
                    <td>{item.version}</td>
                    <td>{item.estado}</td>
                    <td>{item.vigencia}</td>
                    <td>{mostrarImporte(item.totalCentavos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination list={list} />
      </section>
      <Outlet />
    </>
  );
}
