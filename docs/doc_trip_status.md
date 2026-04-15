# Trip status

## Objetivo

Definir la lógica del estado del viaje en MUBER 2.

## Fuente de verdad

La fuente principal del estado actual del viaje es:

- `trips.trip_status`

## Historial

La trazabilidad del cambio de estados vive en:

- `trip_status_history`

## Estados técnicos actuales

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

Los estados visibles deben ser:
- claros
- entendibles
- tranquilizadores
- útiles para usuarios con distintos niveles de alfabetización digital

## Relación con accesibilidad

El tracking es una pieza crítica de confianza.

Por eso debe evolucionar hacia:
- mejor legibilidad
- mensajes más directos
- futura compatibilidad con voz y notificaciones
- menor ambigüedad

## Regla técnica

Cada cambio de estado desde Driver debe:
1. actualizar `trips.trip_status`
2. registrar historial
3. reflejarse en User y Assisted

## Regla final

El tracking no es solo una función técnica.
Es una parte central de la promesa de confianza del producto.