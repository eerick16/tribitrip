import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import {
  aCentavos,
  calcularImportes,
  maxCantidad,
  maxConceptos,
} from "../../../shared/cotizaciones.js";
import Catalogo from "./Catalogo";
import { importeEditable, mostrarImporte } from "./importes";
 
function nuevaLinea(servicio) {
  return {
    key: crypto.randomUUID(),
    servicio: servicio?.id,
    nombre: servicio?.nombre,
    descripcion: servicio?.descripcion ?? "",
    cantidad: "1",
    precioUnitario: servicio
      ? importeEditable(servicio.precioReferenciaCentavos)
      : "",
  };
}

function inicializarLineas(cotizacion, servicio) {
  if (!cotizacion) return servicio ? [nuevaLinea(servicio)] : [];
  return cotizacion.conceptos.map((item) => ({
    key: item._id,
    id: item._id,
    nombre: item.referencia?.nombre,
    descripcion: item.descripcion,
    cantidad: String(item.cantidad),
    precioUnitario: importeEditable(item.precioUnitarioCentavos),
  }));
}

export default function CotizacionForm({
  cotizacion,
  oportunidades = [],
  oportunidadInicial,
  servicioInicial,
  aviso,
  onSave,
  onCancel,
}) {
  const [cliente, setCliente] = useState(oportunidadInicial?.cliente.id ?? "");
  const [oportunidad, setOportunidad] = useState(oportunidadInicial?.id ?? "");
  const [lineas, setLineas] = useState(() =>
    inicializarLineas(cotizacion, servicioInicial),
  );
  const [impuestos, setImpuestos] = useState(
    importeEditable(cotizacion?.impuestosCentavos ?? 0),
  );
  const [cargos, setCargos] = useState(
    importeEditable(cotizacion?.cargosCentavos ?? 0),
  );
  const [catalogo, setCatalogo] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const clientes = [
    ...new Map(
      oportunidades
        .filter((op) => op.cliente)
        .map((op) => [op.cliente.id, op.cliente]),
    ).values(),
  ];
  const conceptos = lineas.map(({ cantidad, precioUnitario }) => ({
    cantidad: Number(cantidad),
    precioUnitarioCentavos: aCentavos(precioUnitario),
  }));
  const importes = calcularImportes(
    conceptos,
    aCentavos(impuestos || "0"),
    aCentavos(cargos || "0"),
  );

  function editarLinea(key, field, value) {
    setLineas((prev) =>
      prev.map((linea) =>
        linea.key === key ? { ...linea, [field]: value } : linea,
      ),
    );
  }

  function agregar(servicio) {
    const nueva = nuevaLinea(servicio);
    setLineas((prev) => (prev.length < maxConceptos ? [...prev, nueva] : prev));
    setCatalogo(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!importes || lineas.some(({ descripcion }) => !descripcion.trim())) {
      setError(
        "Revisa las descripciones, cantidades e importes. Usa hasta dos decimales.",
      );
      return;
    }
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const body = {
      ...fields,
      ...(cotizacion
        ? { revision: cotizacion.revision }
        : { cliente, oportunidad }),
      impuestos: impuestos || "0",
      cargos: cargos || "0",
      conceptos: lineas.map(
        ({ id, servicio, descripcion, cantidad, precioUnitario }) => ({
          id,
          servicio,
          descripcion,
          cantidad: Number(cantidad),
          precioUnitario,
        }),
      ),
    };
    setBusy(true);
    setError("");
    try {
      await onSave(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormDialog
      title={cotizacion ? "Nueva versión de la cotización" : "Nueva cotización"}
      onClose={onCancel}
      busy={busy}
    >
      {aviso && <p role={cotizacion ? undefined : "alert"}>{aviso}</p>}
      <form className="account-form formulario-grid" onSubmit={submit}>
        {!cotizacion && (
          <>
            <label>
              Cliente
              <select
                required
                value={cliente}
                onChange={(event) => {
                  setCliente(event.target.value);
                  setOportunidad("");
                }}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map(({ id, nombre }) => (
                  <option value={id} key={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Oportunidad
              <select
                required
                value={oportunidad}
                onChange={(event) => setOportunidad(event.target.value)}
              >
                <option value="">Selecciona una oportunidad</option>
                {oportunidades
                  .filter((op) => op.cliente?.id === cliente)
                  .map(({ id, titulo }) => (
                    <option value={id} key={id}>
                      {titulo}
                    </option>
                  ))}
              </select>
            </label>
          </>
        )}
        <label className="campo-ancho">
          Vigencia hasta
          <input
            name="vigencia"
            type="date"
            required
            defaultValue={cotizacion?.vigencia}
          />
        </label>
        {lineas.length === 0 && (
          <p>Agrega un servicio del catálogo o un concepto manual.</p>
        )}
        {lineas.map((linea, index) => {
          const subtotal = calcularImportes(
            [conceptos[index]],
            0,
            0,
          )?.subtotalCentavos;
          return (
            <fieldset key={linea.key}>
              <legend>
                Concepto {index + 1}
                {linea.nombre ? " · " + linea.nombre : ""}
              </legend>
              <div className="formulario-grid">
                <label className="campo-ancho">
                  Descripción
                  <textarea
                    required
                    maxLength={400}
                    rows={2}
                    value={linea.descripcion}
                    onChange={(event) =>
                      editarLinea(linea.key, "descripcion", event.target.value)
                    }
                  />
                </label>
                <label>
                  Cantidad
                  <input
                    type="number"
                    required
                    min={1}
                    max={maxCantidad}
                    step={1}
                    value={linea.cantidad}
                    onChange={(event) =>
                      editarLinea(linea.key, "cantidad", event.target.value)
                    }
                  />
                </label>
                <label>
                  Precio unitario (MXN)
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={linea.precioUnitario}
                    onChange={(event) =>
                      editarLinea(
                        linea.key,
                        "precioUnitario",
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>
              <p>
                Subtotal{" "}
                {subtotal === undefined ? "—" : mostrarImporte(subtotal)}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setLineas((prev) =>
                    prev.filter(({ key }) => key !== linea.key),
                  )
                }
              >
                Quitar concepto
              </button>
            </fieldset>
          );
        })}
        <div className="formulario-acciones">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || lineas.length >= maxConceptos}
            onClick={() => agregar()}
          >
            Agregar concepto manual
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || lineas.length >= maxConceptos}
            aria-expanded={catalogo}
            onClick={() => setCatalogo(!catalogo)}
          >
            Seleccionar del catálogo
          </button>
        </div>
        <label>
          Impuestos (MXN)
          <input
            type="number"
            min={0}
            step="0.01"
            value={impuestos}
            onChange={(event) => setImpuestos(event.target.value)}
          />
        </label>
        <label>
          Cargos (MXN)
          <input
            type="number"
            min={0}
            step="0.01"
            value={cargos}
            onChange={(event) => setCargos(event.target.value)}
          />
        </label>
        <dl aria-live="polite">
          <dt>Subtotal</dt>
          <dd>{importes ? mostrarImporte(importes.subtotalCentavos) : "—"}</dd>
          <dt>Total</dt>
          <dd>{importes ? mostrarImporte(importes.totalCentavos) : "—"}</dd>
        </dl>
        <label>
          Condiciones comerciales
          <textarea
            name="condiciones"
            rows={3}
            maxLength={2000}
            defaultValue={cotizacion?.condiciones}
          />
        </label>
        <label>
          Observaciones
          <textarea
            name="observaciones"
            rows={3}
            maxLength={2000}
            defaultValue={cotizacion?.observaciones}
          />
        </label>
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
          <button
            className="btn-primary"
            disabled={busy || lineas.length === 0}
          >
            {busy ? "Guardando…" : "Guardar cotización"}
          </button>
        </div>
      </form>
      {catalogo && (
        <Catalogo
          onSelect={agregar}
          disabled={busy || lineas.length >= maxConceptos}
        />
      )}
    </FormDialog>
  );
}
