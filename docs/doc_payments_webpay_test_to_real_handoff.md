# Payments Webpay TEST to REAL Handoff

## Objetivo

Dejar respaldo operativo y trazable del primer flujo validado de pago `User` con `Webpay Plus` en `TEST`.

Este documento no autoriza tocar `REAL`.
Solo deja base limpia para futura migracion controlada.

## Alcance validado en TEST

Flujo validado:

`servicio -> inventario -> resumen -> precio -> solicitud -> viaje -> pago`

Cobertura validada:
- creacion de `request`
- persistencia de inventario en `requests` e `inventory_items`
- flujo normal de `Driver` hasta `trip_status = completed`
- inicio de pago desde `User`
- apertura de checkout `Webpay Plus` en mobile
- confirmacion de pago
- persistencia de pago en `payments`
- reflejo de estado pagado en tracking `User`

## Resultado validado

En `TEST` quedo verificado que:
- `payments.payment_method = webpay_plus`
- `payments.payment_status = paid`
- `payments.paid_at` queda con timestamp
- `trips.payment_status = paid`
- `trip_status_history` registra el evento de pago
- la UI `User` muestra `Pago confirmado`

## Archivos involucrados

Frontend:
- `MUBER -3/UserScreen.native.js`
- `MUBER -3/PaymentScreen.native.js`
- `MUBER -3/api/paymentApi.js`

Backend Supabase:
- `supabase/functions/create-trip-payment/index.ts`
- `supabase/functions/start-trip-payment/index.ts`
- `supabase/functions/confirm-trip-payment/index.ts`
- `supabase/functions/get-payment-status/index.ts`
- `supabase/functions/get-request-tracking/index.ts`
- `supabase/functions/_shared/transbank.ts`
- `supabase/functions/_shared/cors.ts`
- `supabase/config.toml`

## Arquitectura respetada

- Supabase = backend real
- Notion = backoffice, no backend
- GitHub = estructura y trazabilidad
- TEST por defecto
- REAL solo con autorizacion explicita
- mobile-first y responsive
- no exponer secretos ni tocar produccion sin revision

## Decisiones de implementacion

### 1. Pago al final del viaje

El pago v1 se habilita solo cuando `trip_status = completed`.

No se cobro antes del cierre operativo del viaje.

### 2. Sin secretos en frontend

La app no guarda credenciales de Transbank.

El frontend solo:
- solicita crear el pago
- abre el checkout
- refresca estado

La verdad de pago queda en Supabase.

### 3. Reuso del schema actual

No se agrego una tabla nueva de pagos.

Se reutilizo:
- `public.payments`
- `public.trips.payment_status`
- `public.trips.payment_method`
- `public.trip_status_history`

### 4. Cambio de estrategia en mobile

La primera estrategia con pagina puente HTML externa no fue estable en navegador mobile.

La validacion real se cerro usando:
- pantalla nativa de pago
- `WebView` en app
- retorno a `confirm-trip-payment`

## Dependencias funcionales

### Frontend

`UserScreen.native.js`
- habilita pago en tracking cuando el viaje esta completado
- consume `createTripPayment`
- abre `PaymentScreen.native.js`
- refresca tracking y pago

`PaymentScreen.native.js`
- arma el formulario POST hacia Webpay Plus
- abre checkout dentro de app
- detecta retorno a `confirm-trip-payment`

`paymentApi.js`
- invoca `create-trip-payment`
- invoca `get-payment-status`

### Backend

`create-trip-payment`
- valida viaje completado
- crea fila `payments` en `pending`
- crea transaccion en Transbank
- deja `payment_pending` en historial

`confirm-trip-payment`
- recibe retorno de Webpay
- confirma la transaccion
- marca `payments` como `paid` o `failed`
- actualiza `trips.payment_status`
- deja trazabilidad en `trip_status_history`

`get-payment-status`
- devuelve el ultimo estado real de pago para refresco de app

## Estado actual

Validado en `TEST`.

No validado en `REAL`.

## Riesgos abiertos antes de REAL

- limpiar intentos antiguos `pending` de pruebas previas
- definir politica de manejo para pagos fallidos o abandonados
- revisar expiracion de checkout y reintento
- revisar experiencia de retorno a app en distintos dispositivos
- revisar si `PaymentScreen.native.js` requiere version final para web o no

## Checklist futuro para migracion controlada a REAL

1. Confirmar credenciales reales de Transbank fuera del repo.
2. Confirmar URLs de retorno reales.
3. Auditar `payments`, `trips` y `trip_status_history` en `REAL`.
4. Repetir smoke test en ambiente controlado.
5. Validar rechazo, abandono y aprobacion.
6. Confirmar no interferencia con pagos ya registrados por `Driver`.
7. Dejar evidencia en GitHub y docs antes de habilitar piloto real.

## Regla final

Este hito confirma que la v1 de pagos funciona en `TEST`.

No implica que `REAL` este listo sin una iteracion adicional de auditoria, endurecimiento y validacion controlada.
