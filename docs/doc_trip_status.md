
# Trip status

## Objetivo

Definir la lógica del estado del viaje en MUBER 2.

## Fuente de verdad

La fuente de verdad del tracking es:

- `trips.trip_status`

## Historial

Cada cambio relevante del viaje debe quedar registrado en:

- `trip_status_history`

## Estados actuales técnicos

- `driver_assigned`
- `en_camino`
- `arrived`
- `in_progress`
- `completed`

## Traducción visual sugerida

- `driver_assigned` → Conductor asignado
- `en_camino` → Chofer en camino
- `arrived` → Chofer llegó
- `in_progress` → Viaje en curso
- `completed` → Viaje finalizado

## Regla de producto

El usuario debe ver estados claros y entendibles.  
La pantalla no debe mostrar estados técnicos sin contexto.

## Regla técnica

Cada actualización desde Driver debe:
1. cambiar `trip_status`
2. crear registro en `trip_status_history`
3. reflejarse en User y Assisted