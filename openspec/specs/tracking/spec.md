# Spec: tracking

## Propósito
Definir cómo el sistema muestra el estado real del viaje.

## Objetivo del piloto
El tracking debe ayudar a que el piloto funcione de verdad y genere confianza.

## Debe reflejar
- conductor asignado
- chofer en camino
- chofer llegó
- viaje en curso
- viaje finalizado

## Reglas
- la fuente de verdad es `trips.trip_status`
- cada cambio debe quedar en `trip_status_history`
- User y Assisted deben ver estados entendibles
- el tracking debe preparar integración futura con notificaciones

## Criterio de éxito
El tracking está bien si ayuda a operar viajes reales sin ambigüedad.
