# Backend standards

## Objetivo

Definir reglas de backend para MUBER 2 usando Supabase como base operativa real.

## Base actual

MUBER 2 usa Supabase como backend mínimo real para:
- requests
- trips
- trip_status_history
- inventory
- payments
- estructura futura de drivers y vehicles

## Regla de modelo actual

### requests
Representa la solicitud inicial.

### trips
Representa el viaje ya aceptado por Driver.

### trip_status_history
Representa el historial de estados del viaje.

## Regla de consistencia

Todo cambio importante del flujo debe quedar persistido en base de datos.

No basta con que algo cambie visualmente en la app.

## Regla de cambios de estado

Cada vez que cambie el estado del viaje:
1. debe actualizarse `trips.trip_status`
2. debe registrarse en `trip_status_history`
3. debe poder verificarse en Supabase

## Regla de lectura y escritura

Antes de tocar backend, definir:
- qué tabla se lee
- qué tabla se escribe
- qué campos cambian
- qué pantalla depende de ese cambio

## Regla de piloto

Mientras el proyecto siga en fase piloto:
- priorizar estructura comprensible
- evitar complejidad prematura
- mantener compatibilidad con flujos ya validados

## Regla de evolución

Los modelos simulados, como conductor y vehículo simulado, pueden convivir temporalmente con modelos reales si eso ayuda a avanzar sin romper el flujo.

## Regla final

El backend de MUBER 2 debe ser:
- verificable
- entendible
- incremental
- útil para operar el piloto