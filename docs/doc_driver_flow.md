# Driver flow

## Objetivo

Definir el flujo actual de Driver dentro de MUBER 2.

## Flujo actual

1. Entrar a Driver
2. Cambiar a en línea
3. Cargar solicitudes pendientes
4. Seleccionar solicitud
5. Aceptar solicitud
6. Crear trip real
7. Actualizar estado del viaje
8. Finalizar viaje

## Qué lee Driver

Desde `requests`:
- solicitudes pendientes

Desde `trips`:
- viajes activos

## Qué escribe Driver

### En `requests`
- status = accepted
- status = completed

### En `trips`
- request_id
- trip_status
- total_price_clp
- comisiones
- simulated_driver_name
- simulated_vehicle
- simulated_plate

### En `trip_status_history`
- trip_id
- status
- note

## Estados del viaje

- driver_assigned
- en_camino
- arrived
- in_progress
- completed

## Regla actual

El conductor y el vehículo todavía son simulados, pero ya quedan guardados dentro de la tabla `trips`.

## Meta siguiente

Pasar de conductor simulado a conductor real sin romper el flujo ya validado.