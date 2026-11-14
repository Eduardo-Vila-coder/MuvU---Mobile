# MuvU---Mobile
Proyecto grupal en DBP mobile

## Mapas

La app adapta los mapas de `Proyecto_frontend` a Android, iOS y web. Usa Google Maps JavaScript dentro de una WebView nativa y un iframe en web para compartir Places, geocodificación y Routes sin exponer claves de servicios del backend.

1. Instala las dependencias con `npm install`.
2. Copia las variables de `.env.example` a `.env.local` y configura `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` con una **clave de cliente** de Google Maps.
3. En el mismo proyecto de Google Cloud activa facturación y estas APIs: **Maps JavaScript API**, **Places API (New)**, **Geocoding API** y **Routes API**. Restringe la clave a esas APIs y a los orígenes usados por la app.
4. En web autoriza el dominio de la app y el origen de desarrollo, incluyendo puerto. En Android/iOS, `EXPO_PUBLIC_GOOGLE_MAPS_BASE_URL` define el origen HTTPS del documento de la WebView (por defecto `https://localhost/`); autoriza ese origen en las restricciones HTTP referrer de la clave. Esta integración usa la clave de JavaScript, no una clave restringida por paquete Android o bundle iOS. Comprueba las restricciones en ambos dispositivos antes de publicar.
5. Reinicia `npx expo start` tras cambiar variables. Las variables `EXPO_PUBLIC_*` se incluyen en el cliente; nunca coloques una clave privada o de servidor en ellas.

Se añadió `react-native-webview` con `npx expo install`, compatible con SDK 58. Si usas un binario de desarrollo existente, vuelve a compilarlo para incluir el módulo (`npx expo run:android`, o una compilación de desarrollo con EAS). Expo Go incluye WebView.

### Funciones

- Publicar/editar: sugerencias de Places en Perú, ubicación actual bajo permiso, marcador arrastrable o selección con toque y confirmación de dirección. Se envían `direccion`, `latitud` y `longitud` al backend; editar conserva las coordenadas originales.
- Cercanas: universidad elegida manualmente o por GPS, círculo del radio, marcadores con dirección/precio, fotos y acceso al detalle al seleccionar una habitación. El mapa representa las páginas cargadas; el botón de cargar más y la lista amplían los resultados.
- Rutas: automóvil, transporte público y a pie, con tiempos independientes y cambio de ruta sin repetir consultas. En detalle se elige entre las cinco universidades más cercanas por distancia en línea recta y se puede abrir el trayecto en Google Maps.
- Errores de conexión, autorización y permisos permiten reintentar o elegir un punto manualmente. El resto de la búsqueda y el enlace externo siguen disponibles sin la clave del mapa.

### Verificación

```sh
npx expo lint
npx tsc --noEmit
node --test scripts/maps.test.mjs
```

Las pruebas del mapa usan respuestas simuladas de Google para comprobar confirmación de coordenadas, carreras entre búsquedas/rutas, selección de marcadores y validación del puente. Para comprobar la integración real se necesita la clave con las APIs habilitadas: probar publicación/edición, permiso GPS concedido/denegado, cambio de universidad/radio, carga de más habitaciones y los tres modos de ruta en Android, iOS y web.

Verificación de esta implementación: TypeScript, las ocho pruebas del mapa y la exportación del paquete Android pasan. Se comprobaron Places y los tres modos de Routes con Google real en Chrome usando la clave local del proyecto de referencia. Queda pendiente la prueba en dispositivos. El lint global conserva dos errores previos (`react-hooks/set-state-in-effect` en `useFetch` y `usePagedList`); los componentes del mapa pasan lint. La exportación web completa está bloqueada por la importación nativa existente de Stripe en `AdvertiseRoomScreen`, ajena al mapa.
