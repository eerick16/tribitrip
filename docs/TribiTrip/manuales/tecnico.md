# Manual técnico

[Manuales](../manuales.md) · [Arquitectura](../arquitectura.md) · [Despliegue](../despliegue.md) · [Monitoreo](../monitoreo.md)

## Instalación local

Usar Git, Node.js 24, npm, un navegador moderno y acceso autorizado a Atlas con una base aislada. Obtener el [repositorio oficial](https://github.com/eerick16/tribitrip), seleccionar la rama de trabajo y ejecutar en la raíz, con los lockfiles incluidos:

```sh
npm ci
npm --prefix server ci
```
 
Crear `server/.env` local con `MONGODB_URI` para la base autorizada y `APP_ORIGIN=http://localhost:5173`. Express toma `PORT` (3001 por defecto) y `HOST` (127.0.0.1 local). Si cambian puertos, alinear también el destino de proxy de Vite y el origen. `NODE_ENV=production` activa cookie Secure y corresponde a un origen HTTPS. Conservar las credenciales fuera de Git. El comando opcional `npm --prefix server run seed:admin` requiere `ADMIN_EMAIL`, `ADMIN_PASSWORD` y opcionalmente `ADMIN_NAME`. El seed escribe en la base y se usa para provisionar una cuenta autorizada.

## Ejecución y verificación

Ejecutar en terminales separadas desde la raíz:

```sh
npm --prefix server run dev
npm run dev
```

Abrir `http://localhost:5173`. El proxy de Vite apunta a `http://127.0.0.1:3001`. Para probar el servicio con SPA compilada, compilar y ejecutar el backend sin el modo watch. Si se navega directamente por Express, configurar `APP_ORIGIN` para ese origen.

```sh
npm run lint
npm run build
npm --prefix server test
npm --prefix server start
```

`dist/` es la salida del build; `npm run preview` inspecciona la salida de Vite. Para el flujo completo se usa Express o Vite con el proxy local. Las suites del servidor y su integración documental se describen en [Pruebas](../pruebas.md).

## Diagnóstico

| Síntoma | Comprobación |
|---|---|
| Backend termina en arranque o health devuelve 503 | Revisar carga de `.env`, nombre de base, conexión y acceso autorizado en Atlas; consultar logs. |
| Vite indica puerto ocupado o API inaccesible | Revisar puertos 5173 y 3001 y el proxy; confirmar el listener del backend. |
| Escritura responde 403 | Comparar el origen exacto con `APP_ORIGIN` y revisar el rol. |
| Redirección a login o 401 después de editar una cuenta | Confirmar vigencia de sesión y estado de cuenta; volver a entrar tras revocación. |
| 409 al guardar | Revisar duplicados o recargar la revisión vigente antes de repetir. |
| SPA sin recursos en Render | Revisar SHA, build de Render, existencia de `dist/`, Events y logs. |

[Configuración por ambiente y CD](../despliegue.md) · [Liberación y recuperación](../despliegue/liberacion.md) · [Correlación con Request ID](../monitoreo.md)
