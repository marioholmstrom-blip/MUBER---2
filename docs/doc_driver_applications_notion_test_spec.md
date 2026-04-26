# Driver applications -> Notion (`TEST`)

## Objetivo

Definir la primera automatizaciÃ³n implementable de MUBER en `TEST` para reflejar postulaciones de chofer en Notion sin convertir Notion en backend.

Reglas aplicadas:
- Supabase = backend real
- Notion = backoffice
- GitHub = estructura y trazabilidad
- `TEST` primero
- `REAL` no se toca en esta fase

## Resultado esperado

Cada vez que una postulaciÃ³n de chofer se crea o cambia de estado en `TEST`:

1. Supabase sigue siendo la fuente de verdad
2. Notion recibe o actualiza una ficha operativa
3. la operaciÃ³n humana puede revisar el caso desde Notion
4. si Notion falla, la postulaciÃ³n sigue existiendo en Supabase

## Alcance del MVP

Este documento cubre solo:
- `driver_applications -> Notion`
- entorno `TEST`
- eventos `INSERT` y `UPDATE`

No cubre todavÃ­a:
- `REAL`
- sincronizaciÃ³n bidireccional
- viajes
- pagos
- automatizaciones de GitHub Actions

## Fuente de datos real

Tabla origen:
- `public.driver_applications`

Campos confirmados o ya usados por el flujo actual:
- `id`
- `created_at`
- `applicant_user_id`
- `applicant_profile_id`
- `full_name`
- `phone`
- `email`
- `city`
- `notes`
- `vehicle_type`
- `vehicle_brand`
- `vehicle_model`
- `vehicle_plate`
- `vehicle_capacity`
- `available_now`
- `zones`
- `schedule_text`
- `accepts_last_mile`
- `accepts_standard`
- `accepts_assisted`
- `accepts_fragile`
- `has_id_document`
- `has_license_document`
- `has_vehicle_document`
- `has_insurance_document`
- `application_status`
- `reviewed_at`
- `review_notes`
- `approved_profile_id`
- `approved_driver_id`
- `approved_vehicle_id`

## Mecanismo recomendado

### PatrÃ³n

Usar este camino:

1. se escribe la postulaciÃ³n real en Supabase
2. Supabase dispara una llamada backend a una Edge Function
3. la Edge Function normaliza el payload
4. la Edge Function crea o actualiza la ficha en Notion

### DecisiÃ³n del MVP

Para este MVP conviene:

- **Edge Function dedicada**:
  - `sync-driver-application-to-notion`
- **disparo automÃ¡tico desde Supabase `TEST`**:
  - por webhook/trigger de base de datos

RazÃ³n:
- no mueve lÃ³gica al frontend
- no obliga a que la app espere a Notion
- mantiene a Supabase como fuente de verdad

## Trigger exacto

### Evento 1

- tipo: `INSERT`
- tabla: `public.driver_applications`
- objetivo: crear ficha en Notion

### Evento 2

- tipo: `UPDATE`
- tabla: `public.driver_applications`
- objetivo: actualizar ficha en Notion cuando cambie algo operativo relevante

### Campos que deben gatillar actualizaciÃ³n

Como mÃ­nimo:
- `application_status`
- `review_notes`
- `reviewed_at`
- `approved_profile_id`
- `approved_driver_id`
- `approved_vehicle_id`

Y opcionalmente, si se corrigen datos del formulario:
- `full_name`
- `phone`
- `email`
- `city`
- `vehicle_type`
- `vehicle_brand`
- `vehicle_model`
- `vehicle_plate`

## Edge Function propuesta

Nombre:
- `sync-driver-application-to-notion`

Responsabilidad:
- recibir el evento desde Supabase `TEST`
- cargar la fila real de `driver_applications`
- construir payload operativo
- crear o actualizar la ficha en Notion

Responsabilidades que no debe tener:
- aprobar la postulaciÃ³n
- calcular negocio
- decidir matching
- reemplazar `driver_applications`

## Secretos y configuraciÃ³n

Solo en `TEST`:

- `NOTION_MUBER_TOKEN`
- `NOTION_DRIVER_APPLICATIONS_DATABASE_ID`
- `MUBER_SYNC_SHARED_SECRET`

Uso:
- `NOTION_MUBER_TOKEN`: autenticar contra Notion API
- `NOTION_DRIVER_APPLICATIONS_DATABASE_ID`: base de destino en Notion
- `MUBER_SYNC_SHARED_SECRET`: validar que la invocaciÃ³n venga del origen esperado

Regla:
- estos secretos no van al frontend
- no se documentan en texto plano
- no se usan en `REAL` hasta validar el flujo en `TEST`

## Contrato del payload interno

Payload mÃ­nimo que la Edge Function debe construir desde Supabase:

```json
{
  "application_id": "uuid",
  "created_at": "timestamp",
  "application_status": "submitted",
  "reviewed_at": null,
  "review_notes": null,
  "applicant_user_id": "uuid|null",
  "applicant_profile_id": "uuid|null",
  "full_name": "string",
  "phone": "string",
  "email": "string",
  "city": "string",
  "notes": "string",
  "vehicle_type": "string",
  "vehicle_brand": "string",
  "vehicle_model": "string",
  "vehicle_plate": "string",
  "vehicle_capacity": "string",
  "available_now": true,
  "zones": "string",
  "schedule_text": "string",
  "accepts_last_mile": true,
  "accepts_standard": true,
  "accepts_assisted": false,
  "accepts_fragile": false,
  "has_id_document": true,
  "has_license_document": true,
  "has_vehicle_document": true,
  "has_insurance_document": false,
  "approved_profile_id": null,
  "approved_driver_id": null,
  "approved_vehicle_id": null
}
```

## Estructura sugerida en Notion

Base sugerida:
- `Driver Applications - TEST`

Propiedades mÃ­nimas:

| Propiedad Notion | Tipo | Origen Supabase |
|---|---|---|
| `Application ID` | text | `id` |
| `Status` | select | `application_status` |
| `Created At` | date | `created_at` |
| `Reviewed At` | date | `reviewed_at` |
| `Full Name` | title o text | `full_name` |
| `Phone` | phone/text | `phone` |
| `Email` | email | `email` |
| `City` | select/text | `city` |
| `Notes` | rich_text | `notes` |
| `Vehicle Type` | select/text | `vehicle_type` |
| `Vehicle Brand` | text | `vehicle_brand` |
| `Vehicle Model` | text | `vehicle_model` |
| `Vehicle Plate` | text | `vehicle_plate` |
| `Vehicle Capacity` | text | `vehicle_capacity` |
| `Available Now` | checkbox | `available_now` |
| `Zones` | rich_text | `zones` |
| `Schedule` | rich_text | `schedule_text` |
| `Accepts Last Mile` | checkbox | `accepts_last_mile` |
| `Accepts Standard` | checkbox | `accepts_standard` |
| `Accepts Assisted` | checkbox | `accepts_assisted` |
| `Accepts Fragile` | checkbox | `accepts_fragile` |
| `Has ID Document` | checkbox | `has_id_document` |
| `Has License Document` | checkbox | `has_license_document` |
| `Has Vehicle Document` | checkbox | `has_vehicle_document` |
| `Has Insurance Document` | checkbox | `has_insurance_document` |
| `Review Notes` | rich_text | `review_notes` |
| `Applicant User ID` | text | `applicant_user_id` |
| `Applicant Profile ID` | text | `applicant_profile_id` |
| `Approved Profile ID` | text | `approved_profile_id` |
| `Approved Driver ID` | text | `approved_driver_id` |
| `Approved Vehicle ID` | text | `approved_vehicle_id` |

## Regla de idempotencia

La ficha de Notion debe poder actualizarse sin duplicarse.

Regla:
- usar `Application ID` como identificador Ãºnico operativo
- si ya existe una pÃ¡gina con ese `Application ID`, actualizar
- si no existe, crear

## Comportamiento ante error

Si Notion falla:

1. **no** se revierte la escritura en `driver_applications`
2. la Edge Function responde error controlado para logs
3. el error debe quedar visible en logs de Supabase

Para el MVP no es obligatorio crear todavÃ­a una tabla de sync logs.

## Validaciones de seguridad

La funciÃ³n debe:

1. aceptar solo invocaciones desde el flujo autorizado
2. validar secreto compartido
3. no exponer token de Notion
4. no devolver errores crudos al frontend
5. normalizar strings antes de enviarlos a Notion

## Criterio de prueba en TEST

### Caso 1

Crear una postulaciÃ³n nueva desde `Driver`.

Verificar:
- existe fila en `public.driver_applications`
- existe ficha en Notion con el mismo `Application ID`

### Caso 2

Actualizar `application_status`.

Verificar:
- la fila se actualiza en Supabase
- la misma ficha en Notion refleja el cambio

### Caso 3

Actualizar `review_notes` o `approved_*`.

Verificar:
- Supabase sigue siendo la verdad
- Notion refleja el nuevo estado

### Caso 4

Forzar error de Notion.

Verificar:
- Supabase conserva la postulaciÃ³n
- el flujo principal no se rompe
- el error queda trazable en logs

## Entregables tÃ©cnicos esperados

Para considerar esta automatizaciÃ³n lista en `TEST`, deberÃ­an existir:

1. Edge Function:
   - `supabase/functions/sync-driver-application-to-notion`
2. script SQL o configuraciÃ³n de trigger/webhook en `SQL/test`
3. documento de base Notion objetivo
4. verificaciÃ³n manual del flujo en `TEST`

## QuÃ© no hacer en esta primera implementaciÃ³n

- no sincronizar hacia `REAL`
- no disparar desde el frontend
- no usar Notion para aprobar postulaciones
- no mezclar esta funciÃ³n con `requests`, `trips` o `payments`
- no abrir automatizaciÃ³n bidireccional

## DecisiÃ³n operativa

La primera automatizaciÃ³n implementable de MUBER en `TEST` debe ser:

**`driver_applications -> Notion` usando evento real de Supabase + Edge Function dedicada + ficha operativa idempotente en Notion.**

## Nota TEST vs REAL

En `TEST` se permite una modalidad temporal mÃƒÂ¡s flexible:

- si falta el setting `app.settings.muber_sync_shared_secret`, el trigger no debe bloquear la postulaciÃƒÂ³n
- la Edge Function puede aceptar sincronizaciÃƒÂ³n sin header firmado si estÃƒÂ¡ habilitado `MUBER_SYNC_ALLOW_UNSIGNED_TEST=true`

Esto existe solo para no frenar iteraciÃƒÂ³n y validaciÃƒÂ³n en `TEST`.

Antes de pasar a `REAL`, debe volver una versiÃƒÂ³n estricta:
- trigger firmado
- validaciÃƒÂ³n obligatoria de secreto
- sin modo unsigned
