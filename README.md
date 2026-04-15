# .cursor

Punto de integración para Cursor. Debe reflejar agentes, commands y skills del sistema base.
# MUBER 2

MUBER 2 es una app de logística y mudanzas orientada a un piloto operativo real en Valparaíso y Viña del Mar.

## Objetivo general

Construir una base sólida de producto, documentación, operación y desarrollo técnico para MUBER 2, inspirada en:

- manual-SDD
- ai-specs
- OpenSpec

Esta base debe vivir en dos lugares complementarios:

- **GitHub** como repositorio técnico, documental y estructural
- **Notion** como centro operativo, tablero documental y control del piloto

## Objetivo del producto

Validar una operación mínima real que permita:

- crear solicitudes desde User
- crear solicitudes desde Assisted
- aceptar solicitudes desde Driver
- crear trips reales
- actualizar estados del viaje
- reflejar tracking en pantallas
- registrar operación y métricas del piloto

## Estado actual del proyecto

Actualmente MUBER 2 ya cuenta con:

- Home funcional
- User conectado a Supabase
- Assisted conectado a Supabase
- Driver conectado a Supabase
- requests reales
- trips reales
- trip_status_history funcionando
- tracking visible en User y Assisted
- chofer y vehículo simulado visibles
- chofer y vehículo simulado guardados en trips
- estructura base del repositorio ya normalizada en GitHub

## Estructura base del repositorio

### `ai-specs/`
Contiene reglas, agentes, comandos, skills y estándares del proyecto.

### `docs/`
Contiene documentación técnica y operativa de MUBER 2.

### `openspec/`
Contiene specs vivas y cambios formales del proyecto.

### Archivos raíz
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `codex.md`

Estos archivos sirven como punto de entrada para copilotos, documentación rápida y contexto general del sistema.

## Relación GitHub + Notion

### GitHub
Se usa para:
- estructura técnica
- documentación versionada
- reglas del proyecto
- specs y cambios
- referencia para copilotos
- evolución ordenada del sistema

### Notion
Se usa para:
- centro de operaciones
- dashboard del piloto
- métricas
- visión ejecutiva
- seguimiento diario
- documentación de uso interno
- coordinación del proyecto

## Stack actual

- Expo
- React Native
- Supabase
- GitHub
- Notion

## Dominios principales del proyecto

- requests
- trips
- tracking
- inventory
- payments
- piloto operativo
- métricas e ingresos

## Flujo funcional actual

1. User o Assisted crea una solicitud
2. La solicitud se guarda en `requests`
3. Driver carga solicitudes pendientes
4. Driver acepta una solicitud
5. Se crea un `trip`
6. Se registra historial en `trip_status_history`
7. User y Assisted muestran conductor asignado
8. Driver puede avanzar el `trip_status`
9. El tracking se refleja en pantallas

## Principios de trabajo

1. Primero definir estructura y reglas
2. Luego implementar cambios pequeños
3. Luego verificar en la app y en Supabase
4. Luego documentar
5. Todo cambio importante debe quedar trazado
6. El piloto vale más que la sobreingeniería
7. Claridad y operación real primero

## Próximas líneas de trabajo

- completar flujo real de estados del viaje
- consolidar specs vivas en openspec
- adaptar skills a tareas reales de MUBER
- reflejar esta misma arquitectura en Notion
- preparar operación del piloto de 30 días

## Criterio de éxito

La base estará bien construida si permite:

- desarrollar sin perder orden
- documentar sin duplicación
- operar el piloto con claridad
- conectar producto, código, datos y operación en un solo sistema