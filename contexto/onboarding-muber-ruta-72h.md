# Onboarding MUBER — Ruta operativa próximas 72 horas

Fecha de definición: 2026-04-27
Responsable estratégico: Mario Engelbert Holmstrom Ojeda
Proyecto: MUBER
Entorno por defecto: TEST

## Propósito

Este documento fija la ruta de trabajo inmediata para las próximas 72 horas del Proyecto MUBER.

La decisión principal es no cambiar el stack actual antes del piloto. La prioridad es madurarlo, ordenar su uso y cerrar los bloqueos reales del frontend mobile-first.

## Decisión de stack

El stack actual se mantiene.

Stack base aprobado para esta etapa:

- Expo / React Native para el frontend mobile-first.
- Supabase como backend real.
- Supabase Auth para autenticación.
- Supabase Postgres como fuente de verdad de datos.
- Supabase Realtime para lectura operativa en vivo cuando aplique.
- Supabase Edge Functions para acciones sensibles y futuras integraciones.
- GitHub para estructura, trazabilidad, documentación y control de cambios.
- Notion como backoffice humano, no como backend.
- Google Maps Platform como próxima capa logística para mapas, rutas, direcciones y cálculo operativo.
- WebPay / Transbank para pagos cuando el flujo TEST esté validado.
- Windsurf / Codex como apoyo de desarrollo, manteniendo revisión humana.

## Decisión explícita

No se migra el proyecto a Azure, Firebase, backend propio, Flutter, Kotlin nativo ni Swift nativo en esta etapa.

Azure queda reservado para una etapa futura si MUBER necesita Power BI, clientes institucionales, reportes corporativos o integración fuerte con ecosistema Microsoft.

Google se prioriza para la capa logística por mapas, rutas, geocodificación, direcciones y cálculo de distancia/tiempo.

## Reglas MUBER obligatorias

- Supabase es el backend real.
- Notion es backoffice, no backend.
- GitHub es estructura y trazabilidad.
- TEST por defecto.
- REAL solo con autorización explícita.
- No usar mocks como base principal.
- Mobile-first y responsive.
- No exponer secretos.
- No tocar producción sin revisión.
- Respetar AGENTS.md y la arquitectura MUBER.

## Objetivo de las próximas 72 horas

Cerrar el MVP operativo mobile-first para que el piloto real/comercial pueda probarse con control.

El foco no es agregar más ideas. El foco es estabilizar lo que ya existe.

## Prioridades técnicas

1. Mantener Expo / React Native.
2. Mantener Supabase como backend real.
3. Mantener Notion solo como backoffice.
4. Mantener GitHub como trazabilidad.
5. Estabilizar flujo Driver.
6. Estabilizar flujo User.
7. Revisar Panel Director.
8. Confirmar que la app no dependa de mocks para operar.
9. Preparar EAS Build como siguiente paso para APK interno.
10. Preparar Google Maps Platform como capa logística siguiente, sin integrarla de forma apresurada.

## Ruta 0 a 24 horas

### Meta

Corregir bloqueos de uso inmediato en MUBER 3.

### Tareas

- Validar login admin/director.
- Confirmar persistencia de sesión en móvil.
- Confirmar que el botón atrás de Android no saca al usuario del flujo.
- Confirmar que el Panel Director permite navegar a:
  - Dashboard Director
  - User
  - Assisted
  - Driver
  - Home
- Corregir layout Driver mobile-first.
- Silenciar visualmente bloques que no aportan a esta etapa sin eliminar procesos internos.
- Confirmar que Driver puede ponerse En línea desde cuenta admin en TEST.
- Confirmar que solicitudes entrantes/pendientes se ven correctamente.
- Confirmar que User hace scroll y permite avanzar desde inventario.

### Criterio de aceptación

MUBER 3 debe poder abrirse en móvil, iniciar sesión como admin, navegar desde Panel Director, entrar a User, entrar a Driver, volver sin cerrar sesión y operar pantallas sin quedarse atrapado.

## Ruta 24 a 48 horas

### Meta

Ordenar backend TEST y seguridad mínima operativa.

### Tareas

- Revisar tablas principales en Supabase TEST:
  - profiles
  - drivers
  - vehicles
  - requests
  - trips
  - trip_status_history
  - payments
  - driver_applications
  - inventory_items
- Verificar que los perfiles no estén duplicando identidad crítica.
- Verificar roles esperados:
  - admin
  - driver
  - customer
- Documentar valores antiguos o equivalentes como CHOFER/cliente solo como compatibilidad temporal.
- Revisar RLS tabla por tabla.
- Confirmar que acciones sensibles no queden sin control antes de REAL.
- Identificar qué acciones deben pasar a Edge Functions:
  - aprobar chofer
  - rechazar chofer
  - editar comisión
  - crear vehículo
  - registrar pago
  - confirmar WebPay
  - sincronizar Notion

### Criterio de aceptación

Supabase TEST debe tener datos operables y roles claros. Las acciones sensibles deben quedar identificadas para migrarse o protegerse antes de pasar a REAL.

## Ruta 48 a 72 horas

### Meta

Preparar MUBER para prueba piloto controlada y siguiente etapa técnica.

### Tareas

- Preparar EAS Build como paso siguiente.
- Definir si se generará APK interno de prueba.
- Documentar checklist mínimo de QA:
  - login
  - panel director
  - user flow
  - assisted flow
  - driver online/offline
  - solicitudes pendientes
  - aceptar/rechazar solicitud
  - tracking en background
  - dashboard director
  - pagos TEST/manuales
- Definir primera integración Google Maps Platform:
  - Places Autocomplete
  - Geocoding
  - Routes API
  - distancia estimada
  - tiempo estimado
  - cálculo base de precio
- No activar REAL todavía.
- No conectar Notion directo desde frontend.
- Mantener Notion como lectura/backoffice mediante Supabase o Edge Functions.

### Criterio de aceptación

Debe quedar claro qué se puede probar con usuarios reales controlados, qué falta antes de REAL y qué debe construirse después sin romper la arquitectura.

## Stack objetivo para piloto controlado

Frontend:

- Expo
- React Native
- EAS Build como siguiente paso

Backend:

- Supabase Postgres
- Supabase Auth
- Supabase Realtime
- Supabase Edge Functions

Mapas:

- Google Maps Platform
- Places
- Geocoding
- Routes

Pagos:

- WebPay / Transbank en TEST primero
- REAL solo con autorización explícita

Backoffice:

- Notion
- Dashboard Director

Trazabilidad:

- GitHub
- AGENTS.md
- OpenSpec
- documentos docs/
- SQL versionado

## No hacer en estas 72 horas

- No migrar a Azure.
- No migrar a Firebase.
- No rehacer backend.
- No reemplazar Supabase.
- No pasar a REAL.
- No conectar Notion directo desde frontend.
- No subir secretos.
- No hacer refactor grande sin necesidad.
- No agregar funciones nuevas antes de cerrar bloqueos de QA.

## Resultado esperado al final de las 72 horas

MUBER debe quedar con:

- stack confirmado;
- app MUBER 3 ordenada en GitHub;
- flujo móvil estable;
- Driver operativo en TEST;
- Panel Director navegable;
- Supabase TEST como fuente de verdad;
- ruta clara hacia EAS Build;
- ruta clara hacia Google Maps;
- lista concreta de acciones sensibles para Edge Functions;
- Notion manteniéndose como backoffice.
