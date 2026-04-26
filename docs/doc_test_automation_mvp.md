# TEST automation MVP

## Objetivo

Definir un plan tÃ©cnico mÃ­nimo viable para automatizaciones de MUBER en `TEST`.

Este plan sigue estas reglas:
- Supabase = backend real
- Notion = backoffice y operaciÃ³n humana
- GitHub = estructura y trazabilidad
- `TEST` primero
- `REAL` no se toca en esta fase

## Regla base

La automatizaciÃ³n debe salir desde eventos reales de Supabase.

Notion no calcula, no decide y no reemplaza al backend.
Notion refleja operaciÃ³n.
GitHub refleja cambios tÃ©cnicos y decisiones.

## Alcance del MVP

Primero automatizar solo lo que da visibilidad operativa inmediata:

1. `driver_applications -> Notion`
2. `requests -> Notion`
3. `trips / trip_status_history -> Notion`
4. `payments -> Notion`

Y en paralelo reforzar trazabilidad tÃ©cnica en GitHub para:
- `SQL`
- `supabase/functions`
- `MUBER -3`

## Matriz tÃ©cnica

| AutomatizaciÃ³n | Trigger | Tabla origen | Destino | Payload mÃ­nimo | Prioridad |
|---|---|---|---|---|---|
| Crear ficha de postulaciÃ³n | `INSERT` | `driver_applications` | Notion | `id`, `applicant_user_id`, `applicant_profile_id`, `status`, `created_at` | alta |
| Actualizar postulaciÃ³n | `UPDATE status` / aprobaciÃ³n | `driver_applications` | Notion | `id`, `status`, `approved_profile_id`, `approved_driver_id`, `approved_vehicle_id` | alta |
| Crear solicitud operativa | `INSERT` | `requests` | Notion | `id`, `customer_id`, `service_type`, `origin_text`, `destination_text`, `estimated_price_clp`, `status`, `requested_at` | alta |
| Crear viaje asignado | `INSERT` | `trips` | Notion | `id`, `request_id`, `driver_id`, `vehicle_id`, `trip_status`, `assigned_at`, `total_price_clp` | alta |
| Reflejar hito de viaje | `INSERT` | `trip_status_history` | Notion | `trip_id`, `status`, `note`, `created_at` | alta |
| Reflejar pago | `INSERT` / `UPDATE payment_status` | `payments` | Notion | `trip_id`, `amount_clp`, `payment_method`, `payment_status`, `paid_at`, `note` | alta |
| Trazar cambio de esquema | cambio en repo | `SQL/*` | GitHub | script SQL, alcance, entorno, motivo | alta |
| Trazar cambio backend | cambio en repo | `supabase/functions/*` | GitHub | funciÃ³n, flujo afectado, motivo | alta |
| Trazar cambio frontend | cambio en repo | `MUBER -3/*` | GitHub | pantalla/API afectada, impacto funcional | media |

## Mecanismo recomendado

### 1. Supabase -> Notion

Usar `Edge Functions` o triggers controlados en Supabase para emitir eventos server-to-server hacia Notion API.

PatrÃ³n recomendado:

1. ocurre evento real en tabla de Supabase
2. backend normaliza payload mÃ­nimo
3. backend crea o actualiza registro en Notion
4. si falla Notion, no se rompe el flujo principal del producto
5. el error de sincronizaciÃ³n debe quedar trazable

### 2. GitHub

Usar trazabilidad simple y verificable:

1. scripts SQL versionados
2. funciones Edge versionadas
3. frontend versionado
4. documentaciÃ³n de decisiones en `MUBER - 2`

No hace falta automatizar GitHub Actions en esta primera fase.

## Orden de implementaciÃ³n en TEST

### Fase 1
- `driver_applications -> Notion`
- `requests -> Notion`

### Fase 2
- `trips -> Notion`
- `trip_status_history -> Notion`

### Fase 3
- `payments -> Notion`

### Fase 4
- disciplina de trazabilidad GitHub

## QuÃ© hacer primero

### Primero

Implementar una sola funciÃ³n de sincronizaciÃ³n para `driver_applications` en `TEST`.

Razones:
- afecta operaciÃ³n humana directa
- es un flujo claro
- no toca pagos
- permite validar modelo Notion sin entrar todavÃ­a en viajes y cobros

### Segundo

Implementar sincronizaciÃ³n de `requests`.

Razones:
- da visibilidad inmediata al backoffice
- permite ver demanda operativa real

### Tercero

Sincronizar `trips` y `trip_status_history`.

Razones:
- ahÃ­ vive el seguimiento del viaje
- sirve para auditorÃ­a de operaciÃ³n

### Cuarto

Sincronizar `payments`.

Razones:
- es sensible
- conviene entrar a pagos cuando viaje y estados ya estÃ©n firmes

## QuÃ© no tocar todavÃ­a

- No automatizar `REAL` antes de validar el flujo en `TEST`
- No hacer integraciÃ³n bidireccional Notion <-> Supabase
- No usar Notion como motor de estados
- No mezclar automatizaciÃ³n de onboarding, viaje y pagos en una sola funciÃ³n
- No automatizar todo GitHub antes de estabilizar los eventos operativos

## Criterio de validaciÃ³n

Una automatizaciÃ³n del MVP sirve si:

1. nace de un evento real en Supabase
2. no cambia la verdad del sistema
3. no rompe el flujo principal
4. deja rastros claros en Notion o GitHub
5. puede probarse y auditarse en `TEST`

## Salida esperada de esta fase

Al terminar este MVP en `TEST`, MUBER deberÃ­a tener:

- backoffice visible para postulaciones
- backoffice visible para solicitudes
- backoffice visible para viajes y estados
- backoffice visible para pagos
- trazabilidad tÃ©cnica suficiente para migrar luego a `REAL`
