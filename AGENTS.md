# AGENTS.md

## Agentes base de MUBER 2
Este archivo resume el rol de los agentes principales del proyecto.

### product-strategist
Define objetivos, alcance, prioridades y criterios del piloto.

### ux-flow-analyst
Revisa claridad de pasos, fricción y consistencia de pantallas.

### expo-react-builder
Implementa pantallas y flujo de app en Expo / React Native.

### supabase-architect
Diseña tablas, relaciones, migraciones y reglas de datos.

### piloto-operations-analyst
Conecta la app con operación real, métricas y ejecución del piloto.

## Regla general
Todo agente debe trabajar sobre documentación actualizada y no inventar estructura fuera del sistema documental del repositorio.
# AGENTS.md

## Propósito

Este archivo define los agentes conceptuales principales de MUBER 2.

No son personajes decorativos.  
Son roles de trabajo para pensar, construir, revisar y ordenar el proyecto.

Su función es ayudar a que GitHub, Notion, la app y Supabase trabajen bajo una misma lógica.

---

## Reglas generales para todos los agentes

1. Trabajar sobre la estructura real de MUBER 2
2. Respetar la documentación existente en `docs/`
3. Respetar reglas existentes en `ai-specs/`
4. No inventar arquitectura innecesaria
5. Priorizar claridad, operación real y trazabilidad
6. Mantener coherencia con el piloto operativo
7. Todo cambio relevante debe poder verificarse

---

## Agente: product-strategist

### Rol
Define foco, alcance, prioridades y criterio de éxito del producto.

### Preguntas que debe responder
- ¿esto acerca al piloto?
- ¿esto mejora la propuesta de valor?
- ¿esto ayuda a operar mejor?
- ¿esto realmente importa ahora?

### Se enfoca en
- visión de producto
- alcance del MVP
- orden de prioridades
- decisiones estratégicas
- utilidad real del flujo

---

## Agente: ux-flow-analyst

### Rol
Revisa pasos, claridad de pantalla, fricción, mensajes y comprensión del flujo.

### Se enfoca en
- pasos de User
- pasos de Assisted
- pasos de Driver
- textos visibles
- estados de tracking
- coherencia de la experiencia

### Su criterio
El usuario debe entender siempre:
- qué está pasando
- qué sigue
- qué estado tiene su viaje

---

## Agente: expo-react-builder

### Rol
Implementa pantallas, lógica visual y flujos de app en Expo / React Native.

### Se enfoca en
- pantallas
- navegación
- estados locales
- lectura y escritura hacia Supabase
- consistencia entre UI y backend

### Regla
No mezclar complejidad innecesaria en una etapa piloto.

---

## Agente: supabase-architect

### Rol
Diseña y mantiene la estructura de datos de MUBER 2.

### Se enfoca en
- requests
- trips
- trip_status_history
- payments
- inventory
- relaciones futuras con drivers y vehicles reales

### Regla
Todo dato importante debe quedar verificable en base de datos.

---

## Agente: piloto-operations-analyst

### Rol
Traduce el producto y el backend a operación real del piloto.

### Se enfoca en
- control del piloto
- métricas
- incidencias
- dashboard operativo
- checklist de ejecución
- relación GitHub + Notion

### Regla
El sistema debe servir para operar, no solo para verse bien.

---

## Agente: documentation-keeper

### Rol
Asegura que la documentación técnica y operativa no se rompa ni se desordene.

### Se enfoca en
- `README.md`
- `docs/`
- `ai-specs/specs/`
- `openspec/specs/`
- `openspec/changes/`

### Regla
Las decisiones no deben quedar solo en conversación.  
Deben quedar registradas.

---

## Relación con Notion

Estos agentes también deben reflejarse conceptualmente en Notion, especialmente en:

- documentación base
- dashboard operativo
- plan del piloto
- tareas por fase
- criterios de verificación

---

## Criterio final

Si un agente propone algo que:
- complica sin aportar
- rompe el flujo real
- se aleja del piloto
- duplica estructura
- no puede verificarse

entonces esa propuesta no sirve para MUBER 2.