# Verification guide

## Objetivo

Definir cómo verificar cambios en MUBER 2.

## Regla general

Nada se considera realmente cerrado si no se valida en estas tres capas:

1. interfaz
2. base de datos
3. documentación

## Verificación mínima del flujo actual

### User
- puede crear request
- el request queda guardado
- el tracking muestra estado coherente

### Assisted
- puede crear request
- el request queda guardado
- el tracking muestra estado coherente

### Driver
- carga solicitudes
- acepta solicitud
- crea trip
- actualiza trip_status
- registra historial

## Verificación en Supabase

Revisar:
- `requests`
- `trips`
- `trip_status_history`

## Verificación documental

Después de cerrar una mejora relevante, revisar si debe actualizarse:
- `README.md`
- `docs/`
- `ai-specs/specs/`
- `openspec/specs/`
- `openspec/changes/`

## Verificación adicional del MVP

Dado el foco actual del proyecto, también debe revisarse progresivamente:

- claridad de accesibilidad
- comprensión del tracking
- rol del inventario
- relación con pricing y presupuesto
- coherencia con mapa / logística
- compatibilidad futura con notificaciones

## Regla final

Si algo se ve bien en la interfaz pero no puede verificarse en Supabase, no debe considerarse cerrado.