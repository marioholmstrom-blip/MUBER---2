# Inventory User REAL Release Pack

## Objetivo

Dejar un paquete corto y trazable para que, cuando se autorice, la migracion del flujo `User + inventory` desde `TEST` a `REAL` sea limpia.

Este documento no autoriza tocar `REAL`.
Solo deja preparado el respaldo tecnico y operativo.

## Alcance de este release pack

Incluye:
- flujo `User` con inventario manual guiado
- persistencia en `requests`
- persistencia en `inventory_items`
- function `create-user-request`
- respaldo documental, SQL y specs

No incluye:
- `UserScreen.web.js`
- Driver
- tracking
- pagos
- Notion como backend
- activacion operativa en `REAL`

## Flujo objetivo

`servicio -> inventario -> resumen -> precio -> solicitud -> viaje -> pago`

## Estado validado en TEST

Validado en `TEST`:
- `requests.inventory_method`
- `requests.inventory_summary`
- `requests.estimated_price_clp`
- filas reales en `inventory_items`
- deploy funcional de `create-user-request`

## Archivos de codigo que deben viajar juntos

Frontend:
- `MUBER -3/UserScreen.native.js`
- `MUBER -3/InventoryStep.js`
- `MUBER -3/inventoryApi.js`
- `MUBER -3/api/userRequestApi.js`

Supabase:
- `supabase/functions/create-user-request/index.ts`
- `supabase/functions/_shared/cors.ts`

SQL:
- `SQL/test/013_inventory_items_user_flow_core.sql`
- `SQL/test/014_inventory_items_smoke_test.sql`
- `SQL/test/015_fix_profiles_rls_recursion.sql`
- `SQL/templates/template_inventory_user_real_handoff.sql`
- `SQL/templates/template_inventory_user_real_postgres_audit.sql`

Specs y trazabilidad:
- `MUBER - 2/openspec/changes/validate-user-inventory-test/`
- `MUBER - 2/openspec/specs/requests/spec.md`
- `MUBER - 2/openspec/specs/inventory/spec.md`
- `MUBER - 2/docs/doc_inventory_user_test_to_real_handoff.md`

## Precondiciones para una futura migracion a REAL

1. autorizacion explicita para tocar `REAL`
2. backup del estado actual de `REAL`
3. comparacion de schema entre `TEST` y `REAL`
4. comparacion de policies entre `TEST` y `REAL`
5. confirmacion de que `create-user-request` en `REAL` no rompe flujos existentes

## Checklist de migracion limpia

1. revisar schema de `requests`
2. revisar schema de `inventory_items`
3. revisar foreign keys
4. revisar RLS/policies de `requests`, `inventory_items` y `profiles`
5. desplegar `create-user-request`
6. probar flujo `User` con inventario manual
7. verificar request en Supabase
8. verificar rows en `inventory_items`
9. confirmar que no se rompen Driver, tracking ni pagos

## Validacion minima post-deploy

Verificar:
- `inventory_method` no nulo
- `inventory_summary` no nulo
- `estimated_price_clp` correcto
- cantidad correcta de filas en `inventory_items`
- misma relacion por `request_id`

## Relacion con la siguiente fase

Este paquete ya deja preparado el terreno para la futura capa de:
- estimacion de peso por item
- estimacion de volumen por item
- recomendacion de vehiculo segun volumen/peso total

Eso todavia no debe activarse en `REAL` sin una fase propia.
