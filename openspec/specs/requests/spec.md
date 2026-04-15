# Spec: requests

## Propósito
Alinear la spec de `requests` con la ruta integrada final de 30 días de MUBER 2.

## Rol de requests en el sistema
`requests` representa la intención inicial del servicio.
Es el punto de entrada operativo para User y Assisted.

## Relación con el piloto real
La spec de requests debe ayudar a que la ruta termine con:
- app funcional
- solicitudes reales creadas sin ambigüedad
- viajes reales disparados desde solicitudes reales
- primeros ingresos de dinero
- un piloto funcionando en la vida real

## Debe soportar
- creación desde User
- creación desde Assisted
- service_type claro
- assistance_type cuando corresponda
- inventory_method
- origin_text
- destination_text
- estimated_price_clp
- status

## Estados mínimos
- pending
- accepted
- completed
- cancelled

## Regla de producto
Un request no es solo un formulario.
Es el inicio verificable del flujo real del servicio.

## Regla técnica
Todo request debe poder:
- guardarse en Supabase
- convertirse en trip si Driver acepta
- alimentar métricas del piloto
- quedar visible para operación en Notion

## Criterio de éxito
La spec de requests está bien alineada si permite iniciar viajes reales de forma clara, trazable y medible.
