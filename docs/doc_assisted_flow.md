# Assisted flow

## Objetivo

Definir el flujo del servicio asistido dentro de MUBER 2.

## Flujo actual

1. Elegir tipo de ayuda
2. Ingresar origen y destino
3. Elegir método de inventario
4. Revisar resumen y precio
5. Solicitar viaje
6. Ver tracking

## Tipos de ayuda actuales

- adulto_mayor
- movilidad
- carga_delicada

## Datos que se guardan

En `requests`:

- customer_id
- service_type = mudanza_asistida
- assistance_type
- origin_text
- destination_text
- inventory_method
- inventory_summary
- estimated_price_clp
- status

## Estado inicial

Cuando Assisted crea una solicitud, el estado parte como:

- `pending`

## Relación con Driver

Cuando Driver acepta:

- la solicitud cambia a `accepted`
- se crea el trip
- se registra historial
- se refleja el tracking en la pantalla

## Tracking esperado

Assisted debe poder ver:

- Buscando conductor
- Conductor asignado
- Chofer en camino
- Chofer llegó
- Viaje en curso
- Viaje finalizado

## Regla clave

El flujo asistido debe usar la misma base operativa del flujo User, pero con la lógica adicional de asistencia.