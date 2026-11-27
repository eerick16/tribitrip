# SLA, SLO, SLI y presupuesto de errores

[Monitoreo](../monitoreo.md)

El SLA académico aprobado fija una disponibilidad mensual objetivo de 99% considerando infraestructura gratuita. La garantía contractual del proveedor queda fuera del acuerdo académico.

| Indicador | Cálculo y unidad | Fuente | SLO e interpretación |
|---|---|---|---|
| Disponibilidad observada | 100 × (minutos observados − minutos indisponibles) ÷ minutos observados, en %. Reportar ventana y resolución del monitor. | UptimeRobot | ≥ 99% mensual. Una ventana parcial solo describe ese periodo. |
| Latencia p95 | Ordenar latencias cliente en ms y tomar la observación en posición techo(0.95 × N), con posiciones desde 1. | Script de rendimiento | ≤ 1,000 ms con servicio activo. Registrar muestra, ruta y condiciones; identificar por separado el arranque en frío. |
| Errores HTTP | 100 × respuestas 5xx ÷ respuestas HTTP observadas, en %. | Script y Render Logs | < 1%. Registrar fallos sin respuesta HTTP por separado para conservar el denominador. |
| Confiabilidad | 100 × solicitudes válidas completadas correctamente ÷ solicitudes válidas de la muestra, en %. | Prueba de rendimiento y logs | ≥ 99%. Definir éxito por resultado esperado para cada caso, incluyendo el estado y contenido pertinentes. |

Las fórmulas representan métricas con denominador positivo. Documentar la población, la ventana y el entorno al informar resultados.

Para 30 días, 30 × 24 × 60 = 43,200 minutos. El presupuesto de errores de disponibilidad es 100% − 99% = 1%. La indisponibilidad permitida es 43,200 × 0.01 = 432 minutos, equivalentes a 7 horas y 12 minutos. El consumo es minutos indisponibles ÷ 432 × 100. Si se agota, el equipo priorizará estabilidad y corrección de incidencias antes de nuevas funcionalidades. El seguimiento académico parcial no permite concluir cumplimiento mensual. [Evidencias](../evidencias.md)
