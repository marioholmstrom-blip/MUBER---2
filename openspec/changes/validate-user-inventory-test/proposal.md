# Proposal

## Cambio
Formalizar en `openspec` que el flujo `User` con inventario guiado ya fue validado en `TEST`.

## Motivo
El inventario dejo de ser solo UI y ya quedo verificado en Supabase con:
- `requests.inventory_method`
- `requests.inventory_summary`
- `requests.estimated_price_clp`
- `inventory_items`

## Resultado esperado
- respaldo formal del hito validado en `TEST`
- base clara para una futura migracion controlada a `REAL`
- trazabilidad de archivos, SQL y function involucrados
