# User flow

## Objetivo

Definir el flujo del usuario estándar dentro de MUBER 2.

## Flujo actual

1. Elegir servicio
2. Ingresar origen y destino
3. Elegir método de inventario
4. Revisar resumen y precio
5. Solicitar viaje
6. Ver tracking

## Servicios posibles

- flete_estandar
- ultima_milla

## Datos que se guardan

En `requests`:

- customer_id
- service_type
- assistance_type
- origin_text
- destination_text
- inventory_method
- inventory_summary
- estimated_price_clp
- status

## Estado inicial

Cuando User crea una solicitud, el estado parte como:

- `pending`

## Relación con Driver

Cuando Driver acepta una solicitud:

- `requests.status` pasa a `accepted`
- se crea un `trip`
- se registra historial
- el tracking del usuario cambia

## Tracking esperado

User debe poder ver:

- Buscando conductor
- Conductor asignado
- Chofer en camino
- Chofer llegó
- Viaje en curso
- Viaje finalizado

## Regla clave

El usuario no debe depender de mensajes ambiguos.  
El estado visible debe reflejar el estado real guardado en Supabase.