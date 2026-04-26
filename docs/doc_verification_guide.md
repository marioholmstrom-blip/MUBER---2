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

## Driver applications en TEST

- crear una postulacion desde `Driver`
- verificar fila real en `driver_applications`
- verificar ficha operativa en Notion con el mismo `Application ID`
- verificar que un update de `application_status` o `review_notes` actualiza la misma ficha
- usar `SQL/test/008_driver_applications_notion_sync_smoke_test.sql` como humo real de insert + update
- limpiar smoke tests con `SQL/test/009_driver_applications_cleanup_smoke_tests.sql`
- endurecer TEST a modo firmado con `SQL/test/010_driver_applications_notion_sync_signed_mode.sql`
- cargar la clave compartida de TEST con `SQL/test/011_driver_applications_set_signed_secret_template.sql`

## User inventory TEST

- revisar `MUBER - 2/docs/doc_inventory_user_test_to_real_handoff.md`
- verificar `requests.inventory_method`
- verificar `requests.inventory_summary`
- verificar `requests.estimated_price_clp`
- verificar filas reales en `inventory_items`
- usar `SQL/test/014_inventory_items_smoke_test.sql` como humo SQL de inventario
- usar `SQL/templates/template_inventory_user_real_handoff.sql` como respaldo para futura migracion a `REAL`

## User payments Webpay TEST

- revisar `MUBER - 2/docs/doc_payments_webpay_test_to_real_handoff.md`
- verificar `payments.payment_method = webpay_plus`
- verificar `payments.payment_status = paid`
- verificar `payments.paid_at`
- verificar `trips.payment_status`
- verificar evento `payment_registered` en `trip_status_history`
- usar `SQL/templates/template_payments_webpay_test_validation.sql` como respaldo de auditoria y verificacion
