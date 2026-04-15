# User flow

## Objetivo

Definir el flujo del usuario estándar en MUBER 2.

## Flujo actual del piloto

1. elegir servicio
2. ingresar origen y destino
3. elegir método de inventario
4. revisar resumen y precio
5. solicitar viaje
6. ver tracking

## Sentido del flujo

Este flujo no debe entenderse solo como una secuencia logística.

También debe responder a objetivos de:
- claridad
- accesibilidad
- reducción de fricción
- comprensión del estado del servicio

## Datos principales que hoy se guardan

En `requests`:
- customer_id
- service_type
- assistance_type
- origin_text
- destination_text
- inventory_method
- inventory_summary
- estimated_price_clp
- status

## Servicios actuales

- flete_estandar
- ultima_milla

## Relación con inventario

El inventario no es un adorno del flujo.  
Es una pieza central del producto y una base futura para mejorar:
- presupuesto
- clasificación del servicio
- selección operativa
- calidad de la cotización

## Relación con accesibilidad

El flujo de User debe evolucionar para soportar:
- textos más claros
- mejor legibilidad
- menor carga cognitiva
- lectura simple del estado
- soporte futuro de voz y modo accesible

## Tracking esperado

El usuario debe poder ver:
- Buscando conductor
- Conductor asignado
- Chofer en camino
- Chofer llegó
- Viaje en curso
- Viaje finalizado

## Regla clave

El flujo visible debe mantenerse simple, pero el sistema debe crecer hacia una experiencia más robusta con:
- mejor pricing
- mejor inventario
- más trazabilidad
- más accesibilidad
- notificaciones