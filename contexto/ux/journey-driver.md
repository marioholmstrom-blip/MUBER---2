# MUBER · Customer Journey - Driver

Journey map del chofer que opera en MUBER. Flujo base: inscripción → aprobación → panel operativo → aceptar solicitudes → gestionar viajes → cobrar → finalizar.

> **Restricciones**: TEST por defecto, REAL solo con autorización explícita.

---

## Persona

- **Nombre**: Chofer operador
- **Contexto**: Persona que trabaja como chofer de mudanza, usa app móvil (iOS/Android) o web desktop.
- **Objetivo**: Encontrar solicitudes, aceptarlas, ejecutar el servicio, cobrar y finalizar viajes.
- **Frustraciones actuales**: No ver inventario antes de aceptar, UI densa en desktop, no saber cuándo se sincronizó la ubicación.

---

## Etapas del Journey

### 1. Inicio / Selección de rol

**Punto de contacto**: HomeScreen
- Acción: Selecciona rol "Chofer"
- Emoción: Curiosidad, expectativa
- Pensamiento: "¿Podré trabajar hoy?"
- Touchpoints: Botones de selección de rol, tagline, branding

**Puntos de fricción**:
- No es claro qué hace cada rol
- Falta ejemplo visual del flujo

**Oportunidades de mejora**:
- Tooltip/sheet "¿Cómo funciona?" por rol
- Mini-preview del flujo al seleccionar

---

### 2. Inscripción (nuevo chofer)

**Punto de contacto**: DriverScreen.js - modo "apply"
- Acción: Llena formulario de inscripción (datos personales, vehículo)
- Emoción: Esperanza
- Pensamiento: "¿Me aprobarán rápido?"
- Touchpoints: Formulario multi-paso, cards de selección de vehículo

**Puntos de fricción**:
- Formulario largo sin progreso claro
- Validación inline poco clara

**Oportunidades de mejora**:
- Barra de progreso visible
- Validación inline con feedback claro
- Autocompletado de patente CL

---

### 3. Verificación de estado

**Punto de contacto**: DriverScreen.js - modo "status"
- Acción: Consulta estado de inscripción por email
- Emoción: Ansiedad
- Pensamiento: "¿Me aprobaron?"
- Touchpoints: Input de email, card de estado

**Puntos de fricción**:
- No se sabe cuándo volver a consultar
- Estado no claro (ej: "pendiente" sin contexto)

**Oportunidades de mejora**:
- Mostrar "Vuelve a consultar en X horas"
- Estados con contexto (ej: "En revisión, te contactaremos en 24h")

---

### 4. Panel operativo - En línea / Fuera de línea

**Punto de contacto**: DriverScreen.js - modo "driver"
- Acción: Alterna entre "En línea" y "Fuera de línea"
- Emoción: Control
- Pensamiento: "¿Quiero recibir solicitudes ahora?"
- Touchpoints: Pill de estado, botón "Salir"

**Puntos de fricción**:
- No se sabe cuándo fue la última sincronización
- No hay confirmación al salir con viaje activo

**Oportunidades de mejora**:
- Chip "Última sincronización hace Xs" en header
- Confirmación antes de salir con viaje activo

---

### 5. Ver solicitudes pendientes

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Ve lista de solicitudes pendientes
- Emoción: Decisión
- Pensamiento: "¿Cuál solicitud aceptar?"
- Touchpoints: Filas de solicitudes con chips (servicio, inventario, ruta)

**Puntos de fricción**:
- No se ve inventario completo antes de aceptar
- Ruta en 1 línea puede ser cortada

**Oportunidades de mejora**:
- Expandir fila a detalle antes de aceptar
- Mostrar ruta completa con tooltip

---

### 6. Aceptar solicitud

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Acepta solicitud con chofer real
- Emoción: Compromiso
- Pensamiento: "¿Tengo tiempo para esta mudanza?"
- Touchpoints: Botón "Aceptar"

**Puntos de fricción**:
- No hay confirmación antes de aceptar
- No se puede ver más detalles sin aceptar

**Oportunidades de mejora**:
- Confirmación antes de aceptar
- Vista de detalle sin comprometer

---

### 7. Gestionar viaje activo

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Avanza estado del viaje (en camino → arrived_pickup → cargo_picked_up → heading_to_dropoff → arrived_dropoff)
- Emoción: Ejecución
- Pensamiento: "¿Qué sigue?"
- Touchpoints: Filas de viajes con chips (estado, pago), botón "Avanzar"

**Puntos de fricción**:
- No se ve mini-resumen de origen→destino
- No se sabe qué acción viene después

**Oportunidades de mejora**:
- Mostrar mini-resumen origen→destino en filas
- Texto claro de "Siguiente acción" (ya existe, pero puede mejorarse)

---

### 8. Compartir ubicación (solo móvil)

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Comparte ubicación en tiempo real
- Emoción: Responsabilidad
- Pensamiento: "¿El usuario me ve?"
- Touchpoints: Botón "Compartir ubicación ahora" (oculto en web)

**Puntos de fricción**:
- No se sabe si se sincronizó correctamente
- Botón solo en móvil, no en web

**Oportunidades de mejora**:
- Feedback claro de sincronización
- Considerar mostrar estado en web (sin botón)

---

### 9. Registrar pago

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Registra pago real (Webpay Plus u otro método)
- Emoción: Cierre
- Pensamiento: "¿Cómo cobrar?"
- Touchpoints: Botón "Registrar pago real", opciones de pago

**Puntos de fricción**:
- No se sabe qué métodos de pago acepta
- Webpay Plus pendiente no claro

**Oportunidades de mejora**:
- Listar métodos de pago aceptados
- Estado claro "El usuario está pagando via Webpay"

---

### 10. Finalizar viaje

**Punto de contacto**: DriverScreen.js - panel operativo
- Acción: Finaliza viaje tras pago registrado
- Emoción: Satisfacción
- Pensamiento: "¿Todo salió bien?"
- Touchpoints: Card "Viaje completado con éxito"

**Puntos de fricción**:
- No hay feedback de satisfacción
- No se puede agregar notas post-servicio

**Oportunidades de mejora**:
- Feedback Likert post-servicio (TEST)
- Campo de notas post-servicio

---

## Métricas a medir

- **Task success rate**: % de choferes que aceptan y completan viajes
- **Time to accept**: tiempo desde que aparece solicitud hasta que se acepta
- **Time to complete**: tiempo promedio por viaje
- **SUS score**: usabilidad general del panel operativo
- **Likert 1-5**: claridad de estado del viaje, facilidad de cobro

---

## Herramientas recomendadas

- **Journey map**: UXPressia
- **Testing**: UsabilityHub (5-second test de DriverScreen desktop)
- **Comportamiento**: Hotjar (heatmaps en web TEST)
- **Encuestas**: QuestionPro (Likert post-servicio)
