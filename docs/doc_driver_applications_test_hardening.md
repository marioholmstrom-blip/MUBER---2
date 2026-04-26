# Driver Applications TEST hardening

## Objetivo

Cerrar la validacion de `driver_applications -> Notion` en `TEST` con:

- limpieza controlada de smoke tests
- endurecimiento de unsigned-test a modo firmado

Reglas aplicadas:

- Supabase = backend real
- Notion = backoffice
- TEST por defecto
- REAL no se toca
- GitHub = trazabilidad

## 1. Limpieza controlada de smoke tests

Script:

- `SQL/test/009_driver_applications_cleanup_smoke_tests.sql`

Este script:

- borra filas smoke test de `public.driver_applications`
- no toca `REAL`
- no borra automaticamente fichas en Notion

Nota:

- la limpieza en Notion es manual porque esta integracion no es bidireccional

## 2. Endurecimiento a modo firmado en TEST

Script:

- `SQL/test/010_driver_applications_notion_sync_signed_mode.sql`
- `SQL/test/011_driver_applications_set_signed_secret_template.sql`

Este script:

- obliga a que el trigger use `x-muber-sync-secret`
- falla de forma explicita si falta `public.muber_runtime_settings.muber_sync_shared_secret`
- mantiene el alcance solo en `TEST`

## 3. Requisitos operativos

Antes de ejecutar el modo firmado en `TEST`, deben existir:

- una fila en `public.muber_runtime_settings` con `setting_key = 'muber_sync_shared_secret'`
- secret de funcion `MUBER_SYNC_SHARED_SECRET`
- `MUBER_SYNC_ALLOW_UNSIGNED_TEST=false` o sin definir

Carga sugerida:

- ejecutar `SQL/test/011_driver_applications_set_signed_secret_template.sql`
- reemplazar `REPLACE_WITH_TEST_SHARED_SECRET` por la clave real de TEST antes de correrlo

## 4. Verificacion esperada

Despues del endurecimiento:

1. un `INSERT` o `UPDATE` real en `driver_applications` dispara la Edge Function
2. la funcion recibe header firmado
3. Notion crea o actualiza la ficha correcta
4. si falta el secreto, el error queda visible en `TEST`

## 5. No hacer

- no ejecutar estos pasos en `REAL`
- no dejar secretos en codigo o documentacion
- no asumir que Notion reemplaza la verdad de Supabase
