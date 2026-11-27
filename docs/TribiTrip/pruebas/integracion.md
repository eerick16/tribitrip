# Pruebas de integración

[Portada](../../TribiTrip.md) · [Pruebas](../pruebas.md) · [Evidencias](../evidencias.md)

## Objetivo y alcance

Interacciones HTTP locales con Express, permisos, operaciones comerciales, servicio de la SPA y logs.

## Procedimiento

[Ejecución local y SHA probado](../pruebas.md#ejecución-local). Node.js Test Runner ejecutó `node --test` mediante el script del servidor.

```cmd
npm --prefix server test
```

## Resultados

**9 casos aprobados** en esta categoría. La ejecución combinada registró 21 aprobadas, 0 fallidas, 0 omitidas, 0 canceladas, 0 pendientes y una duración de 2405.6003 ms.

| Archivo | Comportamiento verificado | Resultado observado | Duración (ms) |
|---|---|---|---:|
| `app.test.js` | API rechaza acceso sin sesión y solicitudes de otro origen | Aprobado | 161.586 |
| `commercial.test.js` | API aísla la ficha, protege ediciones y combina filtros con paginación | Aprobado | 361.2818 |
| `commercial.test.js` | dashboard y reportes usan agregaciones protegidas y la misma definición de ventas | Aprobado | 123.3085 |
| `deployment.test.js` | Express sirve la SPA compilada cuando existe y conserva los 404 de archivos y API | Aprobado | 276.054 |
| `deployment.test.js` | los logs HTTP correlacionan errores y excluyen datos de la solicitud | Aprobado | 76.4295 |
| `opportunity.test.js` | API de oportunidades valida alcance, vínculos, revisiones y embudo | Aprobado | 522.4331 |
| `quote.test.js` | API consulta el catálogo y protege la creación, consulta y edición de cotizaciones | Aprobado | 604.0549 |
| `reservation.test.js` | API protege reservas y pagos y conserva el saldo ante reintentos y concurrencia | Aprobado | 621.9144 |
| `travel.test.js` | API de viajes usa el alcance de sesión y protege asociaciones y borrado | Aprobado | 451.4389 |

## Evidencia

[Resumen compartido de la ejecución](unitarias.md#evidencia)

## Limitaciones y conclusión

Los casos de esta categoría aprobaron en la ejecución documentada. Los casos que requieren persistencia usan dobles de prueba. Falta validar persistencia real y aceptación manual. [Trazabilidad](../analisis/trazabilidad.md)
