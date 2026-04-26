# Inventory User TEST -> REAL Handoff

## Objetivo

Dejar respaldo claro, trazable y copiable del estado validado del flujo `User` con inventario en `TEST`, sin tocar `REAL`.

Este documento sirve como base para:
- migrar la solucion a `REAL` mas adelante
- duplicar el setup en otro proyecto Supabase
- revisar que no falte ninguna pieza tecnica

## Regla de seguridad

- `TEST` es el entorno validado hasta aqui
- `REAL` no se toca con este documento
- no copiar secretos
- no asumir que `REAL` ya tiene el mismo schema o la misma function desplegada

## Flujo validado en TEST

Flujo de negocio validado:

`servicio -> inventario -> resumen -> precio -> solicitud -> viaje -> pago`

Estado validado en `TEST`:
- `UserScreen.native.js` muestra el paso de inventario guiado
- el usuario confirma items y necesidades especiales
- `requests` guarda `inventory_method`, `inventory_summary` y `estimated_price_clp`
- `inventory_items` guarda el detalle real por `request_id`
- la function `create-user-request` ya fue desplegada a `MUBER TEST`

## Archivos que forman la solucion

Frontend / app:
- `MUBER -3/UserScreen.native.js`
- `MUBER -3/InventoryStep.js`
- `MUBER -3/inventoryApi.js`
- `MUBER -3/api/userRequestApi.js`

Backend Supabase:
- `supabase/functions/create-user-request/index.ts`
- `supabase/functions/_shared/cors.ts`

SQL / soporte TEST:
- `SQL/test/013_inventory_items_user_flow_core.sql`
- `SQL/test/014_inventory_items_smoke_test.sql`
- `SQL/test/015_fix_profiles_rls_recursion.sql`

## Estado funcional alcanzado

En `TEST` ya quedo verificado:
- `requests.inventory_method`
- `requests.inventory_summary`
- `requests.estimated_price_clp`
- filas reales en `inventory_items`

El inventario ya no queda solo en UI.

## Dependencias reales

Mapa real:

- `UserScreen.native.js`
  - usa `InventoryStep.js`
  - usa `createUserRequest` en `api/userRequestApi.js`
- `api/userRequestApi.js`
  - invoca `create-user-request`
  - en `TEST` puede reconciliar el inventario usando `replaceInventoryForRequest`
- `inventoryApi.js`
  - normaliza items
  - construye `inventory_summary`
  - reemplaza `inventory_items` por `request_id`
- `supabase/functions/create-user-request/index.ts`
  - crea `requests`
  - guarda `inventory_summary`
  - guarda `estimated_price_clp`
  - inserta `inventory_items`

## Contrato actual de datos

En `requests`:
- `inventory_method`
- `inventory_summary`
- `estimated_price_clp`

En `inventory_items`:
- `request_id`
- `item_name`
- `quantity`
- `category`
- `notes`

## Soporte futuro de estimacion

La base ya quedo preparada para una siguiente fase donde cada item pueda conectarse a IA o base de datos para estimar:
- peso
- volumen
- fuente de estimacion

Campos ya considerados en el contrato frontend:
- `estimatedWeightKg`
- `estimatedVolumeM3`
- `estimationSource`

Esa capa todavia no esta activa en backend ni pricing real.

## Si mas adelante se copia a REAL

Orden recomendado:

1. revisar que `REAL` tenga columnas en `requests`:
   - `inventory_method`
   - `inventory_summary`
   - `estimated_price_clp`
2. revisar que `REAL` tenga tabla `inventory_items` compatible
3. desplegar la misma version de `create-user-request`
4. verificar el flujo en una prueba controlada
5. confirmar datos en `requests` e `inventory_items`
6. recien despues habilitar uso operativo

## Comando usado en TEST

Despliegue validado en `TEST`:

```powershell
npx.cmd supabase functions deploy create-user-request --project-ref oudzgknptlwooqohgual
```

## Verificacion minima despues de copiar

```sql
select id, origin_text, inventory_method, inventory_summary, estimated_price_clp, status
from public.requests
order by requested_at desc
limit 5;

select request_id, item_name, quantity, category, notes
from public.inventory_items
order by created_at desc
limit 20;
```

## Lo que no forma parte de este handoff

- `UserScreen.web.js`
- Driver
- tracking
- pagos
- Notion
- `REAL` operativo

## Criterio de listo para una futura migracion

Solo considerar lista una migracion a `REAL` si:
- el request guarda resumen y precio
- `inventory_items` queda poblado por el mismo `request_id`
- no se rompe el flujo `User`
- no se afectan Driver, tracking ni pagos
