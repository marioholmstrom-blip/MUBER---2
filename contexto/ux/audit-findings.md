# MUBER · Audit Findings UX

Hallazgos de auditoría UX basados en análisis de código actual y principios de heurísticas de Nielsen, UCD, customer journey y testing planificado. Severidad: Alta/Media/Baja.

> **Restricciones**: TEST por defecto, REAL solo con autorización explícita.

---

## Hallazgos por Heurística de Nielsen

### H1. Visibilidad del estado del sistema (Alta)

**Problema**: El usuario no siempre sabe qué está pasando:
- `UserScreen.native.js`: No hay barra de progreso visible durante el wizard de solicitud.
- `DriverScreen.js`: No se muestra cuándo fue la última sincronización del panel operativo.
- `PaymentScreen.native.js`: Estados intermedios no son explícitos ("Conectando...", "Esperando...").

**Impacto**: Incertidumbre, ansiedad, percepción de app lenta.

**Recomendación**: B1 (visibilidad del estado del sistema)

---

### H2. Coincidencia con el mundo real (Media)

**Problema**: Copy técnico en lugar de lenguaje de mudanza:
- `InventoryStep.js`: Términos como "normalización", "payload" no son comprensibles para usuario promedio.
- `AssistedScreen.js`: Tipos de asistencia con nombres técnicos o códigos.

**Impacto**: Confusión, sensación de app compleja.

**Recomendación**: B2 (lenguaje de mudanza + UCD)

---

### H3. Control y libertad del usuario (Media)

**Problema**: No hay confirmación antes de acciones destructivas:
- No hay botón "Atrás" consistente en todos los wizards.
- No hay confirmación al salir de pago, cancelar solicitud, o ponerse offline con viaje activo.

**Impacto**: Acciones accidentales, frustración.

**Recomendación**: B3 (botón Atrás + confirmaciones)

---

### H4. Consistencia y estándares (Alta)

**Problema**: No hay sistema de tokens de diseño:
- Colores, radios, sombras, tipografías están hardcodeados en múltiples archivos.
- Breakpoints no están centralizados.
- `StyleSheet.create` duplica estilos similares en diferentes pantallas.

**Impacto**: Inconsistencia visual, difícil de mantener, no escalable.

**Recomendación**: B4 (tokens + useBreakpoint)

---

### H5. Prevención de errores (Media)

**Problema**: Validación inline ausente o insuficiente:
- `AssistedScreen.js`: No hay validación inline de email, teléfono.
- `DriverScreen.js`: No hay validación inline de email, teléfono, patente CL.
- CTAs no se deshabilitan hasta que el paso es válido.

**Impacto**: Errores post-submit, frustración.

**Recomendación**: B5 (validación inline + deshabilitar CTA)

---

### H6. Reconocer en lugar de recordar (Media)

**Problema**: Información clave no está visible en contexto:
- `DriverScreen.js`: Filas de viaje no muestran mini-resumen de origen→destino (se perdió al pasar a filas compactas).
- `UserScreen.native.js`: En resumen de precio, no se muestra inventario en 1 línea sin volver atrás.

**Impacto**: Usuario tiene que recordar o volver atrás, aumenta carga cognitiva.

**Recomendación**: B6 (mini-resúmenes visibles)

---

### H7. Eficiencia y flexibilidad (Baja)

**Problema**: No hay atajos en desktop:
- `DriverScreen.js`: No hay atajos de teclado en web (A = aceptar, N = avanzar).
- `UserScreen.web.js`: Está vacío, no hay versión web optimizada.

**Impacto**: Menos eficiente en desktop.

**Recomendación**: B7 (fuera de alcance en primera ola B1-B6)

---

### H8. Diseño estético y minimalista (Media)

**Problema**: Densidad visual alta:
- `UserScreen.native.js`: Muchos elementos en pantalla, falta jerarquía tipográfica clara.
- `DriverScreen.js`: Filas densas, puede ser difícil escanear en móvil.

**Impacto**: Fatiga visual, difícil de escanear.

**Recomendación**: B8 (fuera de alcance en primera ola B1-B6)

---

### H9. Ayudar a reconocer y recuperarse de errores (Alta)

**Problema**: Mensajes de error técnicos:
- `Alert.alert("Error", e.message)` crudo en múltiples archivos.
- No hay mensajes amigables por código de Edge Function.

**Impacto**: Usuario no entiende qué salió mal, no puede recuperarse.

**Recomendación**: B9 (fuera de alcance en primera ola B1-B6)

---

### H10. Ayuda y documentación (Baja)

**Problema**: No hay ayuda en contexto:
- `HomeScreen.js`: No hay tooltip/sheet "¿Cómo funciona?" por rol.
- `InventoryStep.js`: No hay ejemplos visuales por método.

**Impacto**: Usuario no sabe cómo usar la app.

**Recomendación**: B10 (fuera de alcance en primera ola B1-B6)

---

## Hallazgos por Customer Journey

### User Journey

**Punto de fricción 1 (Alta)**: Espera tras solicitar
- No se muestra ETA de aceptación.
- Estado de polling no visible.

**Punto de fricción 2 (Media)**: Inventario guiado
- Copy técnico confuso.
- No se puede volver atrás fácilmente.

**Punto de fricción 3 (Media)**: Resumen de precio
- No se muestra inventario en 1 línea.

---

### Assisted Journey

**Punto de fricción 1 (Media)**: Selección de tipo de asistencia
- Nombres técnicos o códigos.
- No hay descripción clara.

**Punto de fricción 2 (Media)**: Definición de ruta
- Autocompletado no siempre funciona.
- Validación poco clara.

---

### Driver Journey

**Punto de fricción 1 (Alta)**: Aceptar solicitud
- No se ve inventario completo antes de aceptar.
- No hay confirmación.

**Punto de fricción 2 (Media)**: Gestionar viaje
- No se ve mini-resumen de origen→destino.

**Punto de fricción 3 (Media)**: Compartir ubicación
- No se sabe si se sincronizó correctamente.

---

## Métricas a medir (post-implementación B1-B6)

- **Task success rate**: % de usuarios que completan el flujo sin abandonar.
- **Time on task**: tiempo por paso (especialmente inventario).
- **Error rate**: clicks en zonas no clicables, retrocesos.
- **SUS score**: usabilidad general post-flujo.
- **Likert 1-5**: claridad, confianza, esfuerzo percibido.

---

## Prioridad de implementación

1. **B4** (tokens + useBreakpoint) - Base técnica, alta severidad.
2. **B1** (visibilidad del estado) - Alta severidad, impacto directo.
3. **B6** (reconocer en lugar de recordar) - Media severidad, impacto directo.
4. **B2** (coincidencia con el mundo real) - Media severidad, impacto en copy.
5. **B3** (control y libertad) - Media severidad, previene errores.
6. **B5** (prevención de errores) - Media severidad, reduce errores post-submit.

---

## Notas

- Este documento se actualizará tras ejecutar testing con UsabilityHub, Hotjar y QuestionPro.
- Hallazgos B7-B10 se abordarán en segunda ola tras completar B1-B6.
