# Modelo documental de MongoDB

[Arquitectura](../arquitectura.md)

Las cajas principales identifican modelos Mongoose. Las flechas hacia modelos indican referencias mediante ObjectId. Las flechas hacia estructuras embebidas indican composición. Los identificadores de solicitud en oportunidad y reserva apuntan a un subdocumento de Cliente.
 
::: mermaid
graph LR
  S["Sesion"] --> U["Usuario"]
  C["Cliente"] -->|asesor| U
  C -->|embebe| T["Solicitud"]
  T -->|embebe| V["Viajero"]
  O["Oportunidad"] --> C
  O --> U
  O -.->|id embebido| T
  Q["Cotizacion"] --> O
  Q --> C
  Q --> U
  Q -->|embebe| H["Versiones e instantáneas"]
  Q -->|embebe| I["Conceptos"]
  H -->|embebe| I
  I -->|referencia opcional| K["ServicioTuristico"]
  B["Reserva"] --> Q
  B --> O
  B --> C
  B -.->|id embebido| T
  B --> U
  B -->|copia conceptos| I
  B -->|embebe| P["Pago o devolución"]
  P -->|registradoPor| U
:::

| Modelo / esquema fuente | Campos y restricciones principales |
|---|---|
| Usuario / `models.js` | Nombre, correo único, hash, rol, activo y marcas de tiempo. |
| Sesion / `models.js` | Hash del token único, usuario y expiración con índice TTL. |
| Cliente / `models.js` | Datos de contacto, origen, preferencias, estado, asesor, revisión y solicitudes embebidas. Correo y teléfono únicos. |
| Solicitud y Viajero / `travel-models.js` | Solicitud con destino, fechas, presupuesto, cupo, necesidades, estado y revisión. Viajero con nombre, parentesco, tipo y nacimiento opcional. |
| Oportunidad / `opportunity-model.js` | Título, cliente, asesor, id de solicitud, etapa, cierre y revisión. Índices por asesor/etapa y cliente/solicitud. |
| ServicioTuristico / `quote-models.js` | Nombre, descripción, tipo Servicio o Paquete, categoría, destino, proveedor de texto y precio de referencia. |
| Cotizacion / `quote-models.js` | Folio único, cliente, asesor, oportunidad, estado, importes, vigencia, condiciones, conceptos, referencias de catálogo, versión e historial embebido. Índice parcial único de aceptada por oportunidad. |
| Reserva / `reservation-model.js` | Folio y cotización únicos, id de solicitud, cliente, oportunidad, asesor, responsables e instantáneas de cliente y conceptos. Copia versión aceptada, fechas e importes. Estado, localizador, proveedor, revisión y movimientos embebidos. |

El vínculo cotización–reserva es de cero o una reserva por cotización según índice. Los importes comerciales de cotización, reserva y movimientos se conservan en centavos de MXN. Las referencias por ObjectId requieren reglas de aplicación para validar visibilidad y asociación. Los subdocumentos comparten el límite BSON del documento que los contiene. [RNF-04](../analisis/requerimientos-no-funcionales/RNF-04.md)
