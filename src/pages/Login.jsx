import { useState } from "react";
import { Navigate } from "react-router";
import { useSession } from "../auth/session";
export default function Login() {
  const { usuario, login, error: sessionError } = useSession();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (usuario) return <Navigate to="/dashboard" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await login(data.get("correo"), data.get("password"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="panel login-panel">
        <h1>TribiTrip CRM</h1>
        <p>Inicia sesión con tu cuenta de la agencia.</p>
        <form onSubmit={submit} className="account-form">
          <label>
            Correo electrónico
            <input
              name="correo"
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          {(error || sessionError) && (
            <p role="alert">{error || sessionError}</p>
          )}
          <button className="btn-primary" disabled={busy}>
            {busy ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
