# Onboarding MUBER — Ruta operativa 72 horas

## Propósito

Este documento resume la ruta inmediata de onboarding operativo para cualquier asistente, agente, colaborador o sesión de trabajo que entre al Proyecto MUBER durante las próximas 72 horas.

Su objetivo es evitar desvíos, cambios de stack innecesarios y pérdida de contexto.

## Contexto del proyecto

MUBER está en fase de preparación de piloto real/comercial controlado.

No es una idea inicial ni una maqueta aislada.

El proyecto ya cuenta con:

```text
- frontend MUBER 3 en Expo / React Native
- backend real en Supabase TEST
- documentación y reglas en GitHub MUBER 2
- Notion como backoffice
- Panel Director
- flujo User
- flujo Assisted
- flujo Driver
- solicitudes y viajes en Supabase
- necesidad de presentar MUBER ante Notion mediante landing o página web
```

## Regla principal de estas 72 horas

```text
No cambiar el stack.
Madurar el stack actual.
Cerrar bugs críticos antes de piloto.
Preparar una landing clara para presentar MUBER ante Notion.
```

## Stack aprobado

```text
Expo / React Native = app mobile-first
Supabase = backend real
Supabase Auth = autenticación
Supabase Postgres = base de datos
Supabase Realtime = eventos en tiempo real
Supabase Edge Functions = lógica sensible del servidor
GitHub = estructura y trazabilidad
Notion = backoffice humano
Google Maps Platform = capa logística próxima
WebPay / Transbank = pagos
Windsurf + Codex + GPT = asistencia de desarrollo
```

## Stack que NO se debe introducir ahora

No introducir durante esta ventana:

```text
- Azure como migración principal
- Firebase como reemplazo de Supabase
- backend propio nuevo
- Flutter
- app nativa nueva
- Notion como backend
- mock server como base principal
```

## Repositorios

### muber-2

Función:

```text
documentación, reglas, onboarding, OpenSpec, AI specs, seguridad, ruta 30 días, ruta 72 horas y trazabilidad estratégica.
```

### muber-3-frontend

Función:

```text
frontend operativo Expo / React Native.
```

Incluye:

```text
- App.js
- HomeScreen
- UserScreen
- AssistedScreen
- DriverScreen
- AuthScreen
- DirectorPanel
- AdminDashboard
- api
- lib
- components
```

## Orden de trabajo obligatorio

### 1. Mobile-first

Antes de mejorar web, validar móvil.

Prioridad:

```text
- login
- sesión persistente
- navegación atrás Android
- Panel Director
- User
- Driver
- scroll
- botones táctiles
```

### 2. Supabase TEST

Toda prueba debe ir a TEST por defecto.

No tocar REAL salvo autorización explícita.

### 3. GitHub

Cada avance relevante debe quedar en commit.

### 4. Notion

Notion solo refleja operación o sirve como backoffice.

No debe decidir estados reales del sistema.

### 5. Landing Notion

Durante esta ventana se debe preparar una landing o página web corta para presentar MUBER ante el equipo/personas de Notion.

Objetivo:

```text
Conseguir una extensión de recursos de Notion por 3 meses mostrando que MUBER es un proyecto real, avanzado y con uso operativo de Notion como backoffice.
```

Regla:

```text
La landing no reemplaza la app.
La landing no reemplaza Supabase.
La landing solo presenta el proyecto, su avance, su impacto y por qué Notion es estratégico para el backoffice de MUBER.
```

## Prioridades inmediatas

### Prioridad A — Driver

Objetivo:

```text
Que el flujo Driver sea usable en móvil y web para pruebas internas.
```

Tareas:

```text
- ordenar layout Driver
- mantener solicitudes entrantes visibles
- silenciar tracking visual cuando corresponda
- mantener tracking interno si se necesita
- asegurar que admin/director pueda probar Driver en TEST sin mezclar identidades
- definir tarjeta futura: Viaje activo actual
- corregir continuidad después de aceptar solicitud
```

### Prioridad B — User

Objetivo:

```text
Que User pueda avanzar sin bloqueos visuales y sin crear solicitudes con precio cero.
```

Tareas:

```text
- revisar scroll en inventario
- revisar resumen
- revisar pricing
- revisar solicitud
- revisar tracking
- revisar pago
- bloquear estimated_price_clp = 0 en solicitudes nuevas
```

### Prioridad C — Panel Director

Objetivo:

```text
Que el Director pueda entrar a todos los flujos desde una sola sesión admin.
```

Tareas:

```text
- Dashboard Director
- User
- Assisted
- Driver
- Home
- cerrar sesión
```

### Prioridad D — Seguridad Supabase

Objetivo:

```text
Que el piloto no dependa de permisos inseguros.
```

Tareas:

```text
- revisar RLS
- revisar roles
- revisar actions sensibles
- documentar qué debe pasar a Edge Functions
```

### Prioridad E — Landing / página web para Notion

Objetivo:

```text
Crear una landing o página web de presentación para que las personas de Notion puedan entender MUBER rápido y evaluar una extensión de recursos por 3 meses.
```

Uso esperado:

```text
- presentar el proyecto MUBER de forma profesional
- mostrar avance real del producto
- explicar el rol de Notion como backoffice, no backend
- mostrar por qué MUBER necesita 3 meses adicionales de recursos Notion
- demostrar impacto social, territorial, operativo y tecnológico
- apoyar gestiones de colaboración, crédito, extensión o patrocinio
```

Contenido mínimo de la landing:

```text
1. Hero claro:
   MUBER — fletes y mudanzas locales con precio claro, chofer validado y seguimiento del servicio.

2. Problema:
   mudanzas/fletes informales, poca trazabilidad, estrés, falta de confianza, baja accesibilidad.

3. Solución:
   plataforma mobile-first con User, Assisted, Driver y Panel Director.

4. Estado actual:
   app Expo / React Native, Supabase TEST, flujos User/Assisted/Driver, Panel Director, pagos TEST, tracking y operación documentada.

5. Rol de Notion:
   backoffice operativo, seguimiento, documentación, postulaciones, tablero de piloto, coordinación y lectura ejecutiva.

6. Por qué pedimos extensión de 3 meses:
   cierre pre-piloto, investigación de usuarios/choferes, campaña territorial, QA, operación controlada y documentación viva.

7. Impacto:
   accesibilidad, adultos mayores, personas con movilidad reducida, estudiantes, juntas de vecinos, comercios locales y choferes.

8. Evidencia:
   investigación previa, cuestionarios, benchmark, journey map, repos GitHub, backend real y avances del frontend.

9. Roadmap 72 horas / 30 días:
   estabilización de bugs, investigación, QA, EAS Build, Google Maps futuro y piloto controlado.

10. CTA:
   Solicitud de extensión de recursos Notion por 3 meses para preparar y operar el piloto MUBER.
```

Criterios de la landing:

```text
- simple
- mobile-first
- clara para personas externas
- sin datos sensibles
- sin claves
- sin exponer URLs privadas
- sin prometer GPS completo si todavía no está cerrado
- sin vender como producto final si aún está en pre-piloto
- explicar TEST vs piloto real de forma limpia
```

Entregables sugeridos:

```text
- copy completo de landing
- estructura visual por secciones
- versión HTML o React simple si se decide implementarla
- assets mínimos permitidos
- CTA para Notion
- documento de respaldo en GitHub MUBER 2
```

### Prioridad F — EAS Build

Objetivo:

```text
Preparar app instalable para pruebas internas.
```

No ejecutar antes de cerrar QA básico móvil y bugs críticos de continuidad/precio.

## Decisiones fijas

```text
Google Maps sí, pero como capa logística futura.
Azure no ahora.
Firebase no ahora.
Supabase se mantiene.
Expo se mantiene.
Notion se mantiene como backoffice.
GitHub se mantiene como trazabilidad.
Landing Notion sí entra en las próximas 72 horas como pieza de presentación, no como backend ni reemplazo de la app.
```

## Criterio para aceptar cambios

Un cambio es aceptable si:

```text
- funciona en móvil
- no rompe Supabase TEST
- no toca REAL
- no expone secretos
- no usa Notion como backend
- no reemplaza stack sin autorización
- queda versionado en GitHub
- ayuda a cerrar piloto, investigación o presentación Notion
```

## Criterio para aceptar la landing Notion

La landing se considera lista si:

```text
- explica MUBER en menos de 2 minutos
- muestra el estado real sin exagerar
- diferencia claramente Supabase backend real y Notion backoffice
- justifica la extensión de recursos por 3 meses
- muestra impacto local/social/comercial
- no contiene secretos ni datos sensibles
- puede compartirse con personas externas a MUBER
```

## Resumen para agentes

Si eres un agente trabajando en MUBER:

```text
No propongas migraciones.
No reemplaces el backend.
No uses mocks como base.
No toques producción.
No subas secretos.
Prioriza móvil.
Lee AGENTS.md.
Respeta Supabase como backend real.
Usa Notion solo como backoffice.
Deja trazabilidad en GitHub.
Si trabajas la landing Notion, no inventes métricas ni prometas funciones no validadas.
```

## Documento relacionado

Ver también:

```text
docs/doc_ruta_72_horas_stack_muber.md
docs/research/index_research_pre_piloto_muber.md
docs/research/analisis_cuestionario_usuarios_vs_muber_hoy.md
```
