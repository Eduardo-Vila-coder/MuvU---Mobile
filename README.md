# MuvU · App móvil

App móvil (Android e iOS) de **MuvU**, la plataforma de alquiler de habitaciones para estudiantes universitarios cerca de su campus.

**Curso:** CS 2031 Desarrollo Basado en Plataforma · UTEC

| | Enlace |
|---|---|
| App Android (APK) | [Release v1.0.0](https://github.com/Eduardo-Vila-coder/MuvU---Mobile/releases/tag/v1.0.0) |
| iPhone | Expo Go + EAS Update (ver *Deploy*) |
| API (backend) | `https://muvu-api.duckdns.org/api/v1` · repo [Backend_MUVU](https://github.com/cristhianjinchuna-dev/Backend_MUVU) |
| Web | https://muvu-rouge.vercel.app |

> **Disponibilidad del backend:** la API corre en una instancia EC2 de **AWS Academy (Learner Lab)**, que AWS apaga automáticamente al terminar cada sesión del laboratorio (máximo 4 horas). Mientras el laboratorio está encendido, todo el stack funciona por HTTPS. Para revisar el proyecto, coordinar con el equipo para encender el laboratorio; al encenderse, el backend y el HTTPS arrancan solos (servicios `systemd`), sin pasos manuales, y la IP elástica y el dominio no cambian. Comprobación rápida: [`/api/v1/universidades`](https://muvu-api.duckdns.org/api/v1/universidades) debe responder con un JSON.

## Funcionalidades

| Rol | Qué puede hacer |
|---|---|
| Estudiante | Ver y buscar habitaciones, encontrar las **cercanas** a su universidad (con GPS), ver fotos, descripción, rutas y reseñas, reservar con un **mensaje**, cancelar, calificar y editar su perfil (foto con la cámara, celular y "Sobre mí") |
| Arrendador | Publicar y editar habitaciones (dirección en el mapa y descripción), agregar fotos con la **cámara o la galería**, enviar la foto de su DNI, confirmar solicitudes, ver el perfil del estudiante y **destacar** habitaciones pagando con Stripe |
| Ambos | Cuando se confirma una reserva, tarjeta de **contacto** con WhatsApp, llamada y correo |

El administrador trabaja desde la web.

### Funciones nativas del celular

| Función | Librería |
|---|---|
| Ubicación (GPS) para buscar la universidad más cercana | `expo-location` |
| Cámara y galería para fotos de perfil, DNI y habitaciones | `expo-image-picker` |
| Agitar el celular para recargar | acelerómetro (`expo-sensors`) |
| Sesión guardada de forma segura | `expo-secure-store` |
| Pagos con Stripe PaymentSheet (Google Pay / Apple Pay) | `@stripe/stripe-react-native` |
| Abrir WhatsApp, llamadas y correo | `Linking` |

## Tecnologías

Expo SDK 58 + React Native, TypeScript, Expo Router (rutas por archivos y grupos por rol), Axios con refresh token automático, Google Maps (WebView), Stripe y Cloudinary.

## Ejecución local

```bash
npm install
cp .env.example .env.local   # completar los valores
npx expo start -c            # escanear el QR con Expo Go
```

Variables (`.env.local`, nunca se suben al repo):

| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | API. Producción: `https://muvu-api.duckdns.org/api/v1`. En local: `http://<IP de tu PC>:8080/api/v1` (no `localhost`, porque el celular no es la PC) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `EXPO_PUBLIC_STRIPE_TEST_MODE` | Clave **pública** de Stripe y modo prueba |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` / `EXPO_PUBLIC_GOOGLE_MAPS_BASE_URL` | Mapas (ver la sección *Mapas*) |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` / `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Subida de fotos (preset *unsigned*) |

**Cuentas de prueba:** estudiante `ana.ramos@utec.edu.pe`, arrendador `rosa.quispe@muvu.com` (ambos `Clave123!`).

## Deploy

Proyecto de Expo: `@lucasmcgamer/muvu-mobile`.

### APK para Android (EAS Build)

- **Descarga:** [MuvU v1.0.0 (APK)](https://github.com/Eduardo-Vila-coder/MuvU---Mobile/releases/tag/v1.0.0), en *Assets*. Se instala como cualquier app; Android pide permitir "instalar apps de origen desconocido" (si Play Protect lo bloquea: *Más detalles → Instalar de todas formas*).
- Se genera con el perfil `preview` de [`eas.json`](eas.json): `eas build -p android --profile preview`.
- [`.easignore`](.easignore) es igual al `.gitignore` pero deja subir `.env.local` al servidor de compilación, para que el APK tenga las variables `EXPO_PUBLIC_*` (solo claves públicas; el archivo sigue fuera de GitHub).

### Actualizaciones (EAS Update)

El APK escucha el canal `production`, así que los cambios de JavaScript se publican sin volver a compilar. Los miembros del proyecto también pueden abrir la app en **Expo Go** (iniciando sesión con su cuenta de Expo) desde *expo.dev → Updates → Preview*. El `runtimeVersion` usa la política `sdkVersion` (`exposdk:58.0.0`).

Publicar una nueva versión (con `EXPO_PUBLIC_API_URL` de producción en `.env.local`):

```bash
eas update --branch production --message "descripción" --platform android
eas update --branch production --message "descripción" --platform ios
```

Se publica por plataforma porque la versión web no se usa (la web oficial está en Vercel) y Stripe para celular no compila en web.

## GitHub & Management

Cada funcionalidad se trabajó en su propia rama y se integró a `main` con pull requests revisados por otro integrante.

### Participación

| Integrante | GitHub | Aportes en la app | Participación |
|---|---|---|---|
| Eduardo Raúl Vila Castellares | `Eduardo-Vila-coder` | Base de la app (Expo Router, autenticación, login, registro, recuperación de contraseña) y flujos completos de estudiante y arrendador | 100 % |
| Yerik Dylan Vega Santillan | `Yerik-Vega` | Pagos con Stripe (PaymentSheet, Google Pay), mapas de Google, rutas y radio de búsqueda | 100 % |
| Cristhian Gabriel Jinchuña Cama | `cristhianjinchuna-dev` | Subida de fotos con Cloudinary (cámara y galería), fotos de perfil, contacto tras la confirmación, descripciones, moderación y publicación con EAS Update | 100 % |
| Mathius Edgar Quispe Sicha | `MQS144` | Desarrollo inicial de la app móvil | 100 % |
| Mathias Alonso Cavalcanti Estacio | `MatCavUTEC` | Backend y web (ver sus repositorios) | 100 % |


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
- Los puntos de interés de Google (restaurantes, tiendas…), sus enlaces y las ventanas emergentes no abren el navegador ni otra app: el mapa queda encerrado en su WebView/iframe. Los errores de conexión, autorización y permisos permiten reintentar o elegir un punto manualmente. El resto de la búsqueda y el enlace externo de rutas siguen disponibles sin la clave del mapa.

### Verificación

```sh
npx expo lint
npx tsc --noEmit
node --test scripts/maps.test.mjs scripts/slider.test.mjs
```

Las pruebas del mapa usan respuestas simuladas de Google para comprobar confirmación de coordenadas, carreras entre búsquedas/rutas, selección de marcadores, validación del puente y bloqueo de enlaces externos. Las del slider comprueban el ajuste a los pasos y el recorte al rango del radio. Para comprobar la integración real se necesita la clave con las APIs habilitadas: probar publicación/edición, permiso GPS concedido/denegado, cambio de universidad/radio, carga de más habitaciones y los tres modos de ruta en Android, iOS y web.

Verificación de esta implementación: TypeScript, las nueve pruebas del mapa y la exportación del paquete Android pasan. Se comprobaron Places y los tres modos de Routes con Google real en Chrome usando la clave local del proyecto de referencia. Queda pendiente la prueba en dispositivos. El lint global conserva dos errores previos (`react-hooks/set-state-in-effect` en `useFetch` y `usePagedList`); los componentes del mapa pasan lint. La exportación web completa está bloqueada por la importación nativa existente de Stripe en `AdvertiseRoomScreen`, ajena al mapa.
