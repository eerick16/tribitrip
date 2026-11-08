import FormDialog from "../../components/FormDialog";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import { filterOptions, useFilteredList } from "../../services/useFilteredList";
import ListFilters, { Pagination } from "../../components/ListFilters";
import FichaCliente from "./FichaCliente";
import "./Clientes.css";
import { api } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";

const formularioInicial = {
  nombre: "",
  telefono: "",
  correo: "",
  ubicacion: "",
  contactoPreferido: "WhatsApp",
  estado: "Prospecto",
  origen: "Otro",
  destinoInteres: "",
  presupuesto: "",
};

function GestionClientes({ id }) {
  const [revision, setRevision] = useState(0);
  const listado = useFilteredList(
    id ? null : "/clientes",
    ["q", "estado"],
    revision,
  );
  const ficha = useApiData(id ? "/clientes/" + id + "/ficha" : null, revision);
  const clientes = listado.data?.items ?? [];
  const resumen = listado.data?.resumen;
  const recurso = id ? ficha : listado;
  const cargando = !recurso.data && !recurso.error;
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setError("");
  }

  function nuevoCliente() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setError("");
    setMostrarFormulario(true);
  }

  function editarCliente(cliente) {
    setFormulario({
      ...formularioInicial,
      ...cliente,
    });
    setEditandoId(cliente.id);
    setError("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(formularioInicial);
    setError("");
  }

  async function guardarCliente(evento) {
    evento.preventDefault();

    const nombre = formulario.nombre.trim();
    const correo = formulario.correo.trim().toLowerCase();
    const telefono = formulario.telefono.trim();

    if (!nombre || !correo || !telefono) {
      setError("Completa los campos obligatorios.");
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoValido.test(correo)) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    const telefonoNormalizado = telefono.replace(/\D/g, "");
    if (telefonoNormalizado.length < 10 || telefonoNormalizado.length > 15) {
      setError("Introduce un teléfono de entre 10 y 15 dígitos.");
      return;
    }

    const duplicado = clientes.some((cliente) => {
      if (cliente.id === editandoId) return false;

      const mismoCorreo = cliente.correo.toLowerCase() === correo;

      const mismoTelefono =
        cliente.telefono.replace(/\D/g, "") === telefonoNormalizado;

      return mismoCorreo || mismoTelefono;
    });

    if (duplicado) {
      setError("Ya existe un contacto con ese correo o teléfono.");
      return;
    }

    const datos = {
      ...formulario,
      nombre,
      correo,
      telefono,
      ubicacion: formulario.ubicacion.trim(),
      destinoInteres: formulario.destinoInteres.trim(),
      presupuesto:
        formulario.presupuesto !== "" && formulario.presupuesto !== null
          ? Number(formulario.presupuesto)
          : "",
    };

    setGuardando(true);
    try {
      await api("/clientes" + (editandoId ? "/" + editandoId : ""), {
        method: editandoId ? "PUT" : "POST",
        body: datos,
      });
      setRevision((prev) => prev + 1);
      cerrarFormulario();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function eliminarCliente(cliente) {
    setClienteAEliminar(cliente);
  }

  async function confirmarEliminacion() {
    if (!clienteAEliminar || guardando) return;
    setGuardando(true);
    try {
      await api("/clientes/" + clienteAEliminar.id, { method: "DELETE" });
      setRevision((prev) => prev + 1);
      setClienteAEliminar(null);
    } catch (err) {
      setError(err.message);
      setClienteAEliminar(null);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="clientes-page">
      {cargando && <p role="status">Cargando contactos...</p>}
      {error && !mostrarFormulario && <p role="alert">{error}</p>}
      {recurso.error && <p role="alert">{recurso.error}</p>}
      {id ? (
        ficha.data && (
          <FichaCliente
            ficha={ficha.data}
            onEdit={editarCliente}
            busy={guardando}
          />
        )
      ) : (
        <>
          <div className="clientes-encabezado">
            <div>
              <h2>Clientes y prospectos</h2>
              <p>
                Administra los contactos y oportunidades comerciales de la
                agencia.
              </p>
            </div>

            <button
              className="btn-primary"
              disabled={cargando || guardando}
              onClick={nuevoCliente}
            >
              + Nuevo contacto
            </button>
          </div>

          {resumen && (
            <div className="clientes-resumen">
              {[
                [
                  "Total de contactos",
                  Object.values(resumen).reduce((sum, count) => sum + count, 0),
                ],
                ["Prospectos", resumen.Prospecto ?? 0],
                ["Clientes activos", resumen.Activo ?? 0],
                ["Clientes inactivos", resumen.Inactivo ?? 0],
              ].map(([label, count]) => (
                <div className="resumen-card" key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
          <section className="clientes-panel">
            <div className="clientes-filtros">
              <ListFilters
                list={listado}
                searchLabel="Nombre, correo o teléfono"
                selects={[
                  {
                    name: "estado",
                    label: "Estado",
                    options: filterOptions(["Prospecto", "Activo", "Inactivo"]),
                  },
                ]}
              />
            </div>

            <div className="tabla-contenedor">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Origen</th>
                    <th>Destino de interés</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <Link to={"/clientes/" + cliente.id}>
                          <strong>{cliente.nombre}</strong>
                        </Link>
                        <small>{cliente.ubicacion || "Sin ubicación"}</small>
                      </td>
                      <td>
                        {cliente.correo}
                        <small>{cliente.telefono}</small>
                      </td>
                      <td>
                        <span
                          className={`estado-cliente ${cliente.estado.toLowerCase()}`}
                        >
                          {cliente.estado}
                        </span>
                      </td>
                      <td>{cliente.origen}</td>
                      <td>{cliente.destinoInteres || "—"}</td>
                      <td>
                        <div className="acciones-cliente">
                          <Link
                            className="btn-secondary"
                            to={"/reservas?cliente=" + cliente.id}
                          >
                            Historial de reservas
                          </Link>
                          <button onClick={() => editarCliente(cliente)}>
                            Editar
                          </button>
                          <button
                            className="btn-eliminar"
                            onClick={() => eliminarCliente(cliente)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {listado.data && clientes.length === 0 && (
                <div className="clientes-vacio">
                  <p>No se encontraron contactos.</p>
                  <span>Registra uno nuevo o modifica los filtros.</span>
                </div>
              )}
            </div>

            <Pagination list={listado} />
          </section>
        </>
      )}

      {mostrarFormulario && (
        <FormDialog
          title={editandoId !== null ? "Editar contacto" : "Nuevo contacto"}
          onClose={cerrarFormulario}
          busy={guardando}
        >
          <form onSubmit={guardarCliente}>
            <div className="formulario-grid">
              <label>
                Nombre completo *
                <input
                  name="nombre"
                  value={formulario.nombre}
                  onChange={actualizarCampo}
                  required
                  maxLength={120}
                />
              </label>

              <label>
                Teléfono *
                <input
                  name="telefono"
                  type="tel"
                  value={formulario.telefono}
                  onChange={actualizarCampo}
                  required
                />
              </label>

              <label>
                Correo electrónico *
                <input
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={actualizarCampo}
                  required
                />
              </label>

              <label>
                Ubicación
                <input
                  name="ubicacion"
                  value={formulario.ubicacion}
                  onChange={actualizarCampo}
                />
              </label>

              <label>
                Estado comercial
                <select
                  name="estado"
                  value={formulario.estado}
                  onChange={actualizarCampo}
                >
                  <option value="Prospecto">Prospecto</option>
                  <option value="Activo">Cliente activo</option>
                  <option value="Inactivo">Cliente inactivo</option>
                </select>
              </label>

              <label>
                Origen del contacto
                <select
                  name="origen"
                  value={formulario.origen}
                  onChange={actualizarCampo}
                >
                  <option value="Otro">Otro</option>
                  <option value="Redes sociales">Redes sociales</option>
                  <option value="Recomendación">Recomendación</option>
                  <option value="Sitio web">Sitio web</option>
                  <option value="Visita a agencia">Visita a agencia</option>
                  <option value="Llamada">Llamada</option>
                </select>
              </label>

              <label>
                Medio de contacto preferido
                <select
                  name="contactoPreferido"
                  value={formulario.contactoPreferido}
                  onChange={actualizarCampo}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Teléfono">Teléfono</option>
                  <option value="Correo electrónico">Correo electrónico</option>
                </select>
              </label>

              <label>
                Destino de interés
                <input
                  name="destinoInteres"
                  placeholder="Ej. Cancún"
                  value={formulario.destinoInteres}
                  onChange={actualizarCampo}
                />
              </label>

              <label>
                Presupuesto aproximado (MXN)
                <input
                  name="presupuesto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.presupuesto}
                  onChange={actualizarCampo}
                />
              </label>
            </div>

            {error && (
              <p className="formulario-error" role="alert">
                {error}
              </p>
            )}

            <div className="formulario-acciones">
              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={guardando}
              >
                {editandoId !== null ? "Guardar cambios" : "Registrar contacto"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
      <ConfirmDialog
        abierto={clienteAEliminar !== null}
        titulo="¿Eliminar contacto?"
        mensaje={
          clienteAEliminar
            ? `¿Estás seguro de eliminar a "${clienteAEliminar.nombre}"? Esta acción no se puede deshacer.`
            : ""
        }
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setClienteAEliminar(null)}
      />
    </div>
  );
}

export default function Clientes() {
  const { id } = useParams();
  return <GestionClientes key={id ?? "lista"} id={id} />;
}
