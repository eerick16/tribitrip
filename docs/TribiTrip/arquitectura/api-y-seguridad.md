# API y seguridad

[Arquitectura](../arquitectura.md)

Las rutas están bajo `/api`; las rutas de negocio responden JSON salvo el documento imprimible. La tabla usa rutas relativas a ese prefijo.

| Módulo | Métodos y rutas |
|---|---|
| Salud y sesión | GET `/health`, POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`. Salud y login son públicos. |
| Usuarios | GET y POST `/usuarios`, PUT `/usuarios/:id`. Administrador. |
| Contactos | GET y POST `/clientes`, GET, PUT y DELETE `/clientes/:id`, GET `/clientes/:id/ficha` y `/clientes/:id/reservas`. |
| Solicitudes | GET y POST `/solicitudes`, GET y PUT `/solicitudes/:id`, GET y POST `/solicitudes/:id/viajeros`, PUT `/solicitudes/:id/viajeros/:viajeroId`. |
| Oportunidades | GET y POST `/oportunidades`, GET y PUT `/oportunidades/:id`, GET `/oportunidades/embudo` (administrador) y `/oportunidades/:id/cotizaciones`. |
| Catálogo | GET y POST `/servicios-turisticos`, GET `/servicios-turisticos/:id`. |
| Cotizaciones | GET y POST `/cotizaciones`, GET y PUT `/cotizaciones/:id`, PATCH `/cotizaciones/:id/estado`, GET `/cotizaciones/:id/versiones/:version` y su subruta `/documento`. |
| Reservas | GET y POST `/reservas`, GET `/reservas/:id`, PATCH `/reservas/:id/estado`, GET y POST `/reservas/:id/pagos`, POST `/reservas/:id/devoluciones`, GET `/cotizaciones/:id/reserva`. |
| Indicadores | GET `/dashboard` y `/reportes/comerciales`. Administrador. |

El login emplea correo y contraseña de una cuenta activa. Las contraseñas nuevas tienen de 12 a 128 caracteres y se derivan con scrypt y sal aleatoria. La cookie de sesión es HttpOnly, SameSite Strict y Secure en producción, con ámbito `/api` y duración de ocho horas. En MongoDB se guarda el hash SHA-256 del token. La consulta de sesión comprueba expiración y cuenta activa. El backend comprueba rol, propiedad de registros y origen en escrituras. El frontend controla menú y rutas privadas. Para login se admiten 15 intentos por ventana de 15 minutos.

Express limita JSON a 32 KB. Las rutas validan ObjectId, campos, rangos, fechas y transiciones según dominio. Mongoose aplica esquemas e índices al persistir. El API devuelve `mensaje` en fallos. Los códigos habituales son 400 para entradas inválidas, 401 para sesión ausente o inválida, 403 para operación prohibida y 404 para recursos ausentes o fuera del alcance. El 409 señala conflictos de revisión, duplicados u otras restricciones. Los errores internos se registran con Request ID y exponen un mensaje genérico. [Monitoreo](../monitoreo.md)
