# Ruta MUBER 72 horas — Stack y prioridades técnicas

## Estado

Documento operativo para las próximas 72 horas del Proyecto MUBER.

Este documento fija una decisión de stack y una ruta de trabajo inmediata para avanzar hacia el primer piloto real/comercial controlado, sin romper la arquitectura actual.

## Decisión principal

Durante las próximas 72 horas, MUBER no cambiará de stack principal.

El stack aprobado para continuar es:

```text
Frontend móvil: Expo + React Native
Backend real: Supabase
Base de datos: Supabase Postgres
Auth: Supabase Auth
Realtime: Supabase Realtime
Funciones sensibles: Supabase Edge Functions
Backoffice: Notion
Trazabilidad: GitHub
Mapas futuros: Google Maps Platform
Pagos: WebPay / Transbank
Asistencia técnica: Windsurf + Codex + GPT
```

## Regla de arquitectura

```text
Supabase ejecuta.
Notion opera.
GitHub documenta y da trazabilidad.
Expo / React Native entrega la experiencia mobile-first.
Google Maps entra como capa logística, no como reemplazo del backend.
```

## Qué NO se hará en estas 72 horas

No se hará:

```text
- migración a Azure
- migración a Firebase
- migración a Google Cloud completo
- backend propio nuevo en Node/Laravel/Django
- cambio a Flutter
- cambio a app nativa Android/iOS
- uso de Notion como backend
- tocar REAL sin autorización explícita
- subir secretos a GitHub
- usar mocks como base principal
```

## Qué SÍ se hará en estas 72 horas

La ruta es madurar el stack actual, no reemplazarlo.

Prioridades:

```text
1. estabilizar MUBER 3 mobile-first
2. corregir navegación, scroll, Driver y Panel Director
3. mantener Supabase TEST como backend real
4. ordenar GitHub con repos separados
5. preparar transición a EAS Build
6. revisar RLS y permisos Supabase
7. mover acciones sensibles hacia Edge Functions
8. preparar Google Maps como capa logística futura
```

## Repositorios

### muber-2

Uso:

```text
- documentación
- reglas operativas
- onboarding
- OpenSpec
- AI specs
- ruta 30 días
- ruta 72 horas
- seguridad
- decisiones estratégicas
```

### muber-3-frontend

Uso:

```text
- app Expo / React Native
- Home
- User
- Assisted
- Driver
- AuthScreen
- DirectorPanel
- AdminDashboard
- APIs frontend
- conexión a Supabase TEST
```

## Decisión sobre Expo / React Native

Se mantiene Expo / React Native.

Motivo:

```text
MUBER es mobile-first, necesita iteración rápida, pruebas en celular, compatibilidad web para QA, y una ruta clara hacia builds instalables.
```

No se cambia a Flutter ni nativo durante esta etapa.

## Decisión sobre Supabase

Se mantiene Supabase como backend real.

Motivo:

```text
MUBER ya opera con entidades relacionales reales:
profiles
requests
trips
drivers
vehicles
payments
inventory_items
trip_status_history
driver_applications
```

Postgres/Supabase es adecuado para estas relaciones.

## Decisión sobre Notion

Notion se mantiene como backoffice.

No será backend.

Uso correcto:

```text
- control operativo
- seguimiento humano
- tablero ejecutivo
- revisión de postulaciones
- documentación del piloto
- lectura y coordinación
```

No debe decidir estados reales de viajes ni pagos.

## Decisión sobre GitHub

GitHub se mantiene como trazabilidad estructural.

Regla:

```text
Todo cambio relevante debe quedar respaldado por commit, documento, issue, spec o SQL versionado.
```

## Decisión sobre Google Maps

Google Maps Platform será la capa recomendada para:

```text
- autocompletado de direcciones
- geocodificación
- rutas
- distancia
- tiempo estimado
- cálculo logístico
- apoyo al pricing
- tracking visual futuro
```

No se implementa como migración de backend.

## Decisión sobre Azure

Azure queda como alternativa futura, no como prioridad de 72 horas.

Puede evaluarse más adelante para:

```text
- Power BI
- clientes institucionales
- reportes empresariales
- ecosistema Microsoft
- residencia o integración corporativa
```

## Ruta técnica de 72 horas

### Bloque 1 — Estabilización mobile-first

Objetivo:

```text
Que MUBER 3 funcione correctamente en celular antes que web.
```

Acciones:

```text
- probar login admin
- probar Panel Director
- probar User
- probar Assisted
- probar Driver
- corregir botón atrás Android
- corregir scroll en User e Inventario
- corregir layout Driver
- mantener sesión activa en móvil
```

### Bloque 2 — Driver y operación

Objetivo:

```text
Que el Director/Admin pueda probar Driver sin mezclar identidades.
```

Acciones:

```text
- usar profile_id, no email, para drivers
- evitar usar driver de otro usuario
- permitir driver TEST para admin solo en TEST
- validar online/offline
- validar solicitudes entrantes/pendientes
- definir dónde quedará Viaje activo actual
```

### Bloque 3 — Seguridad Supabase

Objetivo:

```text
Revisar que el piloto no dependa de permisos abiertos.
```

Acciones:

```text
- revisar RLS por tabla
- revisar policies de profiles
- revisar policies de requests
- revisar policies de trips
- revisar policies de drivers
- revisar policies de payments
- revisar policies de driver_applications
- bloquear acciones sensibles fuera de TEST
```

### Bloque 4 — Edge Functions

Objetivo:

```text
Mover acciones sensibles fuera del frontend cuando corresponda.
```

Acciones candidatas:

```text
- aprobar chofer
- rechazar chofer
- crear vehicle
- editar comisión
- registrar pago
- confirmar WebPay
- sincronizar Notion
```

### Bloque 5 — Build instalable

Objetivo:

```text
Preparar MUBER para probar fuera de Expo Go.
```

Acciones:

```text
- preparar EAS Build
- revisar app.json
- revisar permisos de ubicación
- generar build interno Android cuando el flujo esté estable
```

## Orden de ejecución recomendado

```text
1. cerrar QA visual y funcional de Driver
2. cerrar QA de User e Inventario
3. confirmar persistencia de sesión móvil
4. confirmar Panel Director como centro de pruebas
5. revisar RLS mínima para piloto TEST
6. listar acciones que deben pasar a Edge Functions
7. preparar EAS Build
8. documentar resultado y próximos bloqueos
```

## Criterio de avance

Una tarea se considera lista solo si:

```text
- compila
- funciona en móvil
- respeta TEST por defecto
- no expone secretos
- no rompe Supabase
- no usa Notion como backend
- queda respaldada en GitHub
- tiene resultado verificable
```

## Resultado esperado al final de 72 horas

Al terminar esta ruta, MUBER debería tener:

```text
- frontend MUBER 3 ordenado en GitHub
- Driver usable para pruebas internas
- Panel Director funcional como centro de control TEST
- User con scroll y flujo navegable
- sesión persistente en móvil
- roadmap claro para EAS Build
- lista clara de acciones sensibles para Edge Functions
- ruta Google Maps definida para la capa logística
```

## Decisión final

No se cambia el stack.

Se madura el stack actual.

```text
Mantener Expo + Supabase + GitHub + Notion.
Agregar EAS Build.
Reforzar RLS.
Mover acciones sensibles a Edge Functions.
Agregar Google Maps como capa logística.
Evaluar Azure después, no durante estas 72 horas.
```
