# Contexto del proyecto MuvU — Frontend Mobile (traspaso 2)

Eres mi asistente para programar el frontend mobile de nuestro proyecto. Lee todo este contexto antes de responder. Todas estas decisiones ya están tomadas con el equipo: respétalas y no las cambies sin preguntarme. Este documento reemplaza al traspaso anterior: conserva lo que ya estaba decidido y agrega lo hecho desde entonces y lo que falta.

## 1. El proyecto
- **MuvU**: plataforma de alquiler de habitaciones para estudiantes universitarios. Curso CS2031 (Desarrollo Basado en Plataformas), UTEC.
- **Roles:** ESTUDIANTE (busca, reserva y califica), ARRENDADOR (publica habitaciones, confirma reservas, paga publicidad) y ADMIN (**solo en la web**, no existe en mobile).
- **Entrega:** martes 10 de noviembre de 2026. Exposición individual: el profesor pregunta por cualquier parte del código que **no se haya enseñado en clase**.
- **Backend:** ya está terminado. Solo trabajamos el frontend mobile (React Native).

## 2. Reglas de trabajo (obligatorias)
1. **No modifiques ningún archivo de mi laptop ni ejecutes comandos git.** Solo comandos de lectura (`cat`, `ls`, `grep`, `pdftotext`, `tsc --noEmit`).
2. **Dame el código como texto en el chat**, archivo por archivo con su ruta. Yo lo copio.
3. **Usa lo mínimo de lo que no se vio en clase.** Si usas algo no enseñado, avísame y explícame cómo defenderlo.
4. Nombres de variables, funciones y archivos **en inglés**; textos de la interfaz **en español**. Comentarios en inglés, cortos.
5. La app mobile debe verse **igual que la web** (misma paleta de Tailwind).
6. **Entrega por lotes pequeños** (5 a 8 archivos). Cada lote lleva: decisiones de diseño en pocas líneas, el código, los cambios a archivos ya existentes y cómo probarlo. Primero explica el porqué del diseño y luego implementa.
7. **Rutas nuevas y `typedRoutes`:** cada vez que se agrega un archivo en `src/app`, hay que reiniciar con `npx expo start -c` y ejecutar "TypeScript: Restart TS Server" antes de `npx tsc --noEmit`. Si `router.push(...)` marca "not assignable to parameter of type RelativePathString...", son los tipos sin regenerar, no un error del código. Solo como último recurso: `router.push(path as Href)`.
8. No asumas APIs de Expo SDK 58 de memoria. El repo trae `AGENTS.md`: léelo y verifica contra la documentación de la versión cuando dudes.
9. Al terminar cada lote, yo corro `npx tsc --noEmit` y te paso el resultado. No avances al siguiente lote si hay errores.

## 3. Carpetas (te daré acceso de lectura)
- `CLASES Frontend Web/`: diapositivas de las semanas 9 a 13, labs y **la rúbrica** (`Rúbrica de Proyecto 2 DBP 2026-2.pdf`). La rúbrica **todavía no se ha leído**: pídemela antes del cierre.
- `Proyecto_frontend/`: la web (React + Vite + TypeScript + Tailwind). Referencia de estilo y de lógica.
- `Backend_MUVU/`: Spring Boot. **Solo lectura.**
- `MuvU---Mobile/`: la app mobile (Expo SDK 58). Todo el código está en `src/`, con `src/app` para las rutas.

## 4. Decisiones tomadas

### Base (ya estaban en el traspaso 1)
- **Navegación:** Expo Router, con las convenciones de la semana 12 (`index`, `_layout`, `+not-found`, `(grupos)`, `[id]`) + React Navigation "donde se pueda".
  - En SDK 58, **React Navigation viene incluido dentro de Expo Router**. Importa `useIsFocused`, `useFocusEffect` y `useNavigation` **desde `'expo-router'`**. **No instales `@react-navigation/native`**: crea una copia separada y los hooks fallan. (Las diapositivas sí lo instalan; en nuestro proyecto no.)
  - No usamos `ThemeProvider`. Los colores van en `screenOptions`.
- **Sin React Native Paper.** Solo `StyleSheet` con la paleta de la web en `src/constants/theme.ts` (`colors`, `stackScreenOptions`, `sharedStyles`).
- **Íconos:** `Ionicons` de `@expo/vector-icons` (instalado a mano).
- **Tokens:** el access token vive en memoria y el refresh token en **SecureStore**. Al abrir la app se recupera la sesión con `/auth/refresh`. Los interceptores de axios son los mismos de la web (JWT + refresh ante un 401).
- **URL del backend:** en `.env.local` como `EXPO_PUBLIC_API_URL=http://IP_DE_TU_PC:8080/api/v1`. Cada uno pone su IP (no `localhost`). Para la entrega final debe ser el backend desplegado con `https`.
- **Reutilización:** `types/`, `utils/` (validators, dates, format), varios `hooks/` y casi todo `api/` se copiaron de la web (sin las funciones de admin).
- **Paginación:** scroll infinito (`usePagedList` + `PagedList`), jalar para recargar y el texto "Mostrando X de Y".
- **Avisos:** confirmaciones destructivas con `Alert.alert` y toasts propios con `ToastContext`.
- **Universidades:** chips (`UniversityPicker`), porque React Native no tiene `<select>`. Las fechas de reserva se escriben como texto `AAAA-MM-DD` (`isValidIsoDate` en `utils/dates.ts`).
- **Sensores:**
  - **GPS** (`expo-location`, hook `useCurrentLocation`): encuentra la universidad más cercana. Si niega el permiso, la elige a mano.
  - **Acelerómetro** (`expo-sensors`, hook `useShake`): agitar el celular recarga la lista. Solo escucha si la pantalla está visible (`useIsFocused`).
  - **Cámara** (`expo-image-picker`): foto del DNI del arrendador y fotos de habitaciones. Si no hay cámara, se elige de la galería.
  - Los permisos van con los plugins de `app.json` (`expo-location`, `expo-image-picker`). No usamos el podómetro.
- **Foto → URL: PENDIENTE.** El backend no tiene endpoint de subida: `dniFoto` y la `url` de imágenes son texto de máximo 500 caracteres con `http(s)://`. Toda subida pasa por **una sola función** `uploadPhoto(uri): Promise<string>` en `src/api/photos.ts`, que hoy lanza un error controlado (`UPLOAD_UNAVAILABLE`). Otro compañero o yo la implementamos al final.
- **Google Maps:** lo hace **otro compañero**; no lo programes. Quedan preparados `src/components/rooms/AddressInput.tsx` (campo de texto normal, él lo reemplaza manteniendo las props `value`, `onChange`, `error`) y `src/components/rooms/RoomRouteMap.tsx` (por ahora no muestra nada; recibe las coordenadas de la habitación y la universidad). El backend ya convierte la dirección en coordenadas con Google al crear una habitación (si Google falla, responde 502).
- **Stripe:** el cobro lo hace el backend, en modo prueba. La app solo hace `POST /pagos-publicidad` (monto 30 o 54, igual que la web). La app **no pide datos de tarjeta**.
- **Recuperar contraseña:** la app envía el correo (`/auth/forgot-password`). El enlace del correo abre la **web** (`FRONTEND_URL`), donde se termina el cambio.
- **Eliminar cuenta:** sí va en mobile para los dos roles, con confirmación usando `Alert`.

### Decisiones nuevas (desde el traspaso 1)
- **Herramientas limitadas a lo visto en clase.** Se usan: `View, Text, Image, TextInput, FlatList, ScrollView, TouchableOpacity, Button, ActivityIndicator, StyleSheet, Alert`; Expo Router (`_layout`, `index`, grupos, `[id]`, `Stack`, `Tabs`); `expo-secure-store`; `expo-image-picker`; `expo-location`; `expo-sensors`. **No se usan**, aunque estén en `package.json`: `expo-image` (se usa `Image` de React Native), `@expo/ui`, `expo-symbols`, `expo-glass-effect`, `expo-camera`, `react-native-gesture-handler`/`reanimated` (son de la plantilla o del drawer).
- **Cámara:** `ImagePicker.launchCameraAsync`, con caída a `launchImageLibraryAsync` si no hay permiso o cámara. Vive en la **función** `pickPhoto()` de `src/utils/pickPhoto.ts` (no es un hook, porque no guarda estado). Devuelve el URI o `null`.
- **Mientras `uploadPhoto` no exista**, la pantalla de imágenes también acepta pegar una URL (igual que la web, EP 017) validada con `validateUrl`.
- **`RoomCard`** (`src/components/rooms/RoomCard.tsx`) es compartido entre roles: recibe `room`, `onPress?` y un slot `actions?`. Lo único que cambia entre estudiante y arrendador son las acciones.
- **`ActionLink`** (`src/components/ui/ActionLink.tsx`): ícono + texto pequeño para acciones dentro de tarjetas (`danger` para rojo).
- **`RoomForm`** (`src/components/rooms/RoomForm.tsx`) lo comparten "Publicar" (EP 016) y "Editar" (EP 019). Valida, convierte texto a número y mapea errores 400/502; la pantalla solo llama a la API y navega.
- **Las pestañas no se desmontan**, así que las listas se recargan al volver de un formulario con `useFocusEffect`, **saltándose el primer foco** (con un `useRef`) para no pedir los datos dos veces.
- **Arrendador no verificado:** se muestra el aviso (EP 003) y se deshabilita "Publicar" solo cuando `verificado === false`; el backend igual responde 403.
- **Al publicar una habitación** se hace `router.replace` a `rooms/[id]/images` para que suba fotos (EP 016 lo indica).
- **Tabs:** Expo Router `Tabs` (equivale al Bottom Tabs de clase), con `tabBarActiveTintColor` y `tabBarIcon` con `Ionicons`. Cada pestaña nueva agrega su `Tabs.Screen` al `_layout` de `(tabs)` en el mismo lote.
- **Detalle de habitación compartido** (`(shared)/rooms/[id]`): todavía no existe. Hasta que se haga, las tarjetas del arrendador no enlazan a un detalle.

## 5. Datos del backend que debes saber
- Rutas bajo `/api/v1`. Lista paginada de Spring: usar `toPage` de `api/pagination.ts`.
- `GET /habitaciones/{id}` (detalle) **no** devuelve latitud ni longitud; la lista sí. Se pasan como parámetros de la ruta (`lat`, `lng`) desde la tarjeta.
- `/habitaciones/cercanas` busca por `universidadId` + `radioKm` (no por una dirección cualquiera).
- `RoomRequest` = `{ direccion, precio, area }` (sin coordenadas).
- `GET /arrendadores/{id}/habitaciones` (usado por `getLandlordRooms`) **no aparece** en el PDF de endpoints: se asume que existe en `Backend_MUVU`. Si da 404, hay que confirmarlo con `grep` en los controllers.
- Cuentas de prueba: admin `admin@muvu.com` / `admin123`; arrendadora `rosa.quispe@muvu.com` / `Clave123!`; estudiante `ana.ramos@utec.edu.pe` / `Clave123!`.

### Endpoints de las pantallas que faltan
- **Reservas:**
  - `POST /reservas` (ESTUDIANTE): body `{ fecha_inicio, fecha_fin, habitacionId }` (con **guion bajo**, formato `yyyy-MM-dd`). Responde 201 con estado `PENDIENTE`. Errores: 400 fechas inválidas, 404 habitación, 409 ya reservada en esas fechas.
  - `GET /reservas` (paginado, más recientes primero): el estudiante ve las suyas y el arrendador las de sus habitaciones. Cada item trae solo `{ id, estado, fecha_inicio, fecha_fin, habitacionId, estudianteId }` (sin nombres ni direcciones).
  - `PATCH /reservas/{id}/cancelar` (estudiante titular, solo si `PENDIENTE`) y `PATCH /reservas/{id}/confirmar` (arrendador dueño, solo si `PENDIENTE`). Sin body. 409 si ya estaba cancelada o confirmada.
- **Perfil del estudiante para el arrendador:** `GET /estudiantes/{id}/perfil` (solo ARRENDADOR) → `{ id, nombre, verificado, universidadId, universidadNombre, puntuacionPromedio (puede ser null), totalCalificaciones }`. El promedio es de las calificaciones que el estudiante **ha dado**.
- **Calificaciones:** `POST /calificaciones` `{ puntuacion 1-5, descripcion? máx 255, reservaId }` solo sobre una reserva `CONFIRMADO` y una sola vez (409 si no está confirmada o ya se calificó). `GET /habitaciones/{id}/calificaciones` y `GET /estudiantes/{id}/calificaciones` (paginados). `DELETE /calificaciones/{id}` (autor).
- **Estudiante:** `GET/PUT/DELETE /estudiantes/{id}`. PUT = `{ nombre (solo letras, máx 100), universidadId }`. DELETE da 409 si tiene reservas o calificaciones.
- **Arrendador:** `GET/PUT/DELETE /arrendadores/{id}`. PUT = `{ nombre, dniFoto? (URL, máx 500) }`. DELETE da 409 si sus habitaciones tienen reservas o calificaciones (borra también sus habitaciones).
- **Publicidad:** `POST /pagos-publicidad` `{ habitacionId, monto (30 = 30 días, 54 = 60 días), metodoPago (TARJETA_DEBITO | TARJETA_CREDITO) }` → 201 `{ id, habitacionId, monto, metodoPago, fechaInicio, fechaFin }`. Errores: 400 monto, 403 no es el dueño, 404, 502 Stripe rechazó el pago. `GET /pagos-publicidad` (solo ARRENDADOR, lista **no** paginada).
- **Verificación:** un arrendador nuevo queda sin verificar hasta que un admin (en la web) lo verifique; sin verificar no puede publicar (403).

## 6. Detalles de Expo SDK 58 / React Native 0.88 ya resueltos
- `ListFooterComponent` no acepta `null`: devolver `undefined`.
- TypeScript 6.0.3: en VS Code usar "Use Workspace Version" (`js/ts.tsdk.path` en `.vscode/settings.json`).
- `app.json` tiene `typedRoutes` y `reactCompiler` activados.
- Con `typedRoutes`, una ruta nueva no existe para TypeScript hasta reiniciar `expo start` (ver regla 7).
- `launchImageLibraryAsync` no necesita pedir permiso; `launchCameraAsync` sí (`requestCameraPermissionsAsync`).
- `app.json` ya tiene el plugin de `expo-image-picker` y el permiso `CAMERA`.

## 7. Estado y plan

### Hecho
**Parte 1: ✅ HECHA Y PROBADA**
- `theme.ts`, `api/client.ts` y `api/tokenStorage.ts`; `AuthContext` y `ToastContext`.
- hooks `usePagedList`, `useCurrentLocation` y `useShake`.
- componentes `ui/` (`Button`, `TextField`, `Chip`, `ScreenLoader`, `ErrorState`, `EmptyState`, `FormAlert`, `PagedList`), `UniversityPicker`, `auth/RoleSelector` y `auth/RequireRole`.
- `app/_layout.tsx`, `app/index.tsx` (redirige según el rol), `+not-found.tsx`, `(auth)/` con `login`, `register` y `forgot-password`.
- `student/_layout.tsx` y `landlord/_layout.tsx`.
- ⚠️ `RoleSelector.tsx` tenía un import duplicado (`View, Text, StyleSheet`, línea 5): debe quedar borrado.
- ⚠️ `student/index.tsx` es **temporal**: borrarlo al hacer las pestañas del estudiante. `landlord/index.tsx` también era temporal y debe estar borrado (choca con `(tabs)/index.tsx`).

**Parte 3, Lote 1 (arrendador): ✅ entregado, `tsc` pasó sin errores**
- `hooks/useLandlordId.ts`, `components/rooms/RoomCard.tsx`, `AddressInput.tsx`, `RoomForm.tsx`.
- `landlord/_layout.tsx` (Stack: `(tabs)`, `rooms/new`, `rooms/[id]/edit`), `landlord/(tabs)/_layout.tsx` (solo la pestaña `index`), `landlord/(tabs)/index.tsx` (Mis habitaciones: lista, aviso de verificación, publicar, editar, eliminar), `landlord/rooms/new.tsx`, `landlord/rooms/[id]/edit.tsx`.

**Parte 3, Lote 2 (arrendador): entregado, pendiente confirmar `tsc`**
- `api/photos.ts`, `utils/pickPhoto.ts`, `components/ui/ActionLink.tsx`, `landlord/rooms/[id]/images.tsx` (cámara + URL manual, galería, eliminar).
- Cambios a archivos del Lote 1 que deben estar aplicados: `Stack.Screen name="rooms/[id]/images"` en `landlord/_layout.tsx`; `new.tsx` hace `router.replace` a las imágenes tras crear; `(tabs)/index.tsx` usa `ActionLink` (con "Imágenes") y ya no tiene el `ActionLink` local.
- **Problema abierto:** `router.push(`/landlord/rooms/${room.id}/images`)` marcó un error de tipo (la ruta no estaba en los tipos generados). Falta confirmar que se resolvió reiniciando `npx expo start -c` + TS Server; si no, usar `as Href` como parche.

### Falta (en este orden)

**Lote 3 — Arrendador: Solicitudes**
- `landlord/(tabs)/requests.tsx`: lista paginada de `GET /reservas` con jalar para recargar y `useFocusEffect`. Botón "Confirmar" solo si `PENDIENTE`; confirmación con `Alert`; toast y recarga. Como la reserva solo trae ids, la tarjeta carga la dirección de la habitación con `getRoomById` (N+1 aceptado para páginas de 10) y ofrece "Ver perfil del estudiante".
- `landlord/students/[id].tsx`: perfil del estudiante (EP 025) para decidir antes de confirmar.
- Componentes compartidos con la Parte 2: `ReservationCard`, `ReservationStatusBadge`, `RatingStars`.
- Agregar `Tabs.Screen` de `requests` en `(tabs)/_layout.tsx` y `Stack.Screen` de `students/[id]` en `landlord/_layout.tsx`.

**Lote 4 — Arrendador: Publicidad y Perfil**
- `landlord/(tabs)/payments.tsx`: elegir una de mis habitaciones (chips), plan (30 o 54, es decir 30 o 60 días) y método (débito o crédito) con `Chip`, botón "Destacar" (`POST /pagos-publicidad`, sin datos de tarjeta, manejar 400/403/502), e historial debajo (`GET /pagos-publicidad`, lista no paginada).
- `landlord/(tabs)/profile.tsx`: ver perfil (EP 014: nombre, correo, verificado, puntaje, calificaciones, cantidad de habitaciones), editar nombre y **foto del DNI con la cámara** (`pickPhoto` → `uploadPhoto` → `dniFoto`; si `uploadPhoto` no está listo, aceptar la URL pegada), cerrar sesión y **eliminar cuenta** (`Alert`, mensaje del 409, cerrar sesión al terminar).
- Agregar las dos pestañas al `(tabs)/_layout.tsx`.

**Parte 2 — Estudiante** (aquí viven GPS y acelerómetro; si el tiempo apremia, pregúntame el orden)
- Lote A: `student/(tabs)/_layout` (Tabs con `tabBarActiveTintColor`), `index` (habitaciones + **agitar para recargar** con `useShake`), `nearby` (**GPS** con `useCurrentLocation` + `UniversityPicker` + chips de radio 1/3/5/10 km), `RoomCardSkeleton`, `(shared)/rooms/[id]` (detalle + reseñas con `RoomRouteMap` vacío, `RequireRole` para ambos roles, `lat`/`lng` por parámetros de ruta), `RatingCard`.
- Lote B: `reservations` (`useFocusEffect` para recargar, cancelar con PATCH, botón "Calificar" en las confirmadas), `student/reserve/[roomId]` (fechas `AAAA-MM-DD`), `student/rate/[reservationId]` (`StarRatingInput`).
- Lote C: `profile` (PUT del perfil con `ProfileForm`, mis reseñas, cerrar sesión, eliminar cuenta), `student/reviews` (DELETE de reseña).
- Borrar `student/index.tsx` temporal.

**Pendientes de otras personas**
- `uploadPhoto` (a dónde se suben las fotos; debe devolver una URL pública `https`).
- Google Maps: `AddressInput` (autocompletado), mapa y ruta en `RoomRouteMap`.
- Despliegue: app publicada en Expo, backend con HTTPS, variables de entorno.

**Al final**
- Tabla de todo lo no visto en clase para la defensa (ver sección 8) y resumen de cómo se cubre cada punto de la rúbrica de mobile (2.1 a 2.4) y de deployment. Requiere el PDF de la rúbrica.

## 8. Lo no visto en clase (acumulado para la defensa)
| Uso | Cómo defenderlo |
|---|---|
| `useFocusEffect` (de `expo-router`) | Las pestañas siguen montadas, por lo que `useEffect([])` no se repite al volver de un formulario. Misma familia que `useIsFocused`, ya usado en `useShake`. |
| `useLocalSearchParams`, `router.push/replace/back`, `Redirect` | Las láminas muestran `[id].tsx`, pero no cómo leer el parámetro ni navegar por código. |
| `Tabs` con `tabBarIcon` y `tabBarActiveTintColor` | Son opciones de la barra inferior (Bottom Tabs visto en clase). |
| `Ionicons` (`@expo/vector-icons`) | Íconos de la barra y de las tarjetas. |
| `launchCameraAsync` + `requestCameraPermissionsAsync` | Hermano de `launchImageLibraryAsync` (visto): mismo resultado (`canceled`, `assets[0].uri`). |
| `Alert.alert` con arreglo de botones (`style: 'destructive'`) | Se vio `Alert.alert` en el ejemplo de AudioRecorder (Sensors II, lámina 16); aquí se usa su forma completa. |
| Axios con interceptores, Context | Vienen de las semanas de la web. |
| No instalar `@react-navigation/*` | Las láminas lo instalan; en SDK 58 Expo Router ya lo incluye y una copia aparte rompe los hooks. |

## 9. Antes de escribir código
Lee la rúbrica (cuando la tenga), las diapositivas de las semanas 12 y 13 y los archivos actuales de `MuvU---Mobile/src`. Usa **exactamente** los nombres y firmas que ya existen. No los inventes; si dudas, léelos en el repo. Lo que ya está en uso y compila:
- `useFetch((signal) => ..., deps)` → `{ data, loading, error, reload }`.
- `usePagedList<T>((params, signal) => ...)` → estado con `reload`; se muestra con `PagedList` (`list`, `keyExtractor`, `itemLabel`, `header`, `emptyState`, `renderItem`).
- `useForm(initialValues, validate)` → `{ values, setValue, getError, validateAll, setServerErrors, reset }`; `validate` debe ser una función estable (a nivel de módulo).
- `getErrorMessage`, `getErrorStatus`, `mapFieldErrors` (`api/errors`); `validateRequiredText`, `validatePositiveNumber`, `validateUrl` (`utils/validators`); `formatPrice`, `formatArea` (`utils/format`); `useToast().showToast(mensaje, 'error')`; `useAuth()`; `useLandlordId()`.
- UI: `Button` (`title`, `onPress`, `loading`, `disabled`, `variant`), `TextField`, `Chip`, `FormAlert` (`variant`, `message`), `EmptyState` (`icon`, `title`, `description`), `ErrorState` (`message`, `onRetry`), `ScreenLoader` (`message`), `ActionLink`, `RoomCard`.
- `sharedStyles` (`screen`, `content`, `card`, `muted`, `sectionTitle`, `centered`) y `colors` de `constants/theme.ts`.
- Las funciones de `src/api/*.ts` (reservas, pagos, calificaciones, estudiantes, arrendadores): **lee sus nombres y tipos antes de usarlas**.

Al terminar cada lote, corro `npx tsc --noEmit` (tras reiniciar `expo start -c` si hubo rutas nuevas) y te paso el resultado.
