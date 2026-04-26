# Proposal

## Cambio
Formalizar en `openspec` que el flujo `User` con pago `Webpay Plus` ya fue validado en `TEST`.

## Motivo
El flujo de pago dejo de ser solo plan y ya quedo verificado en Supabase con:
- `payments.payment_method = webpay_plus`
- `payments.payment_status = paid`
- `payments.paid_at`
- `trips.payment_status`
- `trip_status_history`

## Resultado esperado
- respaldo formal del hito validado en `TEST`
- base clara para futura migracion controlada a `REAL`
- trazabilidad de archivos frontend, functions y verificaciones SQL involucradas
