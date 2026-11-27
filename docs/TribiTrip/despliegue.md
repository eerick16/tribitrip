# Liberación y despliegue continuo

[Portada](../TribiTrip.md) · [Procedimiento de liberación](despliegue/liberacion.md) · [CI](integracion-continua.md)

GitHub Actions solicita despliegues a Render después de una verificación exitosa. Render construye el SHA solicitado a partir del repositorio y ejecuta Express, que sirve la API y la SPA. El artefacto de Actions queda disponible para inspección.
 
| Ambiente | Rama y servicio | Base prevista | Estado informado |
|---|---|---|---|
| Testing | `dev`, `tribitrip-testing` | `test` | Desplegado y funcional. CD configurado y validado mediante Actions, Render Events, health y acceso al CRM. [Testing](https://tribitrip-testing.onrender.com) |
| Staging | `main`, `tribitrip-staging` | `tribitrip` | Servicio y CD configurados. Primera liberación, ejecución de CD y validación definitiva pendientes. |

Verificar el nombre de la base y el aislamiento en cada ambiente antes de operaciones que escriban datos. La comprobación es especialmente importante porque el arranque inicializa índices y puede confirmar reservas elegibles.

## Configuración de Render

Runtime Node.js 24, plan gratuito, región Virginia (Estados Unidos), raíz del repositorio como Root Directory, Auto-Deploy desactivado y Health Check Path `/api/health`. Build Command y Start Command:

```sh
npm ci --include=dev && npm --prefix server ci --omit=dev && npm run build
node server/index.js
```

| Variable | Configuración |
|---|---|
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |
| `SKIP_INSTALL_DEPS` | `true` |
| `MONGODB_URI` | Conexión confidencial a la base del ambiente. |
| `APP_ORIGIN` | Origen HTTPS del servicio, sin ruta. |
| `PORT` | Asignado por Render. |

## Arquitectura de despliegue

::: mermaid
graph TD
  G["GitHub: dev y main"] --> A["GitHub Actions: verificación"]
  A --> T["Render Testing"]
  A --> S["Render Staging"]
  T --> D["Atlas: test prevista"]
  S --> P["Atlas: tribitrip prevista"]
  U["Navegador"] -->|HTTPS| T
  U -.->|Tras liberar| S
:::

## Automatización

::: mermaid
graph TD
  V["Job verify satisfactorio"] --> P["Evaluar evento y rama"]
  P -->|"push dev"| T["POST Hook Testing con SHA"]
  P -->|"push main"| S["POST Hook Staging con SHA"]
  P -->|"PR o manual"| I["Validación"]
  T --> R["Render construye el SHA"]
  S --> R
  R --> E["Render Events y validación funcional"]
:::

Los jobs dependen de `verify` y envían HTTP POST con `curl` y el SHA. Los secretos se identifican como `RENDER_DEPLOY_HOOK_TESTING` y `RENDER_DEPLOY_HOOK_STAGING`. La finalización correcta del job acredita que Render aceptó la solicitud. Render Events muestra el resultado efectivo del despliegue.
