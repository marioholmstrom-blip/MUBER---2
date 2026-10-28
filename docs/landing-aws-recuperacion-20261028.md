# Recuperacion de landing y alojamiento AWS - 2026-10-28

## Fuente y alcance
Las landing originales de landing-choferes se recuperaron del historial de este mismo chat. La landing de usuarios se creo y publico el 15 de septiembre de 2026. recovery-manifest.json registra los archivos y cambios historicos recuperados. No se ejecutaron comandos historicos: se recuperaron contenidos y se aplicaron sus diferencias sobre las fuentes.

Se conservan contenido y estilos. Adaptaciones de alojamiento:
- La web corporativa conserva su index.html y URL existentes.
- La entrada de choferes cambia de / a /choferes/ para no sustituir la web corporativa.
- Los enlaces internos de regreso a choferes apuntan a /choferes/.
- Las referencias al sitio corporativo apuntan a la raiz del mismo alojamiento AWS durante el bloqueo de mubercargo.com.
- Se conserva el mismo APK original b6f66f94; no se construye ni modifica una app.
- El APK y el video originales se almacenan en S3 y se sirven por CloudFront. media-manifest.json contiene sus huellas y tamanos verificados.
- No se cambian publicaciones ni enlaces de Meta en esta fase.

## Rutas previstas
- /choferes/
- /descargar/
- /usuarios/
- /usuarios/como-funciona/

## Compilacion
Next.js 16.2.6 y React 19.2.6, como en las fuentes originales. Exportacion estatica y rutas con index.html. Amplify compila landings/ y el ensamblado solo incorpora sus archivos publicos; no publica fuentes, dependencias ni documentacion interna.

## Medios
Se recuperaron las capturas originales adjuntas al chat, el logo del proyecto y la grabacion original de septiembre. El recorte del logo restaura la exportacion historica documentada de 438x102 sobre el original de 800x240. Las etiquetas de proveedores conservan su contenido; el cambio solo migra este alojamiento.

## Dependencias externas
El dominio mubercargo.com sigue pendiente de liberacion desde Azure. No se usan sus direcciones como destino operativo de los botones de estas landing durante esta fase. El APK conserva sus conexiones originales: la migracion de estas paginas no cambia el backend de la aplicacion.