# MUBER · Customer Journey - Assisted

Journey map del usuario que solicita servicio de mudanza asistida (ayuda en la mudanza). Flujo base: selección de tipo de asistencia → origen → destino → inventario → solicitud → seguimiento → pago.

> **Restricciones**: TEST por defecto, REAL solo con autorización explícita.

---

## Persona

- **Nombre**: Usuario asistido
- **Contexto**: Persona que necesita ayuda física en la mudanza (ej: personas mayores, con movilidad reducida, o que prefieren no cargar cosas pesadas).
- **Objetivo**: Solicitar asistencia para mudanza, ver progreso, pagar de forma segura.
- **Frustraciones actuales**: No es claro qué tipo de asistencia elegir, incertidumbre sobre el chofer, confusión en el inventario.

---

## Etapas del Journey

### 1. Inicio / Selección de rol

**Punto de contacto**: HomeScreen
- Acción: Selecciona rol "Asistido"
- Emoción: Curiosidad, expectativa
- Pensamiento: "¿Podré hacer esto rápido?"
- Touchpoints: Botones de selección de rol, tagline, branding

**Puntos de fricción**:
- No es claro qué hace cada rol (User vs Assisted)
- Falta ejemplo visual del flujo

**Oportunidades de mejora**:
- Tooltip/sheet "¿Cómo funciona?" por rol
- Mini-preview del flujo al seleccionar

---

### 2. Selección de tipo de asistencia

**Punto de contacto**: AssistedScreen.js - paso 1
- Acción: Elige tipo de asistencia (ej: ayuda en carga, descarga, ambos)
- Emoción: Decisión
- Pensamiento: "¿Cuál opción se ajusta a mi caso?"
- Touchpoints: Cards de selección de asistencia

**Puntos de fricción**:
- Tipos de asistencia con nombres técnicos o códigos
- No hay descripción clara de qué incluye cada tipo

**Oportunidades de mejora**:
- Nombrar tipos con verbos claros (ej: "Ayuda a cargar", "Ayuda a descargar", "Carga y descarga")
- Descripciones sencillas y visuales

---

### 3. Definición de origen

**Punto de contacto**: AssistedScreen.js - paso 2
- Acción: Ingresa dirección de origen
- Emoción: Planificación
- Pensamiento: "¿El chofer encontrará mi casa?"
- Touchpoints: Input de dirección, mapa

**Puntos de fricción**:
- Autocompletado no siempre funciona
- Validación de dirección poco clara

**Oportunidades de mejora**:
- Validación inline con feedback claro
- Previsualización en mapa inmediata

---

### 4. Definición de destino

**Punto de contacto**: AssistedScreen.js - paso 3
- Acción: Ingresa dirección de destino
- Emoción: Planificación
- Pensamiento: "¿El chofer encontrará mi nueva casa?"
- Touchpoints: Input de dirección, mapa

**Puntos de fricción**:
- Autocompletado no siempre funciona
- Validación de dirección poco clara

**Oportunidades de mejora**:
- Validación inline con feedback claro
- Previsualización en mapa inmediata

---

### 5. Selección de método de inventario

**Punto de contacto**: AssistedScreen.js - paso 4
- Acción: Elige método de inventario (manual, escáner, voz)
- Emoción: Carga cognitiva
- Pensamiento: "¿Cuál método es más fácil para mí?"
- Touchpoints: Cards de método

**Puntos de fricción**:
- No hay ejemplos de cómo usar cada método
- No se sabe qué método es mejor para cada caso

**Oportunidades de mejora**:
- Ejemplos visuales por método
- Recomendación según caso (ej: "Si tienes muchos items, usa escáner")

---

### 6. Resumen de solicitud

**Punto de contacto**: AssistedScreen.js - paso 5
- Acción: Revisa resumen de solicitud
- Emoción: Confirmación
- Pensamiento: "¿Está todo correcto?"
- Touchpoints: Card de resumen

**Puntos de fricción**:
- No se puede editar sin volver atrás
- Falta detalle sobre el chofer asignado

**Oportunidades de mejora**:
- Edición inline sin salir del resumen
- Mostrar info preliminar del chofer (si está disponible)

---

### 7. Solicitud de asistencia

**Punto de contacto**: AssistedScreen.js - paso 6
- Acción: Confirma solicitud
- Emoción: Ansiedad
- Pensamiento: "¿Alguien la aceptará?"
- Touchpoints: Botón de confirmación, loader

**Puntos de fricción**:
- No se muestra ETA de aceptación
- Estado de polling no visible

**Oportunidades de mejora**:
- Mostrar "Tiempo estimado de respuesta: X min"
- Estado visible de polling ("Último refresh hace Xs")

---

### 8. Seguimiento de solicitud (en curso)

**Punto de contacto**: AssistedScreen.js - tracking
- Acción: Ve estado de la solicitud, info del chofer
- Emoción: Control
- Pensamiento: "¿Cuándo llega el chofer?"
- Touchpoints: Estado de la solicitud, info del chofer

**Puntos de fricción**:
- Estado intermedio no claro
- No hay notificaciones push

**Oportunidades de mejora**:
- Estados intermedios explícitos ("Buscando chofer...", "Chofer asignado")
- Notificaciones push en cambios de estado

---

### 9. Pago

**Punto de contacto**: PaymentScreen.native.js (reutilizado)
- Acción: Paga via Webpay Plus
- Emoción: Preocupación
- Pensamiento: "¿Será seguro?"
- Touchpoints: WebView Webpay, loader

**Puntos de fricción**:
- Estados intermedios no claros
- No se sabe qué pasa si falla

**Oportunidades de mejora**:
- Estados explícitos ("Conectando con Webpay...", "Esperando confirmación...")
- Mensajes de error amigables

---

### 10. Post-pago / Cierre

**Punto de contacto**: AssistedScreen.js - post-pago
- Acción: Ve confirmación de pago, cierra flujo
- Emoción: Alivio
- Pensamiento: "¿Todo salió bien?"
- Touchpoints: Card de confirmación, botón "Volver al inicio"

**Puntos de fricción**:
- No hay feedback de satisfacción
- No se puede contactar soporte fácilmente

**Oportunidades de mejora**:
- Feedback Likert post-flujo (TEST)
- Botón de contacto a soporte

---

## Métricas a medir

- **Task success rate**: % de usuarios que completan el flujo sin abandonar
- **Time on task**: tiempo por paso (especialmente selección de tipo de asistencia)
- **Drop-off rate**: % de abandono por paso
- **SUS score**: usabilidad general post-flujo
- **Likert 1-5**: claridad, confianza, esfuerzo percibido

---

## Herramientas recomendadas

- **Journey map**: UXPressia
- **Testing**: UsabilityHub (5-second test de HomeScreen)
- **Comportamiento**: Hotjar (heatmaps en web TEST)
- **Encuestas**: QuestionPro (Likert post-flujo)
