# TrailVerse Backend

API REST para la gestión de rutas de senderismo, construida con Express 5 y MongoDB.

## Requisitos

- Node.js 18+
- MongoDB 6+ (local o MongoDB Atlas)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con nodemon |
| `npm start` | Servidor en producción |
| `npm run seed` | Cargar datos de ejemplo |

## Variables de entorno

Crear archivo `.env` en la raíz del backend:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/rutas_senderismo
NODE_ENV=development
```

## Estructura

```
src/
├── config/
│   └── database.js              # Conexión Mongoose
├── controllers/
│   └── rutas.controller.js      # Manejadores HTTP
├── middlewares/
│   ├── error.middleware.js      # notFound + errorHandler global
│   └── validate.middleware.js   # Validación con Zod (body, params, query)
├── models/
│   └── ruta.model.js            # Schema Mongoose de Ruta
├── repos/
│   └── rutas.repo.js            # Operaciones CRUD con Mongoose
├── routes/
│   └── rutas.routes.js          # Definición de endpoints
├── services/
│   └── rutas.service.js         # Lógica de negocio
├── utils/
│   ├── AppError.js              # Clase de error personalizada
│   ├── escapeRegex.js           # Escapar caracteres regex
│   ├── slug.js                  # Generar slug con slugify
│   └── validar.js               # Helpers de validación Zod
├── validators/
│   └── rutas.validator.js       # Esquemas Zod (params, body, query)
├── app.js                       # Configuración Express
└── logs/                        # Logs de acceso (accesos.log)
```

## Arquitectura

```
HTTP Request
    ↓
Route (rutas.routes.js)
    ↓
Middleware (validate.middleware) → Zod valida body, params, query
    ↓
Controller (rutas.controller.js) → Maneja la petición HTTP
    ↓
Service (rutas.service.js) → Lógica de negocio, validaciones adicionales
    ↓
Repo (rutas.repo.js) → Operaciones con MongoDB
    ↓
Model (ruta.model.js) → Schema Mongoose
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/rutas` | Listar rutas (filtros por query) |
| GET | `/api/rutas/deleted` | Listar rutas eliminadas |
| GET | `/api/rutas/slug/:slug` | Obtener por slug |
| GET | `/api/rutas/:id` | Obtener por ID |
| POST | `/api/rutas` | Crear ruta |
| PUT | `/api/rutas/:id` | Actualizar ruta |
| PATCH | `/api/rutas/:id/activate` | Activar ruta |
| PATCH | `/api/rutas/:id/deactivate` | Desactivar ruta |
| DELETE | `/api/rutas/:id` | Soft delete |
| GET | `/api/health` | Health check |

### Filtros de búsqueda (GET /api/rutas)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `dificultad` | string | `facil`, `media`, `dificil` |
| `provincia` | string | Búsqueda parcial (case-insensitive) |
| `circular` | boolean | `true` o `false` |
| `isActive` | boolean | `true` o `false` |
| `status` | string | `draft`, `published`, `archived` |

## Modelo de datos

### Ruta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre de la ruta |
| `descripcion` | string | Descripción detallada |
| `dificultad` | enum | `facil`, `media`, `dificil` |
| `distanciaKm` | number | Distancia en kilómetros |
| `desnivelM` | number | Desnivel en metros |
| `duracionHoras` | number | Duración en horas |
| `ubicacion` | string | Localización |
| `provincia` | string | Provincia |
| `circular` | boolean | Ruta circular o lineal |
| `imagen` | string | URL de imagen |
| `slug` | string | Identificador único (generado automáticamente) |
| `isActive` | boolean | Visibilidad de la ruta |
| `status` | enum | `draft`, `published`, `archived` |
| `deleted_at` | date/null | Marca de soft delete |
| `created_at` | date | Fecha de creación |
| `updated_at` | date | Fecha de última actualización |

## Validaciones

### Frontend

- Formularios reactivos con validadores de Angular
- Validación de URL personalizada
- Mensajes de error accesibles
- Errores de servidor mostrados por campo

### Backend

- Esquemas Zod estrictos (rechaza campos desconocidos)
- Validación de ObjectId en parámetros
- Validación de tipos y rangos en body
- Respuestas de error estructuradas:

```json
{
  "ok": false,
  "error": "Error de validación",
  "details": [
    {
      "origen": "body",
      "campo": "nombre",
      "mensaje": "El nombre debe tener al menos 3 caracteres"
    }
  ]
}
```

## Seguridad

- **Helmet**: headers HTTP seguros
- **CORS**: configurado para desarrollo
- **Validación**: todos los inputs validados con Zod
- **Soft delete**: los datos no se eliminan físicamente

## Datos de ejemplo

```bash
npm run seed
```

Inserta 5 rutas de ejemplo en la base de datos.

## Documentación

- [README general](../README.md)
- [Frontend README](../trailverse-frontend/README.md)
