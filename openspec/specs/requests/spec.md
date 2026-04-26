# Spec: requests

## Proposito
Alinear la spec de `requests` con la ruta integrada final de 30 dias de MUBER 2.

## Rol de requests en el sistema
`requests` representa la intencion inicial del servicio.
Es el punto de entrada operativo para User y Assisted.

## Relacion con el piloto real
La spec de requests debe ayudar a que la ruta termine con:
- app funcional
- solicitudes reales creadas sin ambiguedad
- viajes reales disparados desde solicitudes reales
- primeros ingresos de dinero
- un piloto funcionando en la vida real

## Debe soportar
- creacion desde User
- creacion desde Assisted
- service_type claro
- assistance_type cuando corresponda
- inventory_method
- inventory_summary
- origin_text
- destination_text
- estimated_price_clp
- status

## Estados minimos
- pending
- accepted
- completed
- cancelled

## Regla de producto
Un request no es solo un formulario.
Es el inicio verificable del flujo real del servicio.

## Regla tecnica
Todo request debe poder:
- guardarse en Supabase
- convertirse en trip si Driver acepta
- alimentar metricas del piloto
- quedar visible para operacion en Notion

## Estado validado en TEST
En el flujo `User` ya quedo validado en `TEST` que `requests` guarda:
- `inventory_method`
- `inventory_summary`
- `estimated_price_clp`

## Prerrequisito antes de copiar a REAL
Antes de mover este flujo a `REAL`, debe verificarse:
- compatibilidad de schema en `requests`
- compatibilidad de policies
- deploy controlado de `create-user-request`
- verificacion real en Supabase despues del deploy

## Criterio de exito
La spec de requests esta bien alineada si permite iniciar viajes reales de forma clara, trazable y medible.
