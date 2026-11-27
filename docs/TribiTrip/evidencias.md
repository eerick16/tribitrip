# Evidencias y validaciones

[Portada](../TribiTrip.md)

## Evidencias pendientes
 
Para cada evidencia, registrar el ambiente, fecha, SHA o versión cuando corresponda, referencia a la ejecución o captura y resultado observado.

| Ámbito | Evidencia o confirmación pendiente |
|---|---|
| CI | URL o ID de ejecución oficial, SHA, resultado por paso y artefacto del mismo SHA. Adjuntar el registro de la ejecución con 21 pruebas aprobadas, análisis estático y compilación satisfactorios. |
| Testing | Render Events, configuración de ambiente redactada, base efectiva `test`, resultado health y acceso funcional con SHA. |
| Staging | URL y base efectiva `tribitrip`, ejecución efectiva del CD, liberación, Render Events, health, acceso y monitor. |
| UptimeRobot | Configuración, ventana y muestra de disponibilidad, incidentes y tiempo de inactividad. |
| Render | Capturas de Metrics y Logs redactadas. Adjuntar respuesta con Request ID y línea de log correlacionada. |
| QA | Ejecuciones automatizadas, estático, regresión, auditoría, script y resultados de rendimiento, aceptación manual y PDF. Integración a cargo del responsable. |
| Seguridad y operación | Confirmar índice y TTL en base de pruebas, política real de respaldos y restauración, protecciones de ramas, matriz de navegadores y tratamiento de datos históricos de contactos, si corresponde. |
| Publicación de la Wiki | Confirmar rama y repositorio de publicación, incorporación de `docs/`, vínculo a Wiki y evidencia de publicación. |
| Manual | Capturas reales de cada procedimiento con datos de demostración. |

## Validación de la Wiki de código

En el repositorio se comprueban los destinos relativos, las páginas padre, las carpetas homónimas y las entradas de `.order`, junto con la sintaxis de los bloques Mermaid. Los recursos y capturas futuras se incorporarán a `.attachments/` dentro de la raíz de publicación, con enlaces relativos y sin datos sensibles. Tras publicar `docs/`, comprobar portada, orden y jerarquía, destinos de enlaces entre niveles, renderizado Mermaid, capturas y página reservada para QA. [Publicación de Wiki de código](https://learn.microsoft.com/en-us/azure/devops/project/wiki/publish-repo-to-wiki?view=azure-devops) · [Sintaxis Markdown y Mermaid](https://learn.microsoft.com/en-us/azure/devops/project/wiki/markdown-guidance?view=azure-devops)
