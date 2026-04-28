# Ruta 72 horas — Stack y estabilización MUBER

Fecha de definición: 2026-04-27
Proyecto: MUBER
Fuente de verdad operativa: Supabase TEST
Documento relacionado: `contexto/onboarding-muber-ruta-72h.md`

## Decisión

El stack actual de MUBER se mantiene para el piloto controlado.

La decisión estratégica es no migrar ni reemplazar la arquitectura antes de cerrar QA mobile-first.

## Stack aprobado

- Expo / React Native para app móvil y pruebas web.
- Supabase para backend real.
- Supabase Auth para login.
- Supabase Postgres para datos relacionales.
- Supabase Realtime cuando aplique.
- Supabase Edge Functions para lógica sensible.
- GitHub para estructura y trazabilidad.
- Notion para backoffice humano, no backend.
- Google Maps Platform como capa logística siguiente.
- WebPay / Transbank para pagos, primero TEST.
- Windsurf / Codex como apoyo de desarrollo bajo revisión humana.

## Principio rector

No cambiar el stack. Madurarlo por capas.

Orden recomendado:

1. Estabilizar MUBER 3 mobile-first.
2. Confirmar navegación, sesión y Driver.
3. Reforzar Supabase TEST.
4. Preparar EAS Build.
5. Preparar Google Maps.
6. Pasar acciones sensibles a Edge Functions.
7. Mantener Notion como backoffice.
8. Evaluar Azure solo en etapa futura institucional/Power BI.

## 0 a 24 horas — Cierre de bloqueos frontend

### Objetivo

Que MUBER 3 pueda probarse en móvil sin bloqueos básicos.

### Tareas

- Probar login admin.
- Probar persistencia de sesión móvil.
- Probar botón atrás Android.
- Probar Panel Director.
- Corregir layout Driver.
- Confirmar Driver online/offline.
- Confirmar solicitudes entrantes/pendientes.
- Confirmar User con scroll desde inventario.
- Confirmar que no se pide OTP innecesariamente.

### Salida esperada

MUBER 3 debe poder usarse en modo admin/director para recorrer flujos sin quedar atrapado.

## 24 a 48 horas — Supabase TEST y seguridad mínima

### Objetivo

Ordenar datos y permisos antes de abrir piloto.

### Tareas

- Revisar perfiles y roles.
- Identificar duplicados de email/perfil.
- Confirmar drivers asociados a profile_id correcto.
- Revisar tablas base del piloto.
- Revisar RLS.
- Identificar acciones sensibles.
- Marcar qué acciones deben moverse a Edge Functions.

### Salida esperada

Supabase TEST debe reflejar una operación controlada, sin mezclar identidades y con riesgos conocidos.

## 48 a 72 horas — Preparación siguiente capa

### Objetivo

Dejar definido el siguiente salto técnico sin sobreingeniería.

### Tareas

- Preparar EAS Build.
- Definir APK interno de prueba.
- Definir checklist QA piloto.
- Preparar integración Google Maps Platform.
- Definir qué parte de WebPay sigue en TEST.
- Documentar qué todavía no puede pasar a REAL.

### Salida esperada

MUBER debe quedar preparado para piloto controlado, con ruta técnica clara y sin cambios de stack.

## Actualizaciones recomendadas, no migraciones

### Agregar pronto

- EAS Build.
- EAS Update más adelante.
- Google Maps Platform.
- Revisión completa de RLS.
- Edge Functions para acciones sensibles.
- Observabilidad de errores más adelante.

### No agregar todavía

- Azure completo.
- Firebase completo.
- Backend propio.
- App nativa separada.
- Notion como backend.
- Producción REAL.

## Criterio para pasar de esta ruta

Esta ruta se considera cumplida si:

- MUBER 3 funciona en móvil para pruebas internas.
- El admin/director puede navegar flujos.
- Driver se puede poner online en TEST.
- User permite avanzar por inventario.
- Dashboard Director es navegable.
- Supabase TEST tiene datos consistentes.
- No hay secretos en GitHub.
- Existe una decisión clara para EAS Build.
- Existe una decisión clara para Google Maps.
