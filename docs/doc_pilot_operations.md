# Pilot operations

## Objetivo

Definir cómo MUBER 2 conecta su producto, backend y operación real durante el piloto.

## Sistema operativo del proyecto

### GitHub
Se usa para:
- documentación técnica
- estructura base
- reglas
- specs
- changes
- trazabilidad de evolución

### Supabase
Se usa para:
- backend real del piloto
- persistencia de requests
- trips
- historial
- validación de estados

### Notion
Se usa para:
- backoffice operativo
- dashboard ejecutivo
- métricas
- control del piloto
- lectura de ingresos y KPIs
- coordinación interna

## Regla estructural

Notion no es backend.
Notion opera.
Supabase ejecuta.
GitHub documenta y estructura.

## Qué debe poder medir el piloto

- solicitudes creadas
- solicitudes aceptadas
- viajes activos
- viajes completados
- ingresos MUBER
- ingresos chofer
- viajes por servicio
- viajes por estado
- viajes por medio de pago
- incidencias

## Ruta de 30 días

La operación del piloto debe acompañar el desarrollo de estas líneas:
- accesibilidad
- inventario
- mapa / logística
- presupuesto
- notificaciones
- tracking
- métricas

## Regla del piloto

La operación no debe separarse del producto.
Cada mejora del sistema debe ayudar también a:
- operar mejor
- medir mejor
- aprender más rápido