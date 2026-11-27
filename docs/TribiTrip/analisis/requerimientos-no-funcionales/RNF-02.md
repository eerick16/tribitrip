# RNF-02. Privacidad

[Índice](../requerimientos-no-funcionales.md) · [Matriz](../trazabilidad.md)

## Especificación

El sistema deberá recopilar únicamente los datos personales necesarios y restringir su consulta a usuarios autorizados.

## Evaluación frente a la implementación

**Estado:** Parcialmente implementado.

Visibilidad por rol/propiedad, campos acotados y respuesta pública de usuario sin hash. Falta evidencia de revisión de minimización y tratamiento de datos.

**Módulos y evidencia de código:** app.js, commercial-routes.js, travel-models.js.

**Dependencias:** Sin dependencia directa especificada..

**Pruebas en el repositorio:** app.test.js, commercial.test.js, travel.test.js. Referencias de cobertura, con [aceptación pendiente](../../pruebas.md).

**Historias vinculadas:** [HU-001](../historias/HU-001.md), [HU-002](../historias/HU-002.md), [HU-004](../historias/HU-004.md).

El estado refleja controles observados y evidencia disponible. Los objetivos cuantitativos se consultan en [niveles de servicio](../../monitoreo/niveles-de-servicio.md).
