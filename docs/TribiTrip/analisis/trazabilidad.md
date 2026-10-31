# Matriz de trazabilidad

[Análisis](../analisis.md) · [Historias](historias.md) · [Pruebas](../pruebas.md)

La relación RF/RNF–HU es una correspondencia documental construida a partir de alcance y módulos. **Implementado** describe evidencia en código, **Parcialmente implementado** identifica una brecha o una verificación técnica pendiente, **No implementado** indica ausencia en el alcance aplicable y **Fuera del alcance** identifica exclusiones aprobadas. Las suites listadas son referencias, con aceptación integral pendiente.

| Requerimiento | Historias | Módulo o evidencia | Estado | Pruebas relacionadas |
|---|---|---|---|---|
| [RF-01](requerimientos-funcionales/RF-01.md) | [HU-001](historias/HU-001.md), [HU-002](historias/HU-002.md) | app.js, security.js, Usuarios.jsx | Parcialmente implementado | app.test.js, security.test.js |
| [RF-02](requerimientos-funcionales/RF-02.md) | [HU-003](historias/HU-003.md), [HU-004](historias/HU-004.md) | app.js, models.js, commercial-routes.js, Clientes.jsx | Implementado | app.test.js, commercial.test.js |
| [RF-03](requerimientos-funcionales/RF-03.md) | [HU-005](historias/HU-005.md) | travel-routes.js, travel-models.js, Viajeros.jsx | Parcialmente implementado | travel.test.js |
| [RF-04](requerimientos-funcionales/RF-04.md) | [HU-006](historias/HU-006.md) | travel-routes.js, travel-models.js, SolicitudForm.jsx | Parcialmente implementado | travel.test.js |
| [RF-05](requerimientos-funcionales/RF-05.md) | [HU-007](historias/HU-007.md), [HU-008](historias/HU-008.md) | opportunity-routes.js, opportunity-model.js, Embudo.jsx | Implementado | opportunity.test.js |
| [RF-06](requerimientos-funcionales/RF-06.md) | [HU-010](historias/HU-010.md), [HU-011](historias/HU-011.md), [HU-012](historias/HU-012.md) | quote-routes.js, quote-models.js, quote-lifecycle.js, quote-document.js | Implementado | quote.test.js |
| [RF-07](requerimientos-funcionales/RF-07.md) | [HU-013](historias/HU-013.md), [HU-014](historias/HU-014.md) | Sin módulo de interacciones y tareas | Fuera del alcance | Sin suite específica |
| [RF-08](requerimientos-funcionales/RF-08.md) | [HU-015](historias/HU-015.md) | reservation-routes.js, reservation-model.js, NuevaReserva.jsx | Implementado | reservation.test.js |
| [RF-09](requerimientos-funcionales/RF-09.md) | [HU-016](historias/HU-016.md) | reservation-routes.js, reservation-model.js, PagosInformativos.jsx | Implementado | reservation.test.js |
| [RF-10](requerimientos-funcionales/RF-10.md) | [HU-017](historias/HU-017.md), [HU-018](historias/HU-018.md) | commercial-routes.js, Dashboard.jsx, Reportes.jsx | Parcialmente implementado | commercial.test.js |
| [RF-11](requerimientos-funcionales/RF-11.md) | [HU-019](historias/HU-019.md) | list-queries.js, ListFilters.jsx y rutas de listados | Parcialmente implementado | commercial.test.js, opportunity.test.js, quote.test.js, reservation.test.js |
| [RF-12](requerimientos-funcionales/RF-12.md) | [HU-004](historias/HU-004.md), [HU-007](historias/HU-007.md), [HU-011](historias/HU-011.md), [HU-015](historias/HU-015.md), [HU-016](historias/HU-016.md) | models.js, quote-models.js, reservation-model.js, commercial-routes.js, app.js | Parcialmente implementado | commercial.test.js, quote.test.js, reservation.test.js, deployment.test.js |
| [RF-13](requerimientos-funcionales/RF-13.md) | [HU-009](historias/HU-009.md) | quote-models.js, quote-routes.js, Catalogo.jsx | Parcialmente implementado | quote.test.js |
| [RNF-01](requerimientos-no-funcionales/RNF-01.md) | [HU-001](historias/HU-001.md), [HU-002](historias/HU-002.md) | security.js, app.js, models.js | Implementado | security.test.js, app.test.js |
| [RNF-02](requerimientos-no-funcionales/RNF-02.md) | [HU-001](historias/HU-001.md), [HU-002](historias/HU-002.md), [HU-004](historias/HU-004.md) | app.js, commercial-routes.js, travel-models.js | Parcialmente implementado | app.test.js, commercial.test.js, travel.test.js |
| [RNF-03](requerimientos-no-funcionales/RNF-03.md) | [HU-004](historias/HU-004.md), [HU-018](historias/HU-018.md), [HU-019](historias/HU-019.md) | list-queries.js y modelos de servidor | Parcialmente implementado | commercial.test.js (comportamiento, sin benchmark) |
| [RNF-04](requerimientos-no-funcionales/RNF-04.md) | [HU-003](historias/HU-003.md), [HU-006](historias/HU-006.md), [HU-011](historias/HU-011.md), [HU-015](historias/HU-015.md), [HU-016](historias/HU-016.md) | models.js y modelos comerciales | Parcialmente implementado | travel.test.js, quote.test.js, reservation.test.js |
| [RNF-05](requerimientos-no-funcionales/RNF-05.md) | — | app.js y monitoreo de Testing | Parcialmente implementado | deployment.test.js (servicio y logs) |
| [RNF-06](requerimientos-no-funcionales/RNF-06.md) | — | src/pages, src/components y estilos | Parcialmente implementado | Aceptación manual pendiente |
| [RNF-07](requerimientos-no-funcionales/RNF-07.md) | — | src/, server/, shared/, eslint.config.js | Implementado | Suites del servidor y lint oficial |
| [RNF-08](requerimientos-no-funcionales/RNF-08.md) | — | vite.config.js y src/ | Parcialmente implementado | Aceptación manual pendiente |
| [RNF-09](requerimientos-no-funcionales/RNF-09.md) | — | app.js | Implementado | deployment.test.js, app.test.js |
| [RNF-10](requerimientos-no-funcionales/RNF-10.md) | — | server/, src/ y shared/ | Parcialmente implementado | Sin prueba específica de interoperabilidad |
