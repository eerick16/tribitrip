# Diseño y arquitectura

[Portada](../TribiTrip.md) · [Modelo de datos](arquitectura/modelo-de-datos.md) · [API y seguridad](arquitectura/api-y-seguridad.md) · [Flujos y navegación](arquitectura/flujos.md)

## Arquitectura general
 
::: mermaid
graph LR
  U["Navegador"] -->|"HTTPS, SPA y API REST"| R["Render: Node.js y Express"]
  R -->|"Mongoose"| D["MongoDB Atlas"]
:::

En desarrollo Vite reenvía `/api` a Express mediante proxy. En Render Express expone la API y sirve `dist/` desde el mismo origen. Las peticiones HTML de navegación reciben la SPA. Los archivos ausentes y las rutas API conservan su tratamiento independiente.

## Componentes y dependencias

::: mermaid
graph TD
  P["React 19 y React Router 8"] --> A["SessionProvider y servicios HTTP"]
  A --> R["Express 5 y middleware"]
  R --> C["Rutas de contactos, viajes y oportunidades"]
  R --> Q["Catálogo, cotizaciones y reservas"]
  R --> I["Agregaciones e indicadores"]
  C --> M["Modelos Mongoose 9"]
  Q --> M
  I --> M
  Q --> S["Reglas de importes en shared"]
  P --> S
:::

| Ubicación | Responsabilidad |
|---|---|
| `src/routes`, `src/layouts`, `src/pages` | Rutas, guardas, navegación y pantallas. |
| `src/auth`, `src/services`, `src/components` | Sesión, acceso HTTP, filtros y formularios. |
| `server/index.js`, `server/app.js` | Arranque, rutas base, middleware, contenido estático y errores. |
| `server/*-routes.js`, `server/*-model*.js` | Operaciones por dominio y esquemas MongoDB. |
| `shared/` | Reglas reutilizadas de etapas e importes. |

El proyecto usa módulos ES, componentes funcionales, React Hooks, Lucide y CSS. ESLint verifica convenciones de JavaScript y React. Express aplica Helmet y cookie-parser. Mongoose valida esquemas y Node.js aporta primitivas criptográficas y Test Runner. [Desarrollo](desarrollo.md)
