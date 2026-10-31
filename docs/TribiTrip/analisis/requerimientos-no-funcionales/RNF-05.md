# RNF-05. Disponibilidad y respaldos

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

Se establecerán mecanismos de respaldo periódico y recuperación de la información según los ambientes disponibles.

## Evaluación frente a la implementación

**Estado:** Parcialmente implementado.

Health y monitor HTTP operativos según la configuración informada. Respaldo periódico y restauración no acreditados.

**Módulos y evidencia de código:** app.js y monitoreo de Testing.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** deployment.test.js (servicio y logs). Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** Sin historia vinculada.

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
