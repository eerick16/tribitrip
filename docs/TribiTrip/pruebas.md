# Pruebas y aseguramiento de calidad

[Portada](../TribiTrip.md) · [Trazabilidad de suites](analisis/trazabilidad.md) · [Integración continua](integracion-continua.md)

La ejecución cubrió pruebas automatizadas, análisis estático, compilación, auditoría y rendimiento en Testing. La aceptación manual queda pendiente. [Evidencias](evidencias.md#evidencias-de-qa)

## Ejecución local

| Campo | Valor |
|---|---|
| Fecha | 26/11/2026, Ciudad de México |
| Responsable | Rodriguez Ramirez Eduardo Iosef |
| Rama de origen del código | `dev` |
| SHA probado informado | `373dab1dfc1839f8d28e0ceb8e260bd235dc14ba` |
| Ambiente | Windows 11, Node.js v24.11.1 y npm 11.6.2 |

El Word aporta evidencia textual de `npm ci` (147 paquetes en 18 s) y `npm --prefix server ci` (88 paquetes en 4 s).

## Resultados

| Categoría | Resultado |
|---|---|
| [Unitarias](pruebas/unitarias.md) | 12 aprobadas |
| [Integración](pruebas/integracion.md) | 9 aprobadas |
| [Regresión](pruebas/regresion.md) | Comparación entre versiones pendiente |
| [Análisis estático y compilación](pruebas/analisis-estatico.md) | Lint sin diagnósticos visibles y compilación en 713 ms |
| [Vulnerabilidades](pruebas/vulnerabilidades.md) | 3 moderadas en desarrollo y 0 en auditorías de producción |
| [Rendimiento](pruebas/rendimiento.md) | 3 escenarios aprobados para health |

La ejecución combinada registró 21 aprobadas, 0 fallidas, 0 omitidas, 0 canceladas, 0 pendientes y una duración de 2405.6003 ms.
