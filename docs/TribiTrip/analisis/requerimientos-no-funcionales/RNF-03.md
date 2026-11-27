# RNF-03. Rendimiento

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

Las consultas habituales de clientes, oportunidades y reservas deberán responder de manera fluida para el volumen de información previsto.

## Evaluación frente a la implementación

**Estado:** Parcialmente implementado.

Paginación e índices selectivos. El volumen previsto y las mediciones p95 están pendientes.

**Módulos y evidencia de código:** list-queries.js y modelos de servidor.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** commercial.test.js (comportamiento, sin benchmark). Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** [HU-004](../historias/HU-004.md), [HU-018](../historias/HU-018.md), [HU-019](../historias/HU-019.md).

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
