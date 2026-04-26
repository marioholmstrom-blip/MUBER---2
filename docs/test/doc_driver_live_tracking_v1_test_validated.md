# Driver Live Tracking v1 TEST validado

## Estado
Driver Live Tracking v1 fue validado correctamente en MUBER TEST.

## Flujo validado
chofer comparte ubicación → Supabase TEST guarda ubicación → Realtime publica cambios → UserScreen muestra marcador → contador se actualiza

## Entorno
TEST.

## Project ref TEST
oudzgknptlwooqohgual

## Backend
Supabase TEST.

## Frontend
MUBER -3.

## Resultado funcional
- El chofer comparte ubicación usando expo-location.
- La ubicación se guarda en public.driver_live_locations.
- El historial se guarda en public.trip_location_history.
- Realtime está habilitado para public.driver_live_locations.
- El usuario ve el marcador del chofer.
- El contador "Actualizado hace Xs" cambia visualmente.
- El contador vuelve a 0s cuando llega una nueva actualización.

## Tablas validadas

### public.driver_live_locations
Columnas:
- trip_id
- request_id
- driver_id
- latitude
- longitude
- heading
- speed_kph
- accuracy_meters
- recorded_at
- created_at
- updated_at
- is_active

### public.trip_location_history
Columnas:
- id
- trip_id
- request_id
- driver_id
- latitude
- longitude
- heading
- speed_kph
- accuracy_meters
- recorded_at
- created_at

## Reglas respetadas
- Supabase como backend real.
- Notion como backoffice, no backend.
- TEST por defecto.
- REAL no fue tocado.
- No se tocaron pagos v1.
- No se tocó inventario.
- No se expusieron secrets.
- No se usaron mocks como base principal.
- Mobile-first respetado.

## Archivos principales relacionados
- MUBER -3/DriverScreen.js
- MUBER -3/UserScreen.native.js
- MUBER -3/lib/deviceLocation.js
- MUBER -3/api/driverLocationApi.js
- MUBER -3/api/driverOperationsApi.js
- SQL/test/020_driver_live_locations_core.sql
- SQL/test/021_driver_live_locations_rls.sql
- SQL/test/022_driver_live_locations_add_is_active.sql

## Respaldo local
Se creó respaldo local en:

_backups/test-driver-live-tracking-v1-ok

## Próximo frente
Driver Panel Data v1:
mostrar al chofer precio total, datos del usuario, origen, destino, inventario, necesidades especiales, estado del viaje y estado de pago.
