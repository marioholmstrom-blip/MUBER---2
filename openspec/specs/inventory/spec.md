# Spec: inventory

## Proposito
Alinear la spec de `inventory` con la ruta integrada final de 30 dias de MUBER 2.

## Rol de inventory en el sistema
El inventario no es un agregado decorativo.
Es una pieza estrategica del producto.

Debe ayudar a mejorar:
- comprension del servicio
- presupuesto
- clasificacion del traslado
- confianza del usuario
- trazabilidad operativa

## Relacion con la ruta de 30 dias
La ruta integrada define que el MVP y la ruta de 30 dias deben avanzar con inventario como eje real del producto.

## Debe soportar
- metodo manual
- metodo scanner
- metodo voz
- resumen del inventario
- detalle por item vinculado al `request_id`
- futura relacion con pricing y logistica

## Regla de producto
El inventario debe evolucionar como base para:
- mejor presupuesto
- mejor lectura operativa
- mejor preparacion del viaje

## Regla tecnica
Aunque hoy parte del inventario sea simple, su spec debe quedar preparada para crecer sin romper el flujo actual.

## Estado validado en TEST
En `TEST` ya quedo validado para `User`:
- inventario manual guiado
- `inventory_summary` guardado en `requests`
- detalle guardado en `inventory_items`
- relacion real por `request_id`

## Relacion con piloto real
La futura migracion a `REAL` debe mantener:
- el mismo flujo visible
- la misma trazabilidad en Supabase
- la base lista para una siguiente capa de peso, volumen y recomendacion de vehiculo

## Criterio de exito
La spec de inventory esta bien alineada si ayuda a que MUBER 2 se diferencie y llegue al piloto real con una propuesta mas clara y mas util.
