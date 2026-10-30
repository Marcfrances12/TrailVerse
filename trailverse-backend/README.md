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
JWT_ISSUER=trailverse-api
JWT_AUDIENCE=trailverse-client
SEED_PASSWORD=una-clave-local-de-al-menos-12-caracteres
```

Genera `JWT_SECRET` con al menos 32 bytes aleatorios y guárdalo solo en `.env`; `.env` está excluido por `.gitignore`. El archivo `.env.example` contiene únicamente placeholders y no sirve como secreto de ejecución.

```bash
npm run dev
```

La API usa `http://localhost:3000` como origen y `/api` como prefijo de recursos. `GET /` devuelve un resumen de rutas disponibles y `GET /api/health` comprueba el estado del servicio.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Comprueba email y contraseña y devuelve un JWT |
| `POST` | `/api/auth/logout` | Revoca el JWT actual; requiere `Authorization: Bearer <token>` |
| `GET` | `/api/auth/me` | Devuelve la identidad actual; requiere `Authorization: Bearer <token>` |
| `GET` | `/api/profiles/me` | Devuelve el perfil del usuario autenticado |
| `PATCH` | `/api/profiles/me` | Actualiza el perfil propio |
| `GET` | `/api/profiles` | Lista perfiles; solo `ADMIN` |
| `GET` / `PATCH` | `/api/profiles/:userId` | Consulta o modifica un perfil; solo `ADMIN` |

El JWT está firmado con HS256, incluye `sub`, `jti` y el claim `role` (`USER` o `ADMIN`), y expira según `JWT_EXPIRES_IN`. Logout guarda solo el `jti` en la colección `revokedtokens`, nunca el token completo; un índice TTL elimina las revocaciones al expirar el JWT. El middleware vuelve a consultar usuario, rol y revocación; si la cuenta se desactiva, el rol cambia o se cierra la sesión, el token deja de servir.

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

Carga roles `ADMIN` y `USER`, usuarios demo, cinco localizaciones, dos hosts, cinco categorías, cinco rutas, seis salidas e imágenes. Los usuarios demo reciben hashes Argon2id derivados de `SEED_PASSWORD`; todos comparten esa clave, por lo que debe usarse únicamente en desarrollo. **Antes de insertar, vacía las colecciones del proyecto.**

## Seguridad y alcance

El backend configura Helmet, CORS, validación de entradas y manejo centralizado de errores. `auth.service.js` gestiona el login, verifica hashes scrypt heredados y los actualiza tras un login válido. Las cuentas se crean mediante `POST /api/users`, exclusivo de ADMIN, o mediante el seed de desarrollo; no hay registro público. Las credenciales nuevas se hashean con Argon2id. La API aplica RBAC para ADMIN y ABAC para propiedad de perfiles. Las lecturas del catálogo son públicas; escritura de catálogo y administración de usuarios son exclusivas de ADMIN. No hay aún modelo ni endpoints de reservas o Experience; no se aplican permisos sobre recursos inexistentes.

## Documentación relacionada

- [README general](../README.md)
- [README del frontend](../trailverse-frontend/README.md)
