# MUBER domain rules

## Objetivo

Definir las reglas de dominio propias de MUBER 2.

## Dominio actual

MUBER 2 opera en el espacio de:
- logística urbana
- flete
- última milla
- mudanza asistida

## Servicios actuales

- flete_estandar
- ultima_milla
- mudanza_asistida

## Regla de flujo base

El sistema debe permitir una secuencia mínima real:

solicitar → aceptar → ejecutar → finalizar → registrar → medir

## Regla de tracking

Todo viaje debe tener un estado claro para el usuario y para operación.

Los estados visibles deben ser entendibles.
Los estados técnicos deben quedar respaldados en Supabase.

## Regla de servicio asistido

El flujo asistido no es un sistema aparte.
Debe compartir base operativa con el flujo estándar, agregando solo la lógica necesaria de asistencia.

## Regla de operación

MUBER 2 no es solo una app.
También es un sistema operativo mínimo que requiere:
- trazabilidad
- medición
- control
- lectura ejecutiva en Notion

## Regla de piloto

Durante el piloto:
- se prioriza funcionamiento real
- se aceptan simulaciones útiles si ayudan a validar el flujo
- no se agrega complejidad si no aporta a operación o aprendizaje

## Regla de experiencia

El usuario debe poder entender:
- qué servicio pidió
- en qué estado está
- quién lo atenderá
- qué sigue

## Regla final

Toda decisión técnica debe respetar el dominio real de MUBER 2, no una plantilla genérica.