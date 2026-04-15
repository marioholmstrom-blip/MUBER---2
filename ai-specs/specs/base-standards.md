# Base standards

## Objetivo

Definir las reglas base de trabajo para MUBER 2.

Estas reglas aplican a:
- estructura del repo
- desarrollo técnico
- documentación
- operación del piloto
- relación entre GitHub, Supabase y Notion

## Principios centrales

1. claridad antes que complejidad
2. cambios pequeños antes que cambios grandes
3. verificación real antes de cerrar una tarea
4. documentación viva, no decorativa
5. trazabilidad de cambios importantes
6. foco en piloto funcional, no en sobrearquitectura

## Regla de prioridad

Cuando haya dudas entre:
- algo más elegante técnicamente
- algo más útil para operar el piloto

se prioriza lo que permita operar, verificar y aprender más rápido.

## Regla de implementación

Todo cambio debe responder:
- qué problema resuelve
- qué flujo toca
- cómo se verifica
- qué documentación afecta

## Regla de estructura

La base de MUBER 2 debe mantenerse ordenada así:
- `README.md` como contexto general
- `docs/` como documentación técnica y operativa
- `ai-specs/` como reglas, skills y estándares
- `openspec/` como specs y cambios formales
- `Notion` como reflejo operativo y documental

## Regla de cierre

Nada se considera realmente cerrado si:
- no se probó
- no se puede verificar
- rompe otra parte del flujo
- no quedó trazado cuando correspondía