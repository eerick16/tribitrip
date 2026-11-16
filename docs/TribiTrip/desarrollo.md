# Desarrollo e implementación

[Portada](../TribiTrip.md) · [Configuración local](manuales/tecnico.md) · [Arquitectura](arquitectura.md)

## Control de versiones
 
El [repositorio oficial](https://github.com/eerick16/tribitrip) aloja el código. Las ramas individuales contienen cambios por funcionalidad. El Pull Request de una rama individual apunta a `dev`, que integra funcionalidades y alimenta Testing. El Pull Request de liberación de `dev` a `main` promueve la versión estable a Staging. Azure Boards gestiona el trabajo del proyecto y está conectado al repositorio oficial. Azure DevOps Code Wiki es el destino de publicación de la documentación. Vincular la historia o tarea al cambio y consultar las validaciones del PR. La configuración de protecciones obligatorias queda por confirmar.

## Integración de módulos

`SessionProvider` y las guardas mantienen el acceso a la SPA. Las pantallas llaman a la API mediante `src/services/api.js`; el servidor aplica la autorización en cada módulo. Los vínculos de cliente, solicitud, oportunidad y cotización mantienen el historial de negocio. Los modelos de cotización y reserva almacenan instantáneas para preservar valores aceptados. El arranque conecta a MongoDB, inicializa índices y actualiza reservas elegibles ya pagadas. La ficha, el dashboard y reportes integran consultas de los módulos. [Modelo de datos](arquitectura/modelo-de-datos.md) · [Trazabilidad](analisis/trazabilidad.md)

El manual técnico contiene requisitos, instalación, variables, ejecución, compilación y comandos de verificación. Los artefactos compilados se publican mediante CI. [Integración continua](integracion-continua.md)
