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
```

```bash
npm run dev
```

La API usa `http://localhost:3000` como origen y `/api` como prefijo de recursos. `GET /` devuelve un resumen de rutas disponibles y `GET /api/health` comprueba el estado del servicio.

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con nodemon |
| `npm start` | Inicia el servidor |
| `npm run seed` | Borra y vuelve a cargar los datos de ejemplo |

> **Importante:** `seed.js` ejecuta `deleteMany({})` sobre roles, usuarios, hosts, localizaciones, categorías, imágenes, rutas y salidas. Ejecutarlo elimina los datos actuales de esas colecciones. No hay script de tests definido en el backend.

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
| Roles | `/api/roles` | Por ID |

### Endpoints CRUD y ciclo de vida

Todos los recursos anteriores ofrecen estas rutas, donde `:id` es un ObjectId de MongoDB:

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
- Los usuarios requieren un rol activo. Un rol no se puede desactivar mientras tenga usuarios activos asignados; los usuarios inactivos no bloquean esa operación.
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

Carga roles `admin`, `organizer` y `user`, usuarios demo, cinco localizaciones, dos hosts, cinco categorías, cinco rutas, seis salidas e imágenes. **Antes de insertar, vacía las colecciones del proyecto.** Los hashes de contraseña del seed son placeholders y no son credenciales de acceso.

## Seguridad y alcance

El backend configura Helmet, CORS, validación de entradas y manejo centralizado de errores. Aunque hay CRUD de roles y permisos, el proyecto actualmente no implementa login, tokens ni middleware que aplique autorización por permisos; no debe considerarse protegido para exposición pública.

## Documentación relacionada

- [README general](../README.md)
- [README del frontend](../trailverse-frontend/README.md)
