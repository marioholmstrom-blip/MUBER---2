# Spec: payments

## Proposito
Definir como MUBER registra ingresos y estado de pago del piloto.

## Objetivo del piloto
La ruta de 30 dias debe terminar con primeros ingresos de dinero reales y trazables.

## Debe soportar
- payment_status
- payment_method
- lectura de ingresos MUBER
- lectura de ingresos chofer
- base para tablero operativo
- pago `User` con debito o credito en `TEST`
- trazabilidad de pago por `trip_id`
- lectura de `paid_at`
- respaldo de flujo en `trip_status_history`

## Regla
No basta con completar viajes.
El piloto debe poder registrar dinero real de forma trazable.

## Validacion cerrada en TEST

Para `User`, ya quedo validado en `TEST`:
- inicio de pago desde tracking cuando `trip_status = completed`
- uso de `Webpay Plus`
- registro en `payments`
- actualizacion de `trips.payment_status`
- reflejo de pago confirmado en UI mobile

## Alcance de esta spec

Esta spec no habilita `REAL` por defecto.

Solo deja trazado que la v1 de pagos ya fue validada en `TEST` y debe auditarse antes de cualquier paso a piloto real.
