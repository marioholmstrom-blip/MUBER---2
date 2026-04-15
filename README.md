# MUBER 2

MUBER 2 es una app de logística y mudanzas para piloto operativo en Valparaíso y Viña del Mar.

## Objetivo
Validar una operación mínima real de:
- solicitudes desde User y Assisted
- aceptación desde Driver
- creación de trips reales
- tracking por estados
- control operativo en Notion
- backend mínimo en Supabase

## Estado actual
- Expo + React Native funcionando
- User conectado a Supabase
- Assisted conectado a Supabase
- Driver conectado a Supabase
- requests reales
- trips reales
- tracking básico por estados
- chofer y vehículo simulados guardados en `trips`

## Estructura del repositorio
- `docs/` documentación técnica y operativa
- `ai-specs/` reglas, agentes, skills y estándares
- `openspec/` specs vivas y cambios formales
- `.cursor/`, `.claude/`, `.codex/` integración con copilotos

## Stack
- Expo
- React Native
- Supabase
- Notion
- GitHub

## Principios
1. Primero definir flujo y reglas.
2. Luego implementar.
3. Luego verificar.
4. Luego documentar.
5. Todo cambio importante debe quedar trazado.
