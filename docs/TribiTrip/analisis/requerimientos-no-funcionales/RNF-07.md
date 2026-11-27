# RNF-07. Mantenibilidad

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

La arquitectura deberá separar la interfaz, la lógica de negocio y el acceso a datos para facilitar correcciones y futuras ampliaciones.

## Evaluación frente a la implementación

**Estado:** Implementado.

Separación de interfaz, API, modelos y reglas compartidas; estructura modular por dominio.

**Módulos y evidencia de código:** src/, server/, shared/, eslint.config.js.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** Suites del servidor y lint oficial. Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** Sin historia vinculada.

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
