# Procedimiento de liberación y recuperación

[Despliegue continuo](../despliegue.md) · [Monitoreo](../monitoreo.md)

1. Revisar la ejecución de `dev`, el SHA, sus pruebas y la validación de Testing. Registrar el alcance de la entrega y los pendientes.
2. Abrir el PR de `dev` hacia `main` y revisar sus comprobaciones. La integración en `main` produce el push que habilita el despliegue tras `verify`.
3. Abrir GitHub Actions y ubicar el job del SHA liberado. En Render Events, cotejar el SHA y esperar el resultado final de build y arranque.
4. Consultar `GET /api/health` y verificar HTTP 200 y `conectado: true`. Revisar logs y correlacionar el encabezado `X-Request-ID`.
5. Abrir la SPA y validar navegación, login y una consulta de lectura. Confirmar origen y base aislada antes de cualquier escritura de prueba. Registrar servicio, SHA, estado y evidencias. Configurar el monitor de Staging después de liberar.

Si falla CI, revisar el primer paso fallido, corregir mediante PR y validar el SHA resultante. Si falla la solicitud de CD, cotejar evento, rama, dependencias y secreto configurado. Si la solicitud fue aceptada y el servicio falla, revisar Render Events, logs y configuración de Node, origen y conexión. Cuando exista una revisión estable y el ambiente lo permita, solicitar el despliegue de ese SHA o promover un revert por el flujo de ramas. Verificar salud y funcionalidad al finalizar. Una reversión de código requiere comprobar por separado el impacto de escrituras ya realizadas.
 