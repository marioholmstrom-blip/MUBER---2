# Supabase schema

## Objetivo

Documentar la estructura base de datos actual de MUBER 2 usando Supabase como backend operativo del piloto.

## Nota importante

En material estratégico previo del proyecto aparecen otras alternativas técnicas como Firebase, SQL, RoR o Python como parte de la arquitectura conceptual del sistema.

Sin embargo, el piloto operativo actual de MUBER 2 ya está implementado sobre Supabase.

Por lo tanto:
- la visión histórica y estratégica se respeta
- pero la implementación actual documentada aquí corresponde a Supabase

## Tablas principales actuales

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

Representa el historial de estados del viaje.

### Campos principales
- id
- trip_id
- status
- note
- created_at

## Lectura conceptual del sistema

La documentación estratégica anterior hablaba de un núcleo tipo `orders`.

En la implementación actual del piloto eso se expresa así:

- `requests` = intención o solicitud inicial
- `trips` = ejecución operativa del servicio

## Regla clave

Supabase es la fuente de verdad operativa del piloto actual.
La documentación debe reflejar eso con claridad.