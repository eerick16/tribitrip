import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { etapas, estados } from "../../../shared/oportunidades.js";
import { useApiData } from "../../services/useApiData";
import { api } from "../../services/api";
import "./embudo.css";

function Etapas({ query }) {
  const [revision, setRevision] = useState(0);
  const [dragged, setDragged] = useState(null);
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [moveError, setMoveError] = useState("");
  const moving = useRef(false);
  const [busy, setBusy] = useState(false);
  const { data: grupos, error } = useApiData(
    "/oportunidades/embudo?" + query,
    revision,
  );

  function clearDrag() {
    setDragged(null);
    setTarget(null);
  }

  async function move(opportunity, etapa) {
    clearDrag();
    if (
      moving.current ||
      !etapas.includes(etapa) ||
      opportunity.etapa === etapa
    )
      return;

    moving.current = true;
    setBusy(true);
    setMessage("Guardando cambio de fase…");
    setMoveError("");
    try {
      await api("/oportunidades/" + opportunity.id, {
        method: "PUT",
        body: {
          titulo: opportunity.titulo,
          etapa,
          revision: opportunity.revision,
        },
      });
      setMessage(`${opportunity.titulo} pasó a ${etapa}.`);
    } catch (err) {
      setMoveError(err.message);
      setMessage("");
    } finally {
      moving.current = false;
      setBusy(false);
      setRevision((value) => value + 1);
    }
  }

  return (
    <>
      <p className="embudo-status" role="status">
        {message}
      </p>
      {moveError && <p role="alert">{moveError}</p>}
      {error && <p role="alert">{error}</p>}
      {!grupos && !error && <p role="status">Cargando embudo…</p>}
      {grupos?.every(({ cantidad }) => cantidad === 0) && (
        <p>No hay oportunidades para estos filtros.</p>
      )}
      {grupos && (
        <div className="embudo">
          {grupos.map(({ etapa, cantidad, oportunidades }) => (
            <section
              className="embudo-etapa"
              data-target={target === etapa}
              key={etapa}
              onDragOver={(event) => {
                if (!dragged || dragged.etapa === etapa) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setTarget(etapa);
              }}
              onDragLeave={(event) => {
                if (
                  !(
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                  )
                )
                  setTarget(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged) void move(dragged, etapa);
              }}
            >
              <h3>
                {etapa}
                <span>{cantidad}</span>
              </h3>
              {cantidad === 0 ? (
                <p>Sin oportunidades</p>
              ) : (
                <ul>
                  {oportunidades.map((opportunity) => (
                    <li
                      key={opportunity.id}
                      draggable={!busy}
                      data-dragging={dragged?.id === opportunity.id}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "application/x-tribitrip-opportunity",
                          opportunity.id,
                        );
                        event.dataTransfer.effectAllowed = "move";
                        setDragged(opportunity);
                      }}
                      onDragEnd={clearDrag}
                    >
                      <Link
                        draggable={false}
                        to={"/oportunidades/" + opportunity.id}
                      >
                        {opportunity.titulo}
                      </Link>
                      <small>
                        {[
                          opportunity.cliente?.nombre,
                          opportunity.asesor?.nombre,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                      <select
                        aria-label={`Fase de ${opportunity.titulo}`}
                        value={etapa}
                        disabled={busy}
                        onChange={(event) =>
                          void move(opportunity, event.target.value)
                        }
                      >
                        {etapas.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default function Embudo() {
  const [params, setParams] = useSearchParams();
  const [refresh, setRefresh] = useState(0);
  const { data: usuarios, error } = useApiData("/usuarios");
  function filter(key, value) {
    const query = new URLSearchParams(params);
    if (value) query.set(key, value);
    else query.delete(key);
    setParams(query);
  }

  return (
    <section className="panel">
      <h2>Embudo de ventas</h2>
      <div className="account-form embudo-filtros">
        <label>
          Asesor responsable
          <select
            value={params.get("asesor") || ""}
            disabled={!usuarios}
            onChange={(event) => filter("asesor", event.target.value)}
          >
            <option value="">Todos los responsables</option>
            {usuarios?.map(({ id, nombre }) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <label>
          Estado
          <select
            value={params.get("estado") || ""}
            onChange={(event) => filter("estado", event.target.value)}
          >
            <option value="">Todos los estados</option>
            {estados.map((estado) => (
              <option key={estado}>{estado}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Actualizar embudo
        </button>
      </div>
      <Etapas
        key={params.toString() + ":" + refresh}
        query={params.toString()}
      />
    </section>
  );
}
