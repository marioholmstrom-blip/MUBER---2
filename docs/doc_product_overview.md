# Product overview

## Qué es MUBER 2

MUBER 2 es una plataforma de logística y mudanzas orientada a un piloto operativo real en Valparaíso y Viña del Mar.

El proyecto combina:

- app móvil en Expo y React Native
- backend mínimo real en Supabase
- estructura documental en GitHub
- operación, métricas y tablero en Notion

## Propósito del producto

Permitir una operación mínima real donde un usuario pueda:

- solicitar un viaje
- ver el estado del servicio
- recibir asignación de conductor
- seguir el avance del viaje

Y donde el equipo pueda:

- operar el piloto
- registrar viajes reales
- medir ingresos y estados
- mejorar el servicio con trazabilidad

## Servicios actuales

- Flete estándar
- Última milla
- Mudanza asistida

## Usuarios del sistema

### Usuario
Persona que solicita un viaje o traslado.

### Usuario asistido
Persona que requiere apoyo adicional para una mudanza o traslado.

### Driver
Conductor que carga solicitudes, acepta viajes y actualiza estados.

### Operación
Capa de seguimiento del piloto, métricas y control en Notion.

## Territorio inicial

- Valparaíso
- Viña del Mar

## Base técnica actual

- User conectado a Supabase
- Assisted conectado a Supabase
- Driver conectado a Supabase
- requests reales
- trips reales
- trip_status_history funcionando
- tracking visible
- conductor y vehículo simulado en `trips`

## Meta del piloto

Validar una secuencia mínima real:

solicitar → aceptar → ejecutar → finalizar → registrar → medir

## Relación con GitHub y Notion

### GitHub
Sirve como base técnica, documental y estructural del proyecto.

### Notion
Sirve como centro operativo, dashboard y seguimiento del piloto.