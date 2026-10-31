# RNF-04. Integridad de datos

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

La persistencia utiliza MongoDB Atlas. Los esquemas de Mongoose, las referencias entre documentos, los índices y las validaciones de negocio protegen la integridad de los registros.

## Evaluación frente a la implementación

**Estado:** Parcialmente implementado.

Los esquemas, índices y validaciones están configurados. Queda pendiente verificar su aplicación con datos persistidos en Atlas, incluidos los escenarios de concurrencia y duplicados.

**Módulos y evidencia de código:** models.js y modelos comerciales.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** travel.test.js, quote.test.js, reservation.test.js. Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** [HU-003](../historias/HU-003.md), [HU-006](../historias/HU-006.md), [HU-011](../historias/HU-011.md), [HU-015](../historias/HU-015.md), [HU-016](../historias/HU-016.md).

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
