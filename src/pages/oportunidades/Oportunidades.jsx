import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../services/api";
import { useApiData } from "../../services/useApiData";
import ListFilters, { Pagination } from "../../components/ListFilters";
import { filterOptions, useFilteredList } from "../../services/useFilteredList";
import { useSession } from "../../auth/session";
import { etapas, estados } from "../../../shared/oportunidades.js";

function NuevaOportunidad({ onCancel }) {
  const navigate = useNavigate();
  const { data: solicitudes, error: loadError } = useApiData("/solicitudes");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const solicitud = solicitudes.find(
      ({ id }) => id === data.get("solicitud"),
    );
    if (!solicitud) return;
    setBusy(true);
    setError("");
    try {
      const saved = await api("/oportunidades", {
        method: "POST",
        body: {
          titulo: data.get("titulo"),
          solicitud: solicitud.id,
          cliente: solicitud.cliente.id,
          asesor: solicitud.asesor,
        },
      });
      navigate("/oportunidades/" + saved.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormDialog title="Nueva oportunidad" onClose={onCancel} busy={busy}>
      <form className="account-form formulario-grid" onSubmit={submit}>
        <h3>Nueva oportunidad</h3>
        {loadError && <p role="alert">{loadError}</p>}
        {!solicitudes && !loadError && (
          <p role="status">Cargando solicitudes…</p>
        )}
        {solicitudes?.length === 0 && (
          <p>
            Registra una <Link to="/solicitudes">solicitud de viaje</Link> para
            continuar.
          </p>
        )}
        {solicitudes?.length > 0 && (
          <>
            <label>
              Título
              <input name="titulo" required maxLength={120} />
            </label>
            <label>
              Solicitud de viaje
              <select name="solicitud" required defaultValue="">
                <option value="" disabled>
                  Selecciona una solicitud
                </option>
                {solicitudes.map((solicitud) => (
                  <option key={solicitud.id} value={solicitud.id}>
                    {solicitud.cliente.nombre} · {solicitud.destino} ·{" "}
                    {solicitud.salida}
                  </option>
                ))}
              </select>
            </label>
            <p>
              El propietario del contacto será el responsable de la oportunidad.
            </p>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="formulario-acciones">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          {solicitudes?.length > 0 && (
            <button className="btn-primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar oportunidad"}
            </button>
          )}
        </div>
      </form>
    </FormDialog>
  );
}

export default function Oportunidades() {
  const [creando, setCreando] = useState(false);
  const { usuario } = useSession();
  const admin = usuario.rol === "Administrador";
  const list = useFilteredList(
    "/oportunidades",
    admin ? ["estado", "etapa", "asesor"] : ["estado", "etapa"],
  );
  const { data, error } = list;
  const oportunidades = data?.items;
  const { data: usuarios, error: usersError } = useApiData(
    admin ? "/usuarios" : null,
  );
  const selects = [
    {
      name: "estado",
      label: "Estado comercial",
      options: filterOptions(estados),
    },
    { name: "etapa", label: "Etapa", options: filterOptions(etapas) },
    ...(admin
      ? [
          {
            name: "asesor",
            label: "Asesor responsable",
            options:
              usuarios?.map(({ id, nombre }) => ({
                value: id,
                label: nombre,
              })) ?? [],
          },
        ]
      : []),
  ];
  return (
    <section className="panel">
      <h2>Oportunidades registradas</h2>
      <button className="btn-primary" onClick={() => setCreando(true)}>
        Nueva oportunidad
      </button>
      {creando && <NuevaOportunidad onCancel={() => setCreando(false)} />}
      <ListFilters list={list} selects={selects} />
      {usersError && <p role="alert">{usersError}</p>}
      {error && <p role="alert">{error}</p>}
      {!oportunidades && !error && <p role="status">Cargando oportunidades…</p>}
      {oportunidades?.length === 0 && (
        <p>No hay oportunidades para estos filtros.</p>
      )}
      {oportunidades?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-clientes">
            <thead>
              <tr>
                <th>Oportunidad</th>
                <th>Cliente</th>
                <th>Responsable</th>
                <th>Etapa</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((oportunidad) => (
                <tr key={oportunidad.id}>
                  <td>
                    <Link to={oportunidad.id}>{oportunidad.titulo}</Link>
                  </td>
                  <td>{oportunidad.cliente?.nombre ?? "—"}</td>
                  <td>{oportunidad.asesor?.nombre ?? "—"}</td>
                  <td>{oportunidad.etapa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination list={list} />
    </section>
  );
}
