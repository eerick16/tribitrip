
import Sidebar from "../components/Sidebar";

function MainLayout({
  children,
  paginaActual,
  cambiarPagina,
  titulo,
}) {
  return (
    <div className="app-layout">
      <Sidebar
        paginaActual={paginaActual}
        cambiarPagina={cambiarPagina}
      />

      <div className="main-container">
        <header className="main-header">
          <div>
            <span className="header-subtitulo">
              TribiTrip / CRM
            </span>
            <h1>{titulo}</h1>
          </div>

          <div className="usuario">
            <span className="usuario-avatar">D</span>
            <div>
              <strong>Usuario de prueba</strong>
              <small>Sin autenticación</small>
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
