import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";

function Registro({ cotizacionInicial, onClose }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(cotizacionInicial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { data: cotizaciones, error: loadError } = useApiData("/cotizaciones");
  const quote = cotizaciones?.find(({ id }) => id === selected);
  const accepted = cotizaciones?.filter(({ estado }) => estado === "Aceptada");
  const { data: existing, error: lookupError } = useApiData(
    quote?.estado === "Aceptada"
      ? "/cotizaciones/" + quote.id + "/reserva"
      : null,
  );

  async function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const saved = await api("/reservas", {
        method: "POST",
        body: { ...fields, cotizacion: selected },
      });
      navigate("/reservas/" + saved.id, {
        replace: true,
        state: { registrada: true },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormDialog title="Nueva reserva interna" onClose={onClose} busy={busy}>
      {!accepted && !loadError && <p role="status">Cargando cotizaciones…</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {accepted?.length === 0 && (
        <p>
          No hay <Link to="/cotizaciones">cotizaciones aceptadas</Link>{" "}
          disponibles.
        </p>
      )}
      {accepted?.length > 0 && (
        <form className="account-form formulario-grid" onSubmit={submit}>
          <label className="campo-ancho">
            Cotización aceptada
            <select
              required
              disabled={busy}
              value={quote?.estado === "Aceptada" ? selected : ""}
              onChange={(event) => {
                setError("");
                setSelected(event.target.value);
              }}
            >
              <option value="">Selecciona una cotización</option>
              {accepted.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.folio} · {item.cliente?.nombre} ·{" "}
                  {item.oportunidad?.titulo}
                </option>
              ))}
            </select>
          </label>
          {selected && quote?.estado !== "Aceptada" && (
            <p role="alert">
              La cotización indicada no está disponible para reservar.
            </p>
          )}
          {quote?.estado === "Aceptada" &&
            existing === undefined &&
            !lookupError && <p role="status">Consultando reserva existente…</p>}
          {lookupError && <p role="alert">{lookupError}</p>}
          {existing && (
            <Link className="btn-primary" to={"/reservas/" + existing.id}>
              Consultar reserva {existing.folio}
            </Link>
          )}
          {existing === null && (
            <>
              <p>
                La oportunidad debe estar en etapa Ganada. El registro es
                interno.
              </p>
              {quote?.oportunidad && (
                <Link
                  className="btn-secondary"
                  to={"/oportunidades/" + quote.oportunidad._id}
                >
                  Consultar oportunidad
                </Link>
              )}
              <label>
                Localizador externo (opcional)
                <input name="localizador" maxLength={120} />
              </label>
              <label>
                Proveedor de referencia (opcional)
                <input name="proveedorReferencia" maxLength={150} />
              </label>
              <button className="btn-primary" disabled={busy}>
                {busy ? "Guardando…" : "Registrar reserva"}
              </button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </FormDialog>
  );
}

export default function NuevaReserva() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cotizacion = params.get("cotizacion");

  function close() {
    const filters = new URLSearchParams(params);
    filters.delete("cotizacion");
    navigate(
      { pathname: "/reservas", search: filters.toString() },
      { replace: true },
    );
  }

  return (
    <Registro
      key={cotizacion ?? ""}
      cotizacionInicial={cotizacion}
      onClose={close}
    />
  );
}
