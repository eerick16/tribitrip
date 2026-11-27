# RNF-01. Seguridad

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

El sistema deberá utilizar contraseñas almacenadas mediante algoritmos de hash seguros, sesiones protegidas, validación de entradas y autorización basada en roles.

## Evaluación frente a la implementación

**Estado:** Implementado.

Hash con sal, cookie protegida, TTL, roles, propiedad, control de origen y validación de entradas. Falta aceptación con proxy e índices reales.

**Módulos y evidencia de código:** security.js, app.js, models.js.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** security.test.js, app.test.js. Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** [HU-001](../historias/HU-001.md), [HU-002](../historias/HU-002.md).

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
