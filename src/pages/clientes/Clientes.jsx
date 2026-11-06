import { useEffect, useMemo, useState } from "react";
import "./Clientes.css";
import ConfirmDialog from "../../components/ConfirmDialog";

const STORAGE_KEY = "tribitrip_clientes_demo";

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

const leerClientes = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

function Clientes() {
  const [clientes, setClientes] = useState(leerClientes);
  const [busqueda, setBusqueda] = useState("");
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [filtro, setFiltro] = useState("Todos");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const coincideBusqueda = [
        cliente.nombre,
        cliente.correo,
        cliente.telefono,
      ].some((valor) =>
        String(valor || "")
          .toLowerCase()
          .includes(termino),
      );

      const coincideEstado = filtro === "Todos" || cliente.estado === filtro;

      return coincideBusqueda && coincideEstado;
    });
  }, [clientes, busqueda, filtro]);

  const resumen = {
    total: clientes.length,
    prospectos: clientes.filter((c) => c.estado === "Prospecto").length,
    activos: clientes.filter((c) => c.estado === "Activo").length,
    inactivos: clientes.filter((c) => c.estado === "Inactivo").length,
  };

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

  function guardarCliente(evento) {
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
    if (telefonoNormalizado.length < 10) {
      setError("Introduce un teléfono de al menos 10 dígitos.");
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
      presupuesto: formulario.presupuesto ? Number(formulario.presupuesto) : "",
    };

    if (editandoId !== null) {
      setClientes((anteriores) =>
        anteriores.map((cliente) =>
          cliente.id === editandoId ? { ...cliente, ...datos } : cliente,
        ),
      );
    } else {
      setClientes((anteriores) => [
        ...anteriores,
        {
          ...datos,
          id: crypto.randomUUID(),
          fechaRegistro: new Date().toISOString(),
        },
      ]);
    }

    cerrarFormulario();
  }

  function eliminarCliente(cliente) {
    setClienteAEliminar(cliente);
  }

  function confirmarEliminacion() {
    if (!clienteAEliminar) return;

    setClientes((anteriores) =>
      anteriores.filter((cliente) => cliente.id !== clienteAEliminar.id),
    );

    setClienteAEliminar(null);
  }

  return (
    <div className="clientes-page">
      <div className="clientes-encabezado">
        <div>
          <h2>Clientes y prospectos</h2>
          <p>
            Administra los contactos y oportunidades comerciales de la agencia.
          </p>
        </div>

        <button className="btn-primary" onClick={nuevoCliente}>
          + Nuevo contacto
        </button>
      </div>

      <div className="clientes-resumen">
        <div className="resumen-card">
          <span>Total de contactos</span>
          <strong>{resumen.total}</strong>
        </div>
        <div className="resumen-card">
          <span>Prospectos</span>
          <strong>{resumen.prospectos}</strong>
        </div>
        <div className="resumen-card">
          <span>Clientes activos</span>
          <strong>{resumen.activos}</strong>
        </div>
        <div className="resumen-card">
          <span>Clientes inactivos</span>
          <strong>{resumen.inactivos}</strong>
        </div>
      </div>

      <section className="clientes-panel">
        <div className="clientes-filtros">
          <input
            type="search"
            placeholder="Buscar nombre, correo o teléfono..."
            aria-label="Buscar contactos"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            aria-label="Filtrar por estado"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Prospecto">Prospectos</option>
            <option value="Activo">Clientes activos</option>
            <option value="Inactivo">Clientes inactivos</option>
          </select>
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
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <strong>{cliente.nombre}</strong>
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

          {clientesFiltrados.length === 0 && (
            <div className="clientes-vacio">
              <p>No se encontraron contactos.</p>
              <span>Registra uno nuevo o modifica los filtros.</span>
            </div>
          )}
        </div>

        <div className="clientes-pie">
          Mostrando {clientesFiltrados.length} de {clientes.length} contactos
        </div>
      </section>

      {mostrarFormulario && (
        <div className="modal-overlay">
          <section
            className="modal-cliente"
            role="dialog"
            aria-modal="true"
            aria-labelledby="formulario-cliente-titulo"
          >
            <div className="modal-header">
              <h2 id="formulario-cliente-titulo">
                {editandoId !== null ? "Editar contacto" : "Nuevo contacto"}
              </h2>
              <button
                className="cerrar-modal"
                onClick={cerrarFormulario}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

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
                    <option value="Correo electrónico">
                      Correo electrónico
                    </option>
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
                <button type="submit" className="btn-primary">
                  {editandoId !== null
                    ? "Guardar cambios"
                    : "Registrar contacto"}
                </button>
              </div>
            </form>
          </section>
        </div>
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

export default Clientes;
