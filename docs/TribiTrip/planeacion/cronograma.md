# Cronograma de desarrollo — TribiTrip
## Calendario de trabajo
**Duración:** 5 semanas  
**Alcance:** MVP del módulo CRM  
**Metodología:** Scrum y Kanban

[Planeación](../planeacion.md)

Las fechas y duraciones del Gantt corresponden al calendario planificado.

## Distribución de actividades

| Actividad | S1 | S2 | S3 | S4 | S5 |
|---|:---:|:---:|:---:|:---:|:---:|
| Análisis y diseño | X | | | | |
| F01 — Autenticación y usuarios | | X | | | |
| F02 — Clientes, prospectos y viajeros | | X | X | | |
| F03 — Solicitudes y oportunidades | | | X | X | |
| F04 — Cotizaciones | | | X | X | |
| F06 — Reservas y pagos informativos | | | | X | |
| F07 — Dashboard, reportes y búsquedas | | X | X | X | |
| Integración y pruebas | | X | X | X | X |
| Documentación y despliegue | | | | | X |

## Alcance

Se incluyen 6 épicas y 17 historias de usuario. La épica F05 — Seguimiento e interacciones comerciales queda excluida.

## Entregables

- Semana 1: requerimientos, arquitectura, prototipos y entorno configurado.
- Semana 2: autenticación, roles y gestión de clientes.
- Semana 3: solicitudes, oportunidades y cotizador.
- Semana 4: reservas, pagos informativos, dashboard y reportes.
- Semana 5: pruebas finales, documentación y despliegue.


::: mermaid
gantt
    title Cronograma TribiTrip - 5 semanas
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section Planeacion
    Analisis y arquitectura :2026-10-19, 5d

    section F01 Autenticacion
    HU001 Login :2026-10-26, 3d
    HU002 Usuarios y roles :2026-10-28, 3d

    section F02 Clientes
    HU003 Registro de clientes :2026-10-26, 4d
    HU004 Consulta y edicion :2026-10-28, 4d
    HU005 Registro de viajeros :2026-11-02, 3d

    section F03 Oportunidades
    HU006 Solicitudes :2026-11-02, 3d
    HU007 Oportunidades :2026-11-03, 4d
    HU008 Embudo comercial :2026-11-09, 3d

    section F04 Cotizaciones
    HU009 Catalogo basico :2026-11-02, 3d
    HU010 Cotizador :2026-11-04, 5d
    HU011 Estados y versiones :2026-11-09, 3d
    HU012 Documento PDF :2026-11-11, 3d

    section F06 Reservas
    HU015 Reservas :2026-11-09, 4d
    HU016 Pagos informativos :2026-11-11, 3d

    section F07 Reportes
    HU019 Busquedas :2026-10-28, 3d
    HU017 Dashboard :2026-11-10, 3d
    HU018 Reportes :2026-11-12, 3d

    section Entrega
    Pruebas finales :2026-11-16, 3d
    Documentacion :2026-11-18, 2d
    Despliegue y presentacion :2026-11-20, 1d
:::
