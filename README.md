# MUBER 2

MUBER 2 es una plataforma digital de logística y mudanzas orientada a operación real, diseñada como un sistema inclusivo, responsivo, escalable e innovador.

## Definición del producto

MUBER 2 no es solo una app de logística operativa.

MUBER 2 es una plataforma de mudanzas y última milla con dos capas integradas:

### 1. Núcleo operativo
Permite:
- crear solicitudes
- aceptar viajes
- asignar conductor y vehículo
- actualizar estados del viaje
- registrar trazabilidad
- operar un piloto real

### 2. Capa diferenciadora
Incorpora:
- accesibilidad universal
- multiidioma
- inventario
- mapa y lógica de ruta
- presupuesto y pricing
- notificaciones
- experiencia clara para usuarios con distintas necesidades

## Visión

MUBER 2 busca convertirse en una solución confiable para la planificación, organización y ejecución de mudanzas y traslados urbanos, con foco inicial en Valparaíso y Viña del Mar.

La propuesta combina operación logística real con una experiencia pensada para:
- adultos mayores
- personas con discapacidad visual
- usuarios con conectividad limitada
- usuarios que requieren claridad, acompañamiento y confianza

## Estado actual del proyecto

Actualmente MUBER 2 ya cuenta con una base funcional de piloto:

- Home funcional
- User conectado a Supabase
- Assisted conectado a Supabase
- Driver conectado a Supabase
- requests reales
- trips reales
- trip_status_history funcionando
- tracking visible en User y Assisted
- conductor y vehículo simulado visibles
- conductor y vehículo simulado guardados en trips

## Base estratégica

La documentación de referencia del proyecto deja claro que:

- MUBER tiene una propuesta de valor ligada a accesibilidad universal, experiencia inclusiva y multiidioma
- el MVP debe priorizar funciones nucleares y verificables
- Notion actúa como panel operativo y backoffice
- la lógica real del sistema no debe depender de Notion
- el proyecto necesita una estructura unificada entre producto, código, operación y documentación

## Arquitectura general

### GitHub
Se usa para:
- estructura del repositorio
- documentación técnica
- reglas del proyecto
- specs
- changes
- trazabilidad estructural

### Supabase
Se usa como backend operativo real del piloto.

### Notion
Se usa como:
- centro operativo
- dashboard del piloto
- backoffice humano
- lectura de métricas
- seguimiento ejecutivo

## Seguridad

Existe una guía operativa de seguridad para MUBER con reglas base y prompts listos para revisión, setup, integraciones y checklist antes de publicar.

Ver:
[muber-2/contexto/prompts-seguridad-muber.md](./contexto/prompts-seguridad-muber.md)

## Ruta de 30 días

La ruta de 30 días debe consolidar el MVP y preparar el piloto real sobre estas líneas:

- accesibilidad
- inventario
- mapa / logística
- presupuesto
- notificaciones
- tracking
- operación del piloto

## Ejes del MVP

### Accesibilidad
La accesibilidad no es un extra. Es parte central de la identidad del producto.

### Inventario
El inventario es un diferenciador funcional y comercial del sistema.

### Mapa y logística
La experiencia debe avanzar hacia asignación, trazabilidad y lectura clara del recorrido.

### Presupuesto
El pricing debe ser entendible, verificable y operable.

### Notificaciones
Las notificaciones deben acompañar el estado del servicio y reducir incertidumbre.

## Principios de trabajo

1. claridad antes que complejidad
2. piloto funcional antes que sobreingeniería
3. trazabilidad antes que supuestos
4. documentación viva antes que documentación decorativa
5. GitHub, Supabase y Notion deben responder a una misma lógica

## Estructura del repositorio

- `README.md`
- `docs/`
- `ai-specs/`
- `openspec/`

## Documentos operativos relevantes

- [docs/doc_pilot_operations.md](./docs/doc_pilot_operations.md)
- [docs/doc_test_automation_mvp.md](./docs/doc_test_automation_mvp.md)
- [docs/doc_driver_applications_notion_test_spec.md](./docs/doc_driver_applications_notion_test_spec.md)

## Objetivo inmediato

Consolidar una base técnica y documental que permita:

- seguir desarrollando sin perder orden
- reflejar correctamente el material estratégico del proyecto
- operar el piloto real
- alinear GitHub con Notion y con el backend actual en Supabase
