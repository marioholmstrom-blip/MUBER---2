# Frontend standards

## Objetivo

Definir reglas de trabajo para el frontend de MUBER 2.

## Stack actual

- Expo
- React Native

## Pantallas principales actuales

- Home
- User
- Assisted
- Driver

## Regla de diseño funcional

Cada pantalla debe tener una responsabilidad clara.

### Ejemplos
- User crea solicitud estándar
- Assisted crea solicitud asistida
- Driver acepta y actualiza viajes
- Home solo organiza entrada al sistema

## Regla de estados visibles

Los estados que vea el usuario deben corresponder a datos reales.

No se debe mostrar:
- mensajes ambiguos
- estados simulados que aparenten ser reales
- textos que no reflejen lo guardado en Supabase

## Regla de claridad visual

Cada pantalla debe ayudar a responder:
- dónde estoy
- qué estoy haciendo
- qué sigue
- cuál es el estado actual

## Regla de cambio en pantallas

Antes de cambiar una pantalla, revisar:
- qué tabla toca
- qué datos lee
- qué datos escribe
- cómo afecta User, Assisted o Driver

## Regla de simplicidad

En fase piloto:
- evitar componentes innecesarios
- evitar capas extras sin uso real
- evitar refactors grandes si el flujo ya funciona

## Regla de tracking

El tracking en frontend debe reflejar:
- conductor asignado
- chofer en camino
- chofer llegó
- viaje en curso
- viaje finalizado

## Regla final

El frontend de MUBER 2 debe privilegiar:
- claridad
- consistencia
- operación real
- facilidad de prueba