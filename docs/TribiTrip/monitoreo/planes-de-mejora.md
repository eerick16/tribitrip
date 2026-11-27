# Planes preliminares de mejora

[Monitoreo](../monitoreo.md) · [Niveles de servicio](niveles-de-servicio.md)

Los planes definitivos dependen de los resultados de pruebas y monitoreo.

| Plan | Indicador y disparador | Causas posibles | Acción propuesta | Verificación |
|---|---|---|---|---|
| Disponibilidad | Alerta HTTP o disponibilidad mensual inferior a 99% | Servicio caído, conexión Atlas interrumpida | Correlacionar health, Events y logs; restablecer conexión o versión estable | Recuperación HTTP 200 y seguimiento en el monitor |
| Rendimiento | p95 > 1 s con servicio activo | Consultas costosas, volumen o paginación | Medir por ruta y revisar consultas e índices con datos de prueba | Comparar p95 con misma carga y muestra |
| Confiabilidad | Éxito válido < 99% | Conflictos de edición, reintentos, dependencias | Clasificar fallos por operación y revisar consistencia | Repetir escenarios de concurrencia y comprobar datos |
| Errores HTTP | 5xx ≥ 1% | Error de aplicación o persistencia | Agrupar por ruta y Request ID; corregir causa | Repetir medición y revisar logs |
| CI | `verify` falla o falta artefacto | Lockfile, runtime, lint, build o suite | Identificar primer paso fallido y corregir mediante PR | Ejecución satisfactoria para el SHA corregido |
| Despliegue | Hook fallido, Render Events con error o health 503 | Configuración, conexión o build | Revisar evento y ambiente; recuperar revisión estable si procede | SHA confirmado y validación posterior |
| Vulnerabilidades | Hallazgo confirmado de npm audit o revisión | Dependencia afectada o configuración insegura | Revisar impacto y preparar actualización compatible por PR | Repetir auditoría, suite y build |
| Infraestructura | Métrica requerida ausente o límites del plan afectan objetivos | Restricciones del plan o capacidad | Correlacionar indicadores disponibles; evaluar capacidad y costo | Repetir medición representativa y registrar visibilidad |
| Arranque en frío | Primera respuesta tras inactividad incumple el umbral operativo acordado | Suspensión o inicialización del servicio | Medir primeras solicitudes por separado y revisar inicialización o plan | Comparar arranques y régimen activo con metodología repetible |
