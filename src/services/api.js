export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    )
      window.dispatchEvent(new Event("sesion-expirada"));
    const data = await response.json().catch(() => ({}));
    throw new Error(data.mensaje || "No fue posible conectar con el servidor.");
  }
  return response.status === 204 ? null : response.json();
}
