# Casos de uso, navegación y secuencias

[Arquitectura](../arquitectura.md) · [Manual de usuario](../manuales/usuario.md)

## Casos de uso

::: mermaid
graph LR
  A["Administrador"] --> L["Acceder y cerrar sesión"]
  B["Asesor"] --> L
  A --> M["Gestionar cuentas, embudo y reportes"]
  A --> C["Gestionar registros comerciales visibles"]
  B --> C
  C --> D["Contactos, solicitudes y viajeros"]
  C --> E["Oportunidades y cotizaciones"]
  C --> F["Reservas y movimientos informativos"]
:::
 
## Navegación

::: mermaid
graph TD
  L["Login"] --> D["Dashboard"]
  D --> C["Clientes y prospectos"]
  D --> S["Solicitudes de viaje"]
  D --> O["Oportunidades"]
  D --> Q["Cotizaciones"]
  D --> R["Reservas"]
  D --> A["Usuarios, Embudo y Reportes: administrador"]
  C --> F["Ficha del cliente"]
  S --> V["Detalle de solicitud y viajeros"]
  O --> E["Detalle de oportunidad"]
  Q --> K["Catálogo"]
  Q --> H["Detalle, versiones y documento"]
  R --> P["Detalle y pagos"]
:::

## Autenticación

::: mermaid
sequenceDiagram
  participant N as Navegador
  participant A as Express
  participant D as MongoDB
  N->>A: POST login con correo y contraseña
  A->>D: Consultar cuenta
  A->>A: Validar cuenta activa y contraseña
  A->>D: Guardar hash de token y expiración
  A-->>N: Usuario público y cookie protegida
  N->>A: GET auth/me con cookie
  A->>D: Buscar sesión vigente y usuario activo
  A-->>N: Usuario público o 401
  N->>A: POST logout
  A->>D: Borrar sesión
  A-->>N: HTTP 204 y retirar cookie
:::

## Flujo comercial

::: mermaid
sequenceDiagram
  participant U as Usuario CRM
  participant A as API
  participant D as MongoDB
  U->>A: Registrar contacto y solicitud
  A->>D: Guardar solicitud en contacto
  U->>A: Crear oportunidad para solicitud
  A->>D: Guardar vínculo y asesor
  U->>A: Registrar cotización, enviar y aceptar
  A->>D: Guardar versión aceptada
  U->>A: Marcar oportunidad como ganada
  U->>A: Crear reserva desde cotización aceptada
  A->>D: Validar origen y persistir instantánea
  U->>A: Registrar pago informativo
  A->>D: Guardar movimiento y actualizar saldo y estado
:::
