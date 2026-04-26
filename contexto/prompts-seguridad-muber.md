# Reglas de seguridad MUBER + prompts rellenados PARA AGENTE CODEX VS

## 2. Reglas base de seguridad para todo Proyecto Startup MUBER

- La IA ayuda a acelerar trabajo, pero no reemplaza revisión humana.
- Cero secretos en código, chats, commits, tickets o documentación pública.
- Supabase es el backend real del proyecto.
- Notion es backoffice y operación, no backend.
- GitHub es la base de estructura, control de cambios y trazabilidad.
- TEST y REAL siempre deben estar separados.
- Primero se prueba en TEST y después, si corresponde, en REAL.
- No usar mocks como base principal del sistema.
- Toda acción sensible requiere confirmación explícita antes de ejecutarse.
- Los errores técnicos completos no se muestran al usuario final.
- Toda entrada del usuario debe validarse antes de guardarse o procesarse.
- Nada se publica sin una revisión mínima de seguridad.

## 3. Contexto fijo del proyecto MUBER

MUBER es una plataforma logística para fletes, mudanzas asistidas y última milla.

Lo usan:

- clientes
- choferes
- operación y administración

Los datos que maneja incluyen:

- nombre
- teléfono
- correo
- ciudad o comuna
- direcciones
- vehículo
- patente
- documentos
- solicitudes
- viajes
- pagos

Más adelante puede incluir inventario.

Stack base:

- Expo React Native con JavaScript
- Supabase
- Notion
- GitHub

## 4. Prompt 1 — Empezar MUBER de forma segura

```text
Quiero trabajar en MUBER de forma segura.

Contexto fijo del proyecto:
- MUBER es una plataforma logística para fletes, mudanzas asistidas y última milla.
- Supabase es el backend real.
- Notion se usa para operación y backoffice, no como backend.
- GitHub se usa para estructura, documentación y trazabilidad.
- TEST y REAL deben mantenerse separados.
- No usar mocks como base principal.
- El proyecto debe seguir una lógica mobile-first y responsive.

Antes de proponer cambios:
1. Lee la documentación disponible del proyecto.
2. Respeta la estructura real del repositorio.
3. No inventes arquitectura innecesaria.
4. Marca cualquier riesgo de seguridad o de operación real.
5. Si una acción es sensible, pide confirmación antes de ejecutarla.

Quiero que me respondas con:
- riesgos principales que ves
- supuestos que estás tomando
- orden recomendado de trabajo
- qué validar primero en TEST antes de tocar algo real
```

## 5. Prompt 2 — Integrar una API externa sin exponer credenciales

```text
Necesito integrar [NOMBRE DEL SERVICIO] en MUBER sin exponer credenciales.

Reglas obligatorias:
- No pongas claves, tokens ni secretos en código, commits, chats ni documentación pública.
- Usa variables de entorno.
- Asegura que `.gitignore` bloquee archivos sensibles.
- Crea o actualiza un `.env.ejemplo` con placeholders seguros y sin valores reales.
- Mantén separados TEST y REAL.
- Si existe modo sandbox o prueba del servicio, úsalo primero.
- Supabase sigue siendo el backend real.
- Notion no debe usarse como backend.

Quiero que me ayudes a:
1. definir la forma correcta de guardar credenciales sin exponerlas
2. revisar riesgos típicos de esta integración
3. proponer una implementación simple y verificable
4. dejar instrucciones claras para configurar TEST y REAL sin mezclar datos

No muestres claves reales ni ejemplos con secretos verdaderos.
```

## 6. Prompt 3 — Formulario o área protegida con permisos correctos

```text
Quiero crear o revisar un formulario o área protegida en MUBER con permisos correctos.

Caso de uso principal:
- inscripción de choferes
- panel de administración

Reglas del trabajo:
- validar todos los campos de entrada
- permitir acceso solo al rol correcto
- pedir confirmación antes de acciones sensibles
- mostrar errores simples al usuario
- no mostrar trazas técnicas completas
- mantener TEST y REAL separados
- usar Supabase como backend real
- no usar mocks como base principal

Quiero que me entregues:
1. riesgos de seguridad del flujo
2. validaciones mínimas por campo
3. permisos por tipo de usuario
4. puntos donde debe haber confirmación
5. ejemplos de mensajes simples para error, éxito y acceso denegado

Prioriza claridad, operación real y una experiencia mobile-first y responsive.
```

## 7. Prompt 4 — Revisar código que ya existe

```text
Quiero revisar código existente de MUBER 3 con foco en seguridad, permisos, datos sensibles y errores operativos.

Revisa especialmente estos archivos o equivalentes:
- DriverScreen.js
- HomeScreen.js
- UserScreen.js
- AssistedScreen.js
- App.js
- index.js
- lib/appEnv.js
- lib/supabase.js
- archivos relacionados con pagos
- archivos relacionados con inventario
- archivos relacionados con inscripción de choferes

Reglas de revisión:
- Supabase es el backend real
- Notion es backoffice
- TEST y REAL deben estar separados
- no usar mocks como base principal
- no mostrar secretos ni credenciales

Quiero la salida ordenada por gravedad:
- crítico
- importante
- menor

Para cada hallazgo indica:
- archivo o zona afectada
- problema detectado
- riesgo real para MUBER
- recomendación concreta

Si no encuentras algo en uno de los archivos nombrados, dilo con claridad y sigue con lo disponible.
```

## 8. Prompt 5 — Setup inicial de seguridad

```text
Quiero dejar el setup inicial de seguridad de MUBER claro y ordenado.

Necesito que revises y propongas:
- reglas mínimas para `.gitignore`
- un `.env.ejemplo` seguro y sin secretos reales
- instrucciones simples para trabajar en TEST y REAL sin mezclar entornos
- herramientas automáticas de revisión para detectar errores básicos, secretos expuestos y dependencias riesgosas

Contexto obligatorio:
- Supabase es backend real
- Notion es backoffice
- GitHub es estructura y trazabilidad
- TEST y REAL separados
- no usar mocks como base principal
- enfoque mobile-first y responsive

Entrégame la respuesta en formato práctico:
- qué crear o revisar primero
- qué dejar bloqueado desde el inicio
- qué automatizar para evitar errores repetidos
- qué revisar antes del primer despliegue
```

## 9. Prompt 6 — Checklist antes de publicar

```text
Quiero un checklist final antes de publicar una actualización de MUBER.

El alcance de esta versión incluye:
- inscripción de choferes
- solicitudes
- viajes
- pagos

Quiero exactamente 15 puntos concretos.

Cada punto debe tener:
- pregunta
- qué significa si la respuesta es no o no lo sé
- qué hacer antes de publicar

Reglas que debes respetar:
- Supabase es backend real
- Notion es backoffice
- GitHub da trazabilidad
- TEST y REAL están separados
- no usar mocks como base principal
- no exponer secretos
- validar entradas del usuario
- no mostrar errores técnicos completos al usuario final
- mantener enfoque mobile-first y responsive

Hazlo claro, accionable y pensado para operación real del piloto.
```

## 10. Reglas rápidas para usar estos prompts bien

Repite siempre dentro del prompt:

- Supabase backend real
- Notion backoffice
- TEST y REAL separados
- no mocks como base principal
- mobile-first y responsive

Qué sí pegar en prompts:

- objetivo concreto
- archivo o carpeta a revisar
- pantalla o flujo involucrado
- entorno de trabajo: TEST o REAL
- rol afectado: cliente, chofer o admin
- restricciones claras de seguridad

Qué no pegar nunca:

- contraseñas
- tokens
- claves privadas
- credenciales reales
- enlaces con acceso sensible
- datos personales reales de clientes, choferes o pagos

## 11. Cierre

Primero seguridad y estructura, después velocidad.
