# CLAUDE.md

## Contexto
Claude debe usar este repositorio como fuente documental del proyecto MUBER 2.

## Prioridades
1. Respetar flujos existentes del producto.
2. No romper integración Expo + Supabase.
3. Documentar cambios relevantes.
4. Mantener coherencia con `docs/`, `ai-specs/` y `openspec/`.

## Al trabajar en una feature
- leer contexto en `docs/`
- revisar reglas en `ai-specs/specs/`
- revisar cambios abiertos en `openspec/changes/`
- proponer implementación simple y verificable
# CLAUDE.md

## Contexto de trabajo

Claude debe tratar este repositorio como la base estructural y documental de MUBER 2.

Este proyecto no es genérico.  
Es un sistema real orientado a:

- logística
- mudanzas
- tracking
- operación piloto
- documentación ordenada
- backend mínimo con Supabase
- control operativo en Notion

---

## Prioridades

1. Respetar la estructura del repositorio
2. Respetar la lógica de `ai-specs`, `docs` y `openspec`
3. Priorizar cambios pequeños y verificables
4. No romper integración existente con Supabase
5. Mantener el foco en el piloto operativo
6. Escribir documentación útil, no decorativa

---

## Antes de trabajar en una tarea

Claude debe revisar, en este orden:

1. `README.md`
2. `docs/`
3. `ai-specs/specs/`
4. `openspec/specs/`
5. `openspec/changes/` si hay un cambio abierto relacionado

---

## Cómo debe pensar los cambios

Todo cambio debe responder estas preguntas:

- ¿qué problema resuelve?
- ¿qué parte del flujo toca?
- ¿afecta User, Assisted o Driver?
- ¿afecta requests, trips o tracking?
- ¿cómo se verifica?
- ¿debe quedar documentado?

---

## Reglas de implementación

### Sí hacer
- proponer cambios concretos
- mantener consistencia con el flujo actual
- explicar con claridad
- documentar lo importante
- trabajar por etapas

### No hacer
- inventar arquitectura compleja sin necesidad
- cambiar nombres de tablas sin razón
- romper el piloto por “mejoras” innecesarias
- duplicar documentación
- introducir capas sin uso real

---

## Zonas principales del sistema

### Frontend
- Expo
- React Native
- pantallas User, Assisted y Driver

### Backend
- Supabase
- requests
- trips
- trip_status_history
- inventory
- payments

### Operación
- Notion
- dashboard
- métricas
- seguimiento del piloto

---

## Estructura que debe respetar

### `docs/`
Contexto técnico y operativo del proyecto.

### `ai-specs/`
Reglas, standards, skills y apoyo para ejecución.

### `openspec/`
Specs y cambios formales del sistema.

---

## Estilo esperado

Claude debe responder de forma:
- clara
- directa
- ordenada
- útil para ejecución real

Debe evitar:
- rodeos largos
- teoría innecesaria
- tecnicismo que no ayude
- estructura confusa

---

## Regla crítica

MUBER 2 no busca una arquitectura bonita en papel.  
Busca una base real para:

- construir
- documentar
- operar
- medir
- mejorar

Todo lo que Claude proponga debe servir a ese objetivo.