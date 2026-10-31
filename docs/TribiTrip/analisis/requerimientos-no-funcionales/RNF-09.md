# RNF-09. Registro de errores

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

La aplicación deberá registrar errores técnicos sin mostrar información sensible al usuario final.

## Evaluación frente a la implementación

**Estado:** Implementado.

Errores 5xx con mensaje genérico y logs JSON con Request ID y ruta; no se agregan cuerpos, cookies ni parámetros de consulta al log.

**Módulos y evidencia de código:** app.js.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** deployment.test.js, app.test.js. Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** Sin historia vinculada.

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
