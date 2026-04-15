# Driver flow

## Objetivo

Definir el flujo actual del conductor dentro del piloto operativo de MUBER 2.

## Rol de Driver

Driver representa la capa operativa real del servicio.

Es la pantalla que transforma una solicitud en un viaje ejecutable.

## Flujo actual

1. entrar a Driver
2. cambiar a en línea
3. cargar solicitudes pendientes
4. seleccionar solicitud
5. aceptar solicitud
6. crear trip real
7. actualizar estado del viaje
8. finalizar viaje

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

## Estado actual

Hoy Driver funciona como flujo operativo del piloto real.

## Evolución esperada

Durante la ruta de 30 días, este flujo debe acercarse a:
- mejor trazabilidad
- mayor precisión operativa
- integración futura con conductor real
- lógica más clara de ruta y mapa
- mejor integración con notificaciones y operación

## Regla clave

Driver no debe romper el flujo actual validado.  
La evolución debe ser incremental y comprobable.