import { Link, Outlet, useSearchParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import ListFilters, { Pagination } from "../../components/ListFilters";
import { filterOptions, useFilteredList } from "../../services/useFilteredList";
import { mostrarImporte } from "../cotizaciones/importes";

export default function Reservas() {
  const [params] = useSearchParams();
  const cliente = params.get("cliente");
  const clientPath = cliente
    ? "/clientes/" + encodeURIComponent(cliente)
    : null;
  const { data: contacto } = useApiData(clientPath);
  const list = useFilteredList(
    clientPath ? clientPath + "/reservas" : "/reservas",
    ["q", "estado"],
  );
  const { error } = list;
  const data = list.data?.items;

  return (
    <>
      <section className="panel">
        <h2>
          {cliente
            ? "Historial de reservas del cliente"
            : "Reservas registradas"}
        </h2>
        {contacto && <p>{contacto.nombre}</p>}
        <div className="formulario-acciones">
          <Link
            className="btn-primary"
            to={{ pathname: "nueva", search: params.toString() }}
          >
            Nueva reserva
          </Link>
          {cliente && (
            <Link className="btn-secondary" to="/clientes">
              Volver a clientes
            </Link>
          )}
        </div>
        <ListFilters
          list={list}
          searchLabel="Folio de reserva"
          selects={[
            {
              name: "estado",
              label: "Estado",
              options: filterOptions([
                "Pendiente de pago",
                "Confirmada",
                "En viaje",
                "Completada",
                "Cancelada",
              ]),
            },
          ]}
        />
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Cargando reservas…</p>}
        {data?.length === 0 && <p>No hay reservas para estos filtros.</p>}
        {data?.length > 0 && (
          <div className="tabla-contenedor">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Salida</th>
                  <th>Estado</th>
                  <th>Importe acordado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((reserva) => (
                  <tr key={reserva.id}>
                    <td>
                      <Link to={reserva.id}>{reserva.folio}</Link>
                    </td>
                    <td>{reserva.clienteDocumento.nombre}</td>
                    <td>{reserva.destino}</td>
                    <td>{reserva.salida}</td>
                    <td>{reserva.estado}</td>
                    <td>{mostrarImporte(reserva.totalCentavos)}</td>
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
