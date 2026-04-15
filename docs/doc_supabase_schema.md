# Supabase schema

## Tablas principales
- requests
- trips
- trip_status_history
- payments
- inventory_items
- drivers
- vehicles

## Relaciones clave
- un `request` puede convertirse en un `trip`
- un `trip` tiene varios registros en `trip_status_history`

## Regla actual
Chofer y vehículo siguen simulados, pero ya se guardan dentro de `trips`.
