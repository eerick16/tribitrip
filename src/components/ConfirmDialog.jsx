
import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (abierto && !dialog.open) {
      dialog.showModal();
    } else if (!abierto && dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      onClose={onCancelar}
      onCancel={onCancelar}
    >
      <div className="confirm-header">
        <div className="confirm-icon">
          <AlertTriangle size={27} />
        </div>
        <button
          type="button"
          className="confirm-close"
          onClick={onCancelar}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <h2>{titulo}</h2>
      <p>{mensaje}</p>

      <div className="confirm-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancelar}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="btn-danger"
          onClick={onConfirmar}
        >
          Eliminar contacto
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
