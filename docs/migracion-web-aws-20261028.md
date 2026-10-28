# Migracion de web y DNS a AWS - 2026-10-28

## Alcance autorizado
Web mubercargo.com y landing existentes, conservando el contenido y los registros del correo. No modifica app, Supabase, agentes ni automatizaciones de marketing.

## Alojamiento
- Repositorio: marioholmstrom-blip/MUBER---2, rama main.
- Amplify existente: d3r2kuzsnx7fae, us-east-1, cuenta 123865823728.
- URL comprobada: https://main.d3r2kuzsnx7fae.amplifyapp.com/ (HTTP 200).
- La web ya estaba desplegada en AWS antes de esta migracion; se reutiliza.
- Se retira el workflow automatico de Azure. Amplify conserva su conexion existente a GitHub.
- El build solo publica index.html, legal/, mercadopago/ y MARKETING/. No publica documentacion interna ni configuracion del repositorio.
- No se cambian los HTML ni su contenido.

## DNS preparado
- Zona Route 53 existente: Z03779721O358J6OV9TR6.
- Se copiaron 9 conjuntos de registros de correo y verificacion desde Azure. Cambio C09836881R8E5660TV9TS confirmado INSYNC.
- Asociacion Amplify creada para mubercargo.com y www.mubercargo.com; pendiente de validacion publica.
- Destino del dominio: d1o6sheuol4xsf.cloudfront.net.
- Se conservan MX de ImprovMX, SPF, verificaciones, DMARC, DKIM de SES y Azure Communication Services y autodiscover.
- Conservar un registro DKIM no mantiene el alojamiento web en Azure. El proveedor de correo se migrara en otra fase.

## Impedimento confirmado
- Registro del dominio alojado en Azure subscription 1, 17840ceb-f34f-4b85-a0da-74026a3bbedc.
- Consulta directa ARM confirma state Disabled. No se infiere el motivo de facturacion.
- PUT transferout devuelve ReadOnlyDisabledSubscription; no se obtuvo codigo de transferencia.
- AWS CheckDomainTransferability devuelve UNTRANSFERABLE por bloqueo registral.
- No se inicio ni cobro una transferencia. AWS muestra US$16 para transferir .com.
- Debe reactivarse temporalmente la suscripcion o soporte de Azure debe liberar el dominio para generar el codigo y desbloquear su transferencia.
- No eliminar el registro del dominio: debe transferirse sin perder la titularidad.

## Pendiente antes de retirar Azure
1. Obtener liberacion del dominio y transferirlo a AWS, o permitir el cambio de delegacion al Route 53 existente.
2. Confirmar DNS publico, certificado emitido y respuesta HTTPS de dominio y www.
3. Localizar las fuentes exactas de las landing de choferes y usuarios. En las ramas accesibles revisadas no hay archivos dedicados para ellas; no se inventan paginas sustitutas.
4. Validar las landing con sus formularios y enlaces originales antes de eliminar los recursos sustituidos en Azure.

## Reversion
Mientras no cambie la delegacion, los registros publicados por el registrador siguen siendo los de Azure. Se conserva Azure y el contenido Git previo. El cambio de alojamiento no modifica servidores de correo ni credenciales.