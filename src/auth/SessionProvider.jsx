import { useEffect, useState } from "react";
import { api } from "../services/api";
import { SessionContext } from "./session";
export default function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((u) => {
        if (active) setUsuario(u);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCargando(false);
      });
    const expired = () => {
      setUsuario(null);
      setError("La sesión terminó. Inicia sesión nuevamente.");
    };
    window.addEventListener("sesion-expirada", expired);
    return () => {
      active = false;
      window.removeEventListener("sesion-expirada", expired);
    };
  }, []);
  async function login(correo, password) {
    const u = await api("/auth/login", {
      method: "POST",
      body: { correo, password },
    });
    setUsuario(u);
    setError("");
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUsuario(null);
  }
  return (
    <SessionContext.Provider
      value={{ usuario, cargando, login, logout, error }}
    >
      {children}
    </SessionContext.Provider>
  );
}
