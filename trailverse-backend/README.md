# TrailVerse Backend

API REST para gestionar rutas de senderismo y sus datos asociados. Está construida con Express 5, Mongoose 8, MongoDB y Zod.

## Requisitos y puesta en marcha

- Node.js (se recomienda 20.19+ para trabajar también con el frontend Angular 20).
- MongoDB 6+ local o MongoDB Atlas.

```bash
cd trailverse-backend
npm install
```

Crea manualmente `trailverse-backend/.env` (el repositorio no incluye `.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/rutas_senderismo
NODE_ENV=development
JWT_SECRET=REPLACE_ME_WITH_A_RANDOM_SECRET
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=REPLACE_ME_WITH_A_DIFFERENT_RANDOM_SECRET
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=trailverse-api
JWT_AUDIENCE=trailverse-client
SEED_PASSWORD=una-clave-local-de-al-menos-12-caracteres
```

Genera `JWT_SECRET` y `JWT_REFRESH_SECRET` con al menos 32 bytes aleatorios cada uno, distintos entre sí, y guárdalos solo en `.env`; `.env` está excluido por `.gitignore`. El archivo `.env.example` contiene únicamente placeholders y no sirve como secreto de ejecución.

```bash
npm run dev
```

La API usa `http://localhost:3000` como origen y `/api` como prefijo de recursos. `GET /` devuelve un resumen de rutas disponibles y `GET /api/health` comprueba el estado del servicio.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crea una cuenta de cliente (rol `USER`) con `name`, `email` y `password`; no inicia sesión. Límite: 5 registros por hora y conexión |
| `POST` | `/api/auth/login` | Comprueba email o usuario y contraseña; emite `access_token` y `refresh_token` en cookies. Límite: `LOGIN_MAX_INTENTOS` intentos fallidos cada 15 minutos por IP e identificador (por defecto 10 en producción y 50 en desarrollo) |
| `POST` | `/api/auth/refresh` | Rota el `refresh_token` de la cookie y emite un par nuevo. Sin sesión válida responde 401 con `codigo` `SESSION_REQUIRED` o `SESSION_EXPIRED` |
| `POST` | `/api/auth/logout` | Revoca el access y el refresh actuales y borra ambas cookies; requiere autenticación |
| `GET` | `/api/auth/me` | Devuelve la identidad actual; requiere autenticación |
| `GET` | `/api/profiles/me` | Devuelve el perfil del usuario autenticado |
| `PATCH` | `/api/profiles/me` | Actualiza el perfil propio |
| `GET` | `/api/profiles` | Lista perfiles; solo `ADMIN` |
| `GET` / `PATCH` | `/api/profiles/:userId` | Consulta o modifica un perfil; solo `ADMIN` |

La sesión usa dos tokens HS256 en cookies HttpOnly:

- **`access_token`** (1h, `JWT_EXPIRES_IN`), path `/`. Incluye `sub`, `jti`, `role` y `typ: "access"`, y firma con `JWT_SECRET`. También acepta `Authorization: Bearer <token>`. Logout guarda solo su `jti` en `revokedtokens`.
- **`refresh_token`** (7 días, `JWT_REFRESH_EXPIRES_IN`), path `/api/auth`, para que solo viaje a las rutas de auth. Incluye `sub`, `jti` y `typ: "refresh"`, y firma con `JWT_REFRESH_SECRET`. Cada refresh queda guardado en la colección `refreshsessions` (solo `jti`, usuario, caducidad y `revokedAt`); al usarse se revoca y se emite uno nuevo, así que cada refresh solo sirve una vez.

Un índice TTL elimina las revocaciones y sesiones al caducar. El middleware vuelve a consultar usuario, rol y revocación; si la cuenta se desactiva o cambia el rol, el token deja de servir.

Cuando el access caduca, el cliente llama a `/api/auth/refresh`. Si el refresh también ha caducado o ha sido revocado, la API responde 401 con `codigo` `SESSION_EXPIRED` y borra las cookies; el cliente debe iniciar sesión de nuevo.

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con nodemon |
| `npm start` | Inicia el servidor |
| `npm run seed` | Borra y vuelve a cargar los datos de ejemplo |
| `npm test` | Ejecuta las pruebas automatizadas |

> **Importante:** `seed.js` ejecuta `deleteMany({})` sobre roles, usuarios, hosts, localizaciones, categorías, imágenes, rutas y salidas. Ejecutarlo elimina los datos actuales de esas colecciones y ahora requiere `SEED_PASSWORD`; está bloqueado cuando `NODE_ENV=production`.

## Arquitectura

```text
HTTP → routes → middleware de validación (Zod) → controllers → services → repos → models (Mongoose)
```

Los módulos están separados en `src/routes`, `controllers`, `services`, `repos`, `models` y `validators`. `integrity.service.js` valida relaciones entre entidades; `AppError` y los middlewares centralizan errores y respuestas. Morgan registra accesos en `src/logs/access.log`; Helmet y CORS se configuran en `src/app.js`.

## API

### Recursos

| Recurso | Prefijo | Búsqueda individual |
|---|---|---|
| Rutas | `/api/rutas` | `GET /slug/:slug` |
| Categorías | `/api/categories` | `GET /slug/:slug` |
| Localizaciones | `/api/locations` | `GET /slug/:slug` |
| Hosts | `/api/hosts` | `GET /slug/:slug` |
| Salidas (departures) | `/api/departures` | `GET /sku/:sku` |
| Usuarios | `/api/users` | Por ID |
| Perfiles | `/api/profiles` | `GET /me` propio; `GET /:userId` ADMIN |
| Roles | `/api/roles` | Catálogo fijo `ADMIN`/`USER`, por ID |

### Endpoints CRUD y ciclo de vida

Los recursos CRUD tradicionales ofrecen estas rutas, donde `:id` es un ObjectId de MongoDB. Roles es una excepción: solo permite `GET /api/roles` y `GET /api/roles/:id`; sus documentos son roles internos predefinidos y no se pueden modificar por la API. Perfiles tiene los endpoints específicos indicados arriba. Los listados públicos de catálogo son de solo lectura; sus escrituras y las operaciones de papelera requieren `ADMIN`. Todos los endpoints de `/api/users` requieren `ADMIN`.

| Método | Ruta relativa al prefijo del recurso | Descripción |
|---|---|---|
| `GET` | `/` | Lista recursos; admite los filtros descritos abajo |
| `GET` | `/deleted` | Lista elementos en la papelera |
| `GET` | `/:id` | Obtiene un elemento por ID |
| `POST` | `/` | Crea un elemento |
| `PUT` | `/:id` | Actualiza un elemento |
| `PATCH` | `/:id/activate` | Activa un elemento |
| `PATCH` | `/:id/deactivate` | Desactiva un elemento |
| `DELETE` | `/:id` | Borrado lógico: establece `deleted_at` |
| `PATCH` | `/:id/restore` | Restaura un elemento de la papelera |
| `DELETE` | `/:id/permanent` | Elimina definitivamente |

Por ejemplo, la papelera de hosts es `GET /api/hosts/deleted` y la activación de una salida es `PATCH /api/departures/:id/activate`.

Las búsquedas adicionales son:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/rutas/slug/:slug` | Ruta por slug |
| `GET` | `/api/categories/slug/:slug` | Categoría por slug |
| `GET` | `/api/locations/slug/:slug` | Localización por slug |
| `GET` | `/api/hosts/slug/:slug` | Host por slug |
| `GET` | `/api/departures/sku/:sku` | Salida por SKU |

Las rutas específicas (`/deleted`, `/slug/...` y `/sku/...`) se declaran antes de `/:id` para evitar colisiones.

### Filtros de listado

Los booleanos se envían como texto `true` o `false` en la query. Todos los listados aceptan `isActive=true|false`.

| Recurso | Filtros adicionales |
|---|---|
| Rutas | `dificultad=facil|media|dificil`, `provincia` (coincidencia parcial, sin distinguir mayúsculas), `circular=true|false`, `status=draft|published|archived` |
| Categorías | `type=ruta` |
| Localizaciones | `provincia` (coincidencia parcial) |
| Hosts | Ninguno |
| Salidas | `rutaId` (ObjectId), `status=open|full|cancelled` |
| Usuarios | Ninguno |
| Roles | Ninguno |

Ejemplos:

```text
GET /api/rutas?dificultad=media&provincia=Alicante&isActive=true
GET /api/categories?type=ruta&isActive=true
GET /api/locations?provincia=Valencia&isActive=true
GET /api/departures?status=open&isActive=true
GET /api/departures/sku/CALALI-MED-4,8
```

### Shop (lectura pública)

Módulo de catálogo para el frontend. Solo muestra rutas con `status=published`, `isActive=true` y `deleted_at=null`, independientemente de lo que se envíe en la query.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/shop/rutas` | Listado paginado con filtros, búsqueda y orden |
| `GET` | `/api/shop/home` | Carruseles de categorías, hosts y locations con número de rutas |
| `GET` | `/api/shop/filtros` | Valores para los desplegables: dificultades, modos de categoría, opciones de `sort` y listas completas de categorías, hosts y locations |

Parámetros de `GET /api/shop/rutas`:

| Parámetro | Descripción |
|---|---|
| `q` | Texto contenido en el nombre, sin distinguir mayúsculas |
| `categoria` | Uno o varios slugs separados por comas (máximo 10), por ejemplo `montana,playa` |
| `categoryMode` | `any` (por defecto: al menos una categoría) o `all` (todas) |
| `host` / `localizacion` | Slug del host o de la localización, por ejemplo `juan-garcia` |
| `dificultad` | `facil`, `media` o `dificil` |
| `sort` | `nombre`, `created_at`, `distanciaKm` o `duracionHoras`; prefijo `-` para descendente. Por defecto `-created_at` |
| `page` | Página, desde 1 (por defecto 1) |
| `limit` | Elementos por página, de 1 a 50 (por defecto 12) |

Respuesta: `{ ok, total, page, limit, totalPages, data }`. Cada ruta incluye `coverImage`, `precioDesde` (precio más bajo de sus salidas abiertas y futuras, o `null`) y las relaciones de categoría, host y localización con datos públicos.

`GET /api/shop/home?limit=10` (máximo 20) devuelve `{ categories, hosts, locations }`, cada una con `_id`, `nombre`, `slug` y `total`, ordenadas por número de rutas.

`GET /api/shop/rutas/:slug` devuelve la ruta visible con sus imágenes (`images`), `coverImage`, categorías, host (solo `name` y `slug`) y localización. Responde 404 si la ruta no es visible.

`GET /api/shop/rutas/:slug/departures` devuelve las salidas abiertas, activas y futuras de la ruta, ordenadas por fecha de inicio. `stock` indica las plazas libres.

`GET /api/shop/filtros` devuelve `{ dificultades, categoryModes, sort, categories, hosts, locations }`. Las listas de categorías, hosts y locations son completas, ordenadas por nombre, y solo incluyen entradas activas con al menos una ruta visible. Los valores de `sort` se pueden enviar tal cual en `GET /api/shop/rutas`.

### Estados, relaciones y reglas de integridad

- `isActive` representa activación; `deleted_at` representa papelera. Desactivar no es lo mismo que eliminar.
- El borrado normal es lógico. `/permanent` es irreversible y comprueba que no haya dependencias que lo impidan.
- Los usuarios requieren uno de los roles fijos `ADMIN` o `USER`; `organizer` ya no es un rol admitido por la aplicación.
- `Profile` depende de `User` mediante `userId` único; `User` no almacena `profileId`. Los usuarios solo pueden consultar/modificar su propio perfil; ADMIN puede acceder a todos.
- `Profile` almacena `name` (obligatorio), `avatarUrl`, `bio` y `phone`. `User` almacena email, rol y contraseña; no tiene campo `name`.
- Crear un usuario (`POST /api/users`) crea también su perfil con el nombre; actualizar `name` (`PUT /api/users/:id`) modifica el perfil. Las respuestas de usuarios incluyen `name`, leído del perfil.
- Cada usuario tiene un único perfil. Si no existe, las consultas de perfil devuelven 404.
- Los hosts pueden asociarse opcionalmente a usuarios activos; el usuario asociado debe tener un rol activo.
- Las rutas requieren una localización activa y solo admiten hosts y categorías activos en sus relaciones.
- Las salidas requieren una ruta activa. El stock no puede superar el aforo y la fecha final no puede preceder a la inicial.
- Al crear una ruta se genera un slug único, que se recalcula si cambia el nombre.
- El SKU de salida se genera a partir de localización, provincia, dificultad y distancia. Si hay colisión, se añade una secuencia; al cambiar esos atributos de la ruta se regeneran los SKU relacionados.
- Las imágenes de rutas se reciben como URLs en `coverImage`/`images`; no hay un endpoint separado de subida de archivos.

### Respuestas y validación

Las respuestas de colección usan `{ "ok": true, "total": n, "data": [...] }`; los recursos individuales usan `{ "ok": true, "data": {...} }`. Los errores se procesan centralmente e incluyen `ok: false` y un mensaje; los errores de validación pueden incluir detalles por campo. Por ejemplo:

```json
{
  "ok": false,
  "error": "Error de validación",
  "details": [
    { "origen": "body", "campo": "nombre", "mensaje": "El nombre debe tener al menos 3 caracteres" }
  ]
}
```

Los esquemas Zod validan body, parámetros y queries; los esquemas de escritura rechazan campos no permitidos.

## Datos de ejemplo

```bash
npm run seed
```

Carga roles `ADMIN` y `USER`, siete usuarios demo, dieciséis localizaciones, seis hosts, doce categorías, veinte rutas, unas sesenta salidas y unas cien imágenes. Las imágenes son fotos de Wikimedia Commons, con licencia libre, y cada ruta tiene entre tres y cinco. Los usuarios demo reciben hashes Argon2id derivados de `SEED_PASSWORD`; todos comparten esa clave, por lo que debe usarse únicamente en desarrollo. **Antes de insertar, vacía las colecciones del proyecto.**

## Seguridad y alcance

El backend configura Helmet, CORS, validación de entradas y manejo centralizado de errores. `auth.service.js` gestiona el login, verifica hashes scrypt heredados y los actualiza tras un login válido. Las cuentas se crean mediante `POST /api/users`, exclusivo de ADMIN, mediante el seed de desarrollo, o por registro público de clientes en `POST /api/auth/register` (siempre con rol `USER`). Las credenciales nuevas se hashean con Argon2id. La API aplica RBAC para ADMIN y ABAC para propiedad de perfiles. Las lecturas del catálogo son públicas; escritura de catálogo y administración de usuarios son exclusivas de ADMIN. No hay aún modelo ni endpoints de reservas o Experience; no se aplican permisos sobre recursos inexistentes.

## Documentación relacionada

- [README general](../README.md)
- [README del frontend](../trailverse-frontend/README.md)
