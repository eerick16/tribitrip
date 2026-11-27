import { useEffect, useId, useRef } from "react";

export default function FormDialog({ title, onClose, busy = false, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog.showModal();

    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="form-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="cerrar-modal"
          aria-label="Cerrar formulario"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="form-dialog-body">{children}</div>
    </dialog>
  );
}
