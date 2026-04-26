# Design

El cambio no agrega un producto nuevo.

Su objetivo es dejar trazabilidad formal de que el flujo:

`servicio -> inventario -> resumen -> precio -> solicitud -> viaje -> pago`

ya quedo validado en `TEST` para `User`, con persistencia real en Supabase y cierre correcto de pago `Webpay Plus`.

La validacion cerrada en `TEST` usa:
- tracking `User` como punto de entrada al pago
- pantalla nativa de pago en app
- Supabase Edge Functions para crear y confirmar la transaccion
- tablas reales `payments`, `trips` y `trip_status_history`
