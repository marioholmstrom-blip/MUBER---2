# MUBER · Customer Journey - User

Journey map del usuario que solicita servicio de mudanza. Flujo base: servicio → inventario → resumen → precio → solicitud → viaje → pago.

> **Restricciones**: TEST por defecto, REAL solo con autorización explícita.

---

## Persona

- **Nombre**: Usuario solicitante
- **Contexto**: Persona que necesita mudanza, usa app móvil (iOS/Android) o web.
- **Objetivo**: Solicitar servicio de mudanza, ver progreso en tiempo real, pagar de forma segura.
- **Frustraciones actuales**: No saber qué sigue tras solicitar, incertidumbre sobre el precio, confusión en el inventario.

---

## Etapas del Journey

### 1. Inicio / Selección de servicio

**Punto de contacto**: HomeScreen
- Acción: Selecciona rol "Usuario"
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

### 2. Selección de tipo de servicio

**Punto de contacto**: UserScreen.native.js - paso 1
- Acción: Elige tipo de servicio (ej: mudanza completa, solo transporte)
- Emoción: Decisión
- Pensamiento: "¿Cuál opción se ajusta a mi caso?"
- Touchpoints: Cards de selección de servicio

**Puntos de fricción**:
- Descripción técnica vs lenguaje cotidiano
- No hay guía de ayuda

**Oportunidades de mejora**:
- Lenguaje de mudanza, no técnico
- Ejemplos visuales por tipo de servicio

---

### 3. Definición de ruta (origen → destino)

**Punto de contacto**: UserScreen.native.js - paso 2
- Acción: Ingresa direcciones de origen y destino
- Emoción: Planificación
- Pensamiento: "¿El chofer encontrará mi casa?"
- Touchpoints: Inputs de dirección, mapa

**Puntos de fricción**:
- Autocompletado no siempre funciona
- Validación de dirección poco clara

**Oportunidades de mejora**:
- Validación inline con feedback claro
- Previsualización en mapa inmediata

---

### 4. Inventario guiado (3 subpasos)

**Punto de contacto**: InventoryStep.js
- Acción: Elige método (manual/escáner/voz), agrega items, selecciona necesidades especiales
- Emoción: Carga cognitiva
- Pensamiento: "¿Se me olvidará algo importante?"
- Touchpoints: Cards de método, inputs de items, chips de necesidades especiales

**Puntos de fricción**:
- Copy técnico ("normalización", "payload")
- No hay ejemplos de cómo llenar
- No se puede volver atrás fácilmente

**Oportunidades de mejora**:
- Lenguaje de mudanza ("revisamos tu lista", "ajustamos los datos")
- Ejemplos visuales por método
- Botón "Atrás" siempre visible

---

### 5. Resumen de servicio

**Punto de contacto**: UserScreen.native.js - paso 3
- Acción: Revisa resumen de servicio, inventario y ruta
- Emoción: Confirmación
- Pensamiento: "¿Está todo correcto?"
- Touchpoints: Card de resumen, lista de inventario

**Puntos de fricción**:
- Inventario no se ve completo en 1 línea
- No se puede editar sin volver atrás

**Oportunidades de mejora**:
- Mostrar inventario resumido en 1 línea
- Edición inline sin salir del resumen

---

### 6. Estimación de precio

**Punto de contacto**: UserScreen.native.js - paso 4
- Acción: Ve precio estimado
- Emoción: Expectativa
- Pensamiento: "¿Es justo? ¿Hay cargos ocultos?"
- Touchpoints: Card de precio, breakdown

**Puntos de fricción**:
- No se explica de dónde viene el precio
- No hay rango estimado

**Oportunidades de mejora**:
- Breakdown de componentes (distancia, inventario, etc.)
- Rango estimado con bandera "aproximado"

---

### 7. Solicitud de servicio

**Punto de contacto**: UserScreen.native.js - paso 5
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

### 8. Seguimiento de viaje (en curso)

**Punto de contacto**: UserScreen.native.js - tracking
- Acción: Ve estado del viaje, ubicación del chofer
- Emoción: Control
- Pensamiento: "¿Cuándo llega?"
- Touchpoints: Mapa con marcadores, estado del viaje, info del chofer

**Puntos de fricción**:
- Estado intermedio no claro
- No hay notificaciones push

**Oportunidades de mejora**:
- Estados intermedios explícitos ("El chofer viene en camino")
- Notificaciones push en cambios de estado

---

### 9. Pago

**Punto de contacto**: PaymentScreen.native.js
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

**Punto de contacto**: UserScreen.native.js - post-pago
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
- **Time on task**: tiempo por paso (especialmente inventario)
- **Drop-off rate**: % de abandono por paso
- **SUS score**: usabilidad general post-flujo
- **Likert 1-5**: claridad, confianza, esfuerzo percibido

---

## Herramientas recomendadas

- **Journey map**: UXPressia
- **Testing**: UsabilityHub (5-second test de HomeScreen)
- **Comportamiento**: Hotjar (heatmaps en web TEST)
- **Encuestas**: QuestionPro (Likert post-flujo)
