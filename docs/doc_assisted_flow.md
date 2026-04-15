# Assisted flow

## Objetivo

Definir el flujo del servicio asistido en MUBER 2.

## Sentido del flujo asistido

Assisted no es una variación menor de User.  
Representa una capa estratégica del producto porque acerca MUBER a usuarios que necesitan:
- más apoyo
- más claridad
- más confianza
- una experiencia menos compleja

## Flujo actual del piloto

1. elegir tipo de ayuda
2. ingresar origen y destino
3. elegir método de inventario
4. revisar resumen y precio
5. solicitar viaje
6. ver tracking

## Tipos actuales de ayuda

- adulto_mayor
- movilidad
- carga_delicada

## Datos principales que hoy se guardan

En `requests`:
- customer_id
- service_type = mudanza_asistida
- assistance_type
- origin_text
- destination_text
- inventory_method
- inventory_summary
- estimated_price_clp
- status

## Relación con accesibilidad

Este flujo debe transformarse en una de las principales expresiones del carácter inclusivo de MUBER 2.

Eso implica evolucionar hacia:
- instrucciones más claras
- legibilidad alta
- contraste
- soporte futuro de voz
- menor fricción
- acompañamiento visual más evidente

## Relación con el MVP

El flujo Assisted ayuda a conectar el producto con la visión de:
- accesibilidad universal
- diseño usable para adultos mayores
- soporte para necesidades diversas
- experiencia más humana

## Tracking esperado

Assisted debe poder ver:
- Buscando conductor
- Conductor asignado
- Chofer en camino
- Chofer llegó
- Viaje en curso
- Viaje finalizado

## Regla clave

El flujo asistido debe compartir la base operativa de MUBER 2, pero también debe funcionar como laboratorio real de la capa inclusiva del producto.