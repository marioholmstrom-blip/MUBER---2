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
```

## Regla principal de estas 72 horas

```text
No cambiar el stack.
Madurar el stack actual.
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
```

### Prioridad B — User

Objetivo:

```text
Que User pueda avanzar sin bloqueos visuales.
```

Tareas:

```text
- revisar scroll en inventario
- revisar resumen
- revisar pricing
- revisar solicitud
- revisar tracking
- revisar pago
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

### Prioridad E — EAS Build

Objetivo:

```text
Preparar app instalable para pruebas internas.
```

No ejecutar antes de cerrar QA básico móvil.

## Decisiones fijas

```text
Google Maps sí, pero como capa logística futura.
Azure no ahora.
Firebase no ahora.
Supabase se mantiene.
Expo se mantiene.
Notion se mantiene como backoffice.
GitHub se mantiene como trazabilidad.
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
```

## Documento relacionado

Ver también:

```text
docs/doc_ruta_72_horas_stack_muber.md
```
