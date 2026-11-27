# Limitaciones

[Análisis](../analisis.md)

## LIM-01. Reservaciones en tiempo real

El CRM no se conectará directamente con sistemas globales de distribución (GDS), como Amadeus, Sabre o Travelport.
No realizará reservaciones automáticas de vuelos, hoteles o tours. Los localizadores externos podrán registrarse manualmente.

## LIM-02. Emisión de boletos

No se implementarán funcionalidades de emisión, reemisión o cancelación directa de boletos aéreos.

## LIM-03. Procesamiento bancario

El CRM no procesará pagos con tarjetas ni realizará transacciones bancarias.
Únicamente permitirá registrar pagos informativos asociados a reservas, sin almacenar números completos de tarjetas, códigos de seguridad o credenciales bancarias.

## LIM-04. Facturación electrónica

No se implementará la generación de CFDI ni la integración con el SAT o proveedores externos de facturación.

## LIM-05. Integración automática con correo y mensajería

No se desarrollarán integraciones automáticas con Gmail, Outlook, WhatsApp Business o SMS durante la primera versión.
Las comunicaciones con clientes se gestionan fuera del CRM. El registro de interacciones y las tareas de seguimiento están fuera del MVP.

## LIM-06. Motor de precios dinámicos

El sistema no calculará automáticamente tarifas de aerolíneas, hoteles o servicios turísticos.
Los precios serán registrados por los asesores a partir de fuentes externas.

## LIM-07. Portal de autoservicio

La primera versión del CRM será de uso interno para administradores y asesores de viajes.
Los clientes no contarán con un portal para consultar o modificar directamente sus viajes.

## LIM-08. Aplicaciones móviles

No se desarrollarán aplicaciones nativas para Android o iOS.
Se implementará una aplicación web con diseño responsivo.

## LIM-09. Marketing avanzado

No se implementarán campañas masivas automatizadas, puntuación predictiva de prospectos, inteligencia artificial ni automatización omnicanal.

## LIM-10. Contabilidad completa

El CRM no sustituirá un sistema contable.
No administrará pólizas, conciliaciones bancarias, nómina ni estados financieros.

## LIM-11. Gestión documental sensible

Se evitará almacenar documentos personales completos, como pasaportes o visas, salvo que exista una justificación y controles adicionales de seguridad.

## LIM-12. Disponibilidad empresarial

Al tratarse de un proyecto académico y de desarrollo inicial, no se garantizará alta disponibilidad 24/7, replicación multirregión ni acuerdos empresariales de nivel de servicio.

## LIM-13. Integración con ERP y punto de venta

No se desarrollarán los módulos administrativos del ERP ni el punto de venta durante esta etapa.
Tampoco se implementará la migración, sincronización o integración operativa con el punto de venta actual.
Únicamente se considerarán sus necesidades futuras durante el diseño de arquitectura y datos.

La persistencia del CRM utiliza MongoDB Atlas. [RNF-04](requerimientos-no-funcionales/RNF-04.md)
