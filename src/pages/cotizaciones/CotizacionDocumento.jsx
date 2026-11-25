import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useApiData } from "../../services/useApiData";
import "./documento.css";

function VistaDocumento({ id, version }) {
  const path =
    "/cotizaciones/" +
    encodeURIComponent(id) +
    "/versiones/" +
    encodeURIComponent(version);
  const { data, error } = useApiData(path);
  const frame = useRef(null);
  const [ready, setReady] = useState(false);
  const [printError, setPrintError] = useState("");

  function imprimir() {
    try {
      frame.current.contentWindow.print();
    } catch {
      setPrintError(
        "No fue posible abrir el diálogo. Abre el documento en otra pestaña para imprimirlo.",
      );
    }
  }

  return (
    <section className="panel">
      <div className="formulario-acciones">
        <Link className="btn-secondary" to={"/cotizaciones/" + id}>
          Volver a la cotización
        </Link>
        {data && (
          <>
            <a
              className="btn-secondary"
              href={"/api" + path + "/documento"}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en otra pestaña
            </a>
            <button
              type="button"
              className="btn-primary"
              disabled={!ready}
              onClick={imprimir}
            >
              Imprimir o guardar como PDF
            </button>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {printError && <p role="alert">{printError}</p>}
      {!error && !ready && <p role="status">Cargando documento…</p>}
      {data && (
        <iframe
          ref={frame}
          className="cotizacion-documento"
          title={"Documento de " + data.folio + ", versión " + data.version}
          src={"/api" + path + "/documento"}
          onLoad={() => setReady(true)}
        />
      )}
    </section>
  );
}

export default function CotizacionDocumento() {
  const { id, version } = useParams();
  return <VistaDocumento key={id + ":" + version} id={id} version={version} />;
}
