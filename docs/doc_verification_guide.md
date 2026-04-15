# Verification guide

## Objetivo

Definir cómo verificar cambios y flujos dentro de MUBER 2.

## Regla general

Todo cambio importante debe comprobarse en tres capas:

1. interfaz
2. base de datos
3. documentación

## Verificación mínima del flujo actual

### User
- puede crear request
- el request queda guardado en Supabase
- el tracking carga correctamente

### Assisted
- puede crear request
- el request queda guardado en Supabase
- el tracking carga correctamente

### Driver
- carga solicitudes
- acepta una solicitud
- crea trip real
- actualiza trip_status
- registra historial

## Verificación en Supabase

Revisar:
- `requests`
- `trips`
- `trip_status_history`

## Verificación documental

Después de cerrar una mejora relevante, revisar si también debe actualizarse:
- `README.md`
- `docs/`
- `ai-specs/specs/`
- `openspec/specs/`
- `openspec/changes/`

## Regla final

Si algo funciona en pantalla pero no puede verificarse en Supabase, no debe considerarse cerrado.