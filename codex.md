# codex.md

## Uso esperado
Codex debe trabajar con foco técnico y cambios mínimos seguros.

## Orden recomendado
1. leer `README.md`
2. leer `docs/`
3. leer reglas en `ai-specs/specs/`
4. revisar skill aplicable en `ai-specs/skills/`
5. revisar spec o change relevante en `openspec/`

## Regla crítica
No introducir complejidad innecesaria en MUBER 2. El repositorio está orientado a piloto funcional, no a sobrearquitectura.
# codex.md

## Propósito

Codex debe usar este repositorio como fuente estructural de trabajo para MUBER 2.

Su función principal es ayudar a ejecutar cambios técnicos concretos sin romper la lógica del proyecto.

---

## Orden de lectura recomendado

Antes de cambiar algo, Codex debe revisar:

1. `README.md`
2. `docs/`
3. `ai-specs/specs/`
4. `ai-specs/skills/`
5. `openspec/specs/`
6. `openspec/changes/` si existe un cambio abierto relacionado

---

## Principios de trabajo

1. Cambios pequeños primero
2. Verificación real antes de dar por cerrado
3. Coherencia entre frontend y backend
4. Nada de complejidad gratuita
5. Mantener foco en piloto funcional

---

## Qué debe entender del proyecto

MUBER 2 hoy gira en torno a estos dominios:

- requests
- trips
- tracking
- inventory
- payments
- operación piloto

Y a estos flujos:

- User crea solicitud
- Assisted crea solicitud
- Driver acepta solicitud
- se crea trip
- se actualiza trip_status
- el estado se refleja en pantallas

---

## Qué debe priorizar Codex

### Alta prioridad
- estabilidad del flujo
- consistencia de datos
- actualización correcta de estados
- claridad de cambios
- verificación en Supabase

### Media prioridad
- limpieza de nombres
- orden del repositorio
- documentación técnica ligada al cambio

### Baja prioridad
- refinamientos estéticos que no cambien la operación real

---

## Reglas para tocar código

### Si toca frontend
Debe revisar:
- qué pantalla afecta
- qué estado modifica
- qué tabla usa
- cómo se verá en User, Assisted o Driver

### Si toca Supabase
Debe revisar:
- tabla afectada
- campos afectados
- impacto en requests, trips o tracking
- si requiere migración
- cómo verificar el resultado

### Si toca documentación
Debe actualizar:
- `docs/`
- `ai-specs/specs/`
- `openspec/` si el cambio lo justifica

---

## Reglas para responder

Codex debe:
- ser preciso
- dar pasos accionables
- evitar ambigüedad
- distinguir entre lo que ya existe y lo que falta
- indicar cómo verificar

Codex no debe:
- asumir cosas no confirmadas
- prometer integraciones no hechas
- mezclar cambios múltiples sin control
- desordenar estructura del repo

---

## Relación con Notion

Aunque Codex trabaja principalmente sobre GitHub y código, debe recordar que MUBER 2 también vive en Notion.

Por eso, cuando un cambio afecte:
- operación
- métricas
- estructura documental
- plan del piloto

también debe considerarse su reflejo posterior en Notion.

---

## Regla final

Si una propuesta técnica no mejora al menos una de estas cuatro cosas, debe cuestionarse:

- operación real
- claridad del flujo
- consistencia de datos
- capacidad de verificación