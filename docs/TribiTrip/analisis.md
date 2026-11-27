# Análisis

[Portada](../TribiTrip.md)

## Problema y justificación

La agencia maneja solicitudes, ventas y datos de clientes en procesos dispersos. Esto favorece duplicados, pérdida de seguimiento y dificultades para recuperar el historial y las preferencias. Un CRM compartido permite organizar el trabajo de los asesores, conservar el contexto de cada venta y evaluar resultados comerciales.

## Objetivo y solución

Centralizar datos y dar continuidad desde el prospecto hasta la reserva, conservando la ficha comercial y los importes acordados. La aplicación web usa React y Vite, con API REST en Node.js y Express y persistencia en MongoDB Atlas mediante Mongoose. [Arquitectura](arquitectura.md)

## Actores y reglas del negocio

El administrador gestiona cuentas y consulta datos globales, embudo e indicadores. El asesor opera registros bajo su responsabilidad. Los clientes y viajeros son sujetos de los registros internos. La solicitud pertenece a un contacto. La oportunidad hereda el asesor del contacto. Una cotización aceptada de una oportunidad ganada habilita el registro interno de reserva. Los pagos y devoluciones son movimientos informativos. [Roles y API](arquitectura/api-y-seguridad.md)

## Alcance

El MVP comprende 17 historias implementadas en F01, F02, F03, F04, F06 y F07. La aceptación manual sigue pendiente. Las dos historias de F05, HU-013 y HU-014, están fuera del MVP, al igual que el comercio electrónico, el ERP y el punto de venta. Fidelización, promociones y referidos son posibilidades de evolución.

- [Limitaciones](analisis/limitaciones.md)
- [Requerimientos funcionales](analisis/requerimientos-funcionales.md)
- [Requerimientos no funcionales](analisis/requerimientos-no-funcionales.md)
- [Historias de usuario](analisis/historias.md)
- [Matriz de trazabilidad](analisis/trazabilidad.md)
- [Evidencias y validaciones](evidencias.md)
