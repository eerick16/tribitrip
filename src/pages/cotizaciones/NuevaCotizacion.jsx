import FormDialog from "../../components/FormDialog";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import CotizacionForm from "./CotizacionForm";
 
export default function NuevaCotizacion() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const serviceId = params.get("servicio");
  const opportunityId = params.get("oportunidad");
  const { data: servicio, error: errorServicio } = useApiData(
    serviceId ? "/servicios-turisticos/" + encodeURIComponent(serviceId) : null,
  );
  const { data: oportunidades, error } = useApiData("/oportunidades");
  const opciones = oportunidades?.filter((item) => item.cliente);
  const oportunidadInicial = opciones?.find(({ id }) => id === opportunityId);

  function close() {
    const filters = new URLSearchParams(params);
    filters.delete("servicio");
    navigate(
      { pathname: "/cotizaciones", search: filters.toString() },
      { replace: true },
    );
  }

  if (opciones?.length > 0 && (!serviceId || servicio)) {
    return (
      <CotizacionForm
        key={params.toString()}
        oportunidades={opciones}
        servicioInicial={servicio}
        oportunidadInicial={oportunidadInicial}
        aviso={
          opportunityId && !oportunidadInicial
            ? "La oportunidad seleccionada no está disponible."
            : ""
        }
        onCancel={close}
        onSave={async (body) => {
          const saved = await api("/cotizaciones", { method: "POST", body });
          navigate("/cotizaciones/" + saved.id, {
            replace: true,
            state: { creada: true },
          });
        }}
      />
    );
  }

  return (
    <FormDialog title="Nueva cotización" onClose={close}>
      {(error || errorServicio) && <p role="alert">{error || errorServicio}</p>}
      {(!opciones || (serviceId && !servicio)) && !error && !errorServicio && (
        <p role="status">Cargando datos…</p>
      )}
      {opciones?.length === 0 && (
        <p>
          Registra una <Link to="/oportunidades">oportunidad comercial</Link>{" "}
          para continuar.
        </p>
      )}
    </FormDialog>
  );
}
