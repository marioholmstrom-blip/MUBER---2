# Reglas operativas MUBER

## Propósito
Este documento es la fuente maestra de verdad para reglas operativas, arquitectura, seguridad y trabajo con IA en MUBER.

Si existe conflicto entre este archivo y cualquier resumen corto, prevalece este documento.

## Estructura del proyecto
- `MUBER - 2` contiene contexto, documentación, specs, openspec y reglas del sistema.
- `MUBER - 3` contiene el frontend operativo mobile-first conectado al backend.
- `SQL` contiene scripts y pruebas SQL de apoyo.

## Arquitectura obligatoria
- Supabase es el backend operativo real.
- Notion se usa para operación humana, seguimiento, dashboards y backoffice.
- GitHub se usa para estructura, documentación, control de cambios y trazabilidad.
- No usar Notion como backend.
- No mover lógica crítica de negocio al frontend sin una razón clara y validada y autorizacion del director.

## Dominio MUBER
MUBER opera en el espacio de:
- logística urbana
- flete
- última milla
- mudanza asistida

Servicios actuales:
- `flete_estandar`
- `ultima_milla`
- `mudanza_asistida`

Regla de flujo base:
solicitar -> aceptar -> ejecutar -> pago -> finalizar -> registrar -> medir ->

## Seguridad
- La IA acelera trabajo, pero no reemplaza revisión humana.
- Nunca exponer secretos, tokens, claves o credenciales en código, commits, prompts, tickets o documentación pública.
- Toda entrada del usuario debe validarse antes de guardarse o procesarse.
- No mostrar errores técnicos completos al usuario final.
- Toda acción sensible requiere confirmación explícita antes de ejecutarse.
- Nada se publica sin una revisión mínima de seguridad.

## TEST vs REAL
- TEST es el entorno por defecto para pruebas.
- REAL solo se toca con indicación explícita.
- Nunca tocar REAL por defecto.
- TEST y REAL deben mantenerse separados en datos, credenciales y validación.
- Primero se prueba en TEST y después, si corresponde, en REAL.
- No usar mocks como base principal del flujo.

## Rol de Supabase
- Supabase es la fuente de verdad del backend.
- Debe respaldar solicitudes, viajes, estados, historial, pagos e inventario.
- Toda escritura importante debe poder verificarse en tablas reales.
- Si la interfaz dice algo distinto a la base, la referencia es Supabase.
- Todo cambio estructural debe dejar claro qué flujo toca y cómo se verifica.
- Los cambios deben evitar romper User, Assisted, Driver y tracking existente.

## Rol de Notion
- Notion se usa para operación humana, seguimiento, dashboards, documentación operativa y lectura ejecutiva.
- Notion no es backend.
- Notion no reemplaza la trazabilidad técnica ni la verdad de datos del sistema.
- Debe reflejar el estado operativo del proyecto, no crear una lógica paralela al producto.

## Rol de GitHub
- GitHub es el repositorio principal de estructura, documentación y trazabilidad.
- Las decisiones relevantes deben quedar registradas en código y documentación.
- Las decisiones no deben quedar solo en conversaciones.
- Los cambios relevantes deben ser verificables.

## Reglas de trabajo para IA
- Revisar primero la estructura real del repositorio antes de proponer cambios.
- Respetar la documentación existente y esta fuente maestra.
- No inventar arquitectura innecesaria.
- No hacer refactor grande sin que se pida explícitamente.
- Priorizar flujo real, validación operativa y trazabilidad.
- Marcar riesgos, supuestos y validaciones necesarias antes de tocar zonas sensibles.
- Repetir una cabecera corta de contexto en tareas sensibles.
- Si una acción puede tocar producción, pedir confirmación explícita antes de ejecutar.

## UX y producto
- Mobile-first.
- Responsivo.
- No asumir que la app es solo móvil, pero diseñar primero para celular.
- Primero flujo funcional y validado.
- Después orden técnico y frontend.
- Después nuevas capas o expansión.

## Criterio final
Si una propuesta:
- complica sin aportar
- rompe el flujo real
- duplica estructura
- se aleja del piloto
- no puede verificarse

entonces no sirve para MUBER.
