
# Supabase schema

## Objetivo

Describir la estructura base de datos actual de MUBER 2.

## Tablas principales

- requests
- trips
- trip_status_history
- payments
- inventory_items
- drivers
- vehicles
- profiles

## requests

Representa la solicitud inicial del usuario.

### Campos principales
- id
- customer_id
- service_type
- assistance_type
- origin_text
- destination_text
- inventory_method
- inventory_summary
- estimated_price_clp
- status
- requested_at

## trips

Representa el viaje ya aceptado por Driver.

### Campos principales
- id
- request_id
- driver_id
- vehicle_id
- trip_status
- total_price_clp
- muber_commission_percent
- driver_commission_percent
- muber_income_clp
- driver_net_clp
- payment_status
- payment_method
- assigned_at
- completed_at
- simulated_driver_name
- simulated_vehicle
- simulated_plate

## trip_status_history

Representa el historial del cambio de estados.

### Campos principales
- id
- trip_id
- status
- note
- created_at

## Relación principal

- un `request` puede convertirse en un `trip`
- un `trip` puede tener varios cambios en `trip_status_history`

## Estado actual del sistema

- User escribe en `requests`
- Assisted escribe en `requests`
- Driver crea `trips`
- Driver actualiza `trip_status`
- User y Assisted leen tracking desde `trips`

## Regla clave

Los estados visibles en la app deben estar respaldados por datos reales en Supabase.