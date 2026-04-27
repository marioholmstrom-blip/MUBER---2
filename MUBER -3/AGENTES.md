# MUBER - reglas generales del proyecto

## Estructura del proyecto
- muber-2 = estructura, documentación, specs, openspec, reglas y contexto del sistema
- muber3 = frontend operativo, mobile-first, responsivo, conectado al backend

## Arquitectura obligatoria
- Supabase = backend real
- Notion = operación / backoffice
- GitHub = estructura, documentación y trazabilidad
- No usar Notion como backend
- No mover lógica de negocio importante al frontend

## Reglas de trabajo
- Antes de modificar código, revisar primero la estructura de muber-2
- Respetar las reglas y documentación existentes
- No inventar arquitectura nueva sin alinearla con MUBER 2
- No hacer refactor grande sin que se pida explícitamente
- No usar mocks como base principal del flujo
- Priorizar flujo real, Supabase real/test y validación operativa

## Entornos
- TEST para probar
- REAL solo con indicación explícita
- Nunca tocar REAL por defecto

## Criterios de UX
- Mobile-first
- Responsivo
- No asumir que la app es solo móvil, pero diseñar primero para celular

## Regla de producto
- Primero flujo funcional y validado
- Después orden técnico
- Después nuevas capas como inventario o scanner# MUBER 3 - reglas de frontend

## Rol de esta carpeta
Frontend operativo de MUBER.

## Reglas obligatorias
- Mobile-first
- Responsivo
- No romper conexión real con Supabase
- No usar mocks como base principal
- No hacer refactor grande si no fue pedido
- Antes de tocar arquitectura, revisar contexto en muber-2

## Supabase
- Usar TEST por defecto salvo instrucción explícita
- No tocar REAL sin autorización clara
- Mantener compatibilidad con tablas reales del proyecto

## Pantallas
- Home
- User
- Assisted
- Driver
- Choferes / inscripción
- Inventory cuando corresponda

## Regla de implementación
- Primero flujo funcional
- Luego mini-refactor
- Luego nuevas capas

## Regla actual
- La inscripción de choferes debe seguir conectada al backend real de prueba
- Driver no debe desacoplarse de Supabase con 
# AGENTS.md

## Propósito

Este archivo define las reglas y los agentes conceptuales principales de MUBER 2.

No son personajes decorativos.
Son roles de trabajo para pensar, construir, revisar y ordenar el proyecto.

Su función es ayudar a que GitHub, Notion, la app y Supabase trabajen bajo una misma lógica.

## Estructura del proyecto

- `muber-2` = estructura, documentación, specs, openspec, reglas y contexto del sistema
- `muber3` = frontend operativo, mobile-first, responsivo y conectado al backend

## Arquitectura obligatoria

- Supabase = backend real
- Notion = operación / backoffice
- GitHub = estructura, documentación y trazabilidad
- No usar Notion como backend
- No mover lógica de negocio importante al frontend

## Reglas generales para todos los agentes

1. Trabajar sobre la estructura real de MUBER 2.
2. Respetar la documentación existente en `docs/`.
3. Respetar reglas existentes en `ai-specs/`.
4. No inventar arquitectura innecesaria.
5. Priorizar claridad, operación real y trazabilidad.
6. Mantener coherencia con el piloto operativo.
7. Todo cambio relevante debe poder verificarse.
8. No hacer refactor grande sin que se pida explícitamente.
9. No usar mocks como base principal del flujo.
10. Priorizar flujo real, Supabase real/test y validación operativa.

## Entornos

- TEST para probar
- REAL solo con indicación explícita
- Nunca tocar REAL por defecto

## Criterios de UX

- Mobile-first
- Responsivo
- No asumir que la app es solo móvil, pero diseñar primero para celular

## Regla de producto

- Primero flujo funcional y validado
- Después orden técnico
- Después nuevas capas como inventario o scanner

## Agentes base de MUBER 2

### product-strategist

Define foco, alcance, prioridades y criterio de éxito del producto.

Preguntas que debe responder:
- ¿esto acerca al piloto?
- ¿esto mejora la propuesta de valor?
- ¿esto ayuda a operar mejor?
- ¿esto realmente importa ahora?

Se enfoca en:
- visión de producto
- alcance del MVP
- orden de prioridades
- decisiones estratégicas
- utilidad real del flujo

### ux-flow-analyst

Revisa pasos, claridad de pantalla, fricción, mensajes y comprensión del flujo.

Se enfoca en:
- pasos de User
- pasos de Assisted
- pasos de Driver
- textos visibles
- estados de tracking
- coherencia de la experiencia

Su criterio:
- el usuario debe entender qué está pasando
- el usuario debe entender qué sigue
- el usuario debe entender qué estado tiene su viaje

### expo-react-builder

Implementa pantallas, lógica visual y flujos de app en Expo / React Native.

Se enfoca en:
- pantallas
- navegación
- estados locales
- lectura y escritura hacia Supabase
- consistencia entre UI y backend

Regla:
- no mezclar complejidad innecesaria en una etapa piloto

### supabase-architect

Diseña y mantiene la estructura de datos de MUBER 2.

Se enfoca en:
- requests
- trips
- trip_status_history
- payments
- inventory
- relaciones futuras con drivers y vehicles reales

Regla:
- todo dato importante debe quedar verificable en base de datos

### piloto-operations-analyst

Traduce el producto y el backend a operación real del piloto.

Se enfoca en:
- control del piloto
- métricas
- incidencias
- dashboard operativo
- checklist de ejecución
- relación GitHub + Notion

Regla:
- el sistema debe servir para operar, no solo para verse bien

### documentation-keeper

Asegura que la documentación técnica y operativa no se rompa ni se desordene.

Se enfoca en:
- `README.md`
- `docs/`
- `ai-specs/specs/`
- `openspec/specs/`
- `openspec/changes/`

Regla:
- las decisiones no deben quedar solo en conversación
- deben quedar registradas

## Relación con Notion

Estos agentes también deben reflejarse conceptualmente en Notion, especialmente en:

- documentación base
- dashboard operativo
- plan del piloto
- tareas por fase
- criterios de verificación

## Criterio final

Si un agente propone algo que:
- complica sin aportar
- rompe el flujo real
- se aleja del piloto
- duplica estructura
- no puede verificarse

entonces esa propuesta no sirve para MUBER 2.
