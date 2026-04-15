# Supabase rules

## Objetivo

Definir reglas de uso de Supabase dentro de MUBER 2.

## Rol de Supabase

Supabase es la base operativa real del sistema.

Debe respaldar:
- solicitudes
- viajes
- estados
- historial
- pagos
- inventario

## Regla de fuente de verdad

Cuando exista diferencia entre:
- lo que dice la interfaz
- y lo que dice Supabase

la fuente de verdad es Supabase.

## Regla de escritura

Toda escritura importante debe poder verse luego en tablas reales.

Ejemplos:
- un request nuevo en `requests`
- un trip nuevo en `trips`
- un cambio de estado en `trip_status_history`

## Regla de verificación

Después de un cambio que toque backend, revisar siempre:
- que el dato se guardó
- que el estado cambió
- que el flujo en pantalla coincide con la base

## Regla de cambios estructurales

Si se agregan:
- tablas
- columnas
- relaciones
- campos nuevos

debe quedar claro:
- por qué existen
- qué flujo tocan
- cómo se verifican

## Regla de compatibilidad

Mientras el proyecto siga en piloto, los cambios en Supabase deben evitar romper:
- User
- Assisted
- Driver
- tracking existente

## Regla de historial

Los cambios de estado del viaje no deben perder trazabilidad.

Por eso:
- `trips.trip_status` muestra el estado actual
- `trip_status_history` conserva el historial

## Regla final

Supabase en MUBER 2 no es solo almacenamiento.
Es la base de validación real del producto.