# TrailVerse

Plataforma de gestión de rutas de senderismo. Aplicación full-stack con frontend en Angular 20 y API REST en Express + MongoDB.

## Requisitos

- **Node.js** 18+
- **MongoDB** 6+ (local o Atlas)
- **Angular CLI** 20+

## Tecnologías

| Capa | Tecnologías |
|------|-------------|
| Frontend | Angular 20, TypeScript, Tailwind CSS, RxJS, Signals, Reactive Forms, SweetAlert2 |
| Backend | Node.js, Express 5, Mongoose 8, Zod, Morgan, Helmet |
| Base de datos | MongoDB |

## Estructura

```
TrailVerse/
├── trailverse-frontend/          # SPA Angular 20
│   ├── src/app/
│   │   ├── core/                 # Servicios, store, interceptores, modelos
│   │   ├── features/rutas/       # Módulo de rutas (pages)
│   │   ├── layouts/              # Layout principal
│   │   ├── shared/               # Componentes y utilidades compartidas
│   │   └── environments/          # Configuración por entorno
│   └── angular.json
├── trailverse-backend/           # API REST Express
│   ├── src/
│   │   ├── config/               # Conexión a MongoDB
│   │   ├── controllers/          # Controladores HTTP
│   │   ├── middlewares/          # Validación y manejo de errores
│   │   ├── models/               # Modelos Mongoose
│   │   ├── repos/                # Capa de acceso a datos
│   │   ├── routes/               # Definición de rutas
│   │   ├── services/             # Lógica de negocio
│   │   ├── utils/                # Utilidades (slug, validación, errores)
│   │   └── validators/           # Esquemas Zod
│   └── seed.js                   # Datos de ejemplo
└── README.md
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/rutas` | Listar rutas (con filtros: `dificultad`, `provincia`, `circular`, `isActive`, `status`) |
| GET | `/api/rutas/deleted` | Listar rutas eliminadas (soft delete) |
| GET | `/api/rutas/slug/:slug` | Obtener ruta por slug |
| GET | `/api/rutas/:id` | Obtener ruta por ID |
| POST | `/api/rutas` | Crear nueva ruta |
| PUT | `/api/rutas/:id` | Actualizar ruta |
| PATCH | `/api/rutas/:id/activate` | Activar ruta |
| PATCH | `/api/rutas/:id/deactivate` | Desactivar ruta |
| DELETE | `/api/rutas/:id` | Eliminar ruta (soft delete) |
| GET | `/api/health` | Estado de la API |

## Arquitectura

### Frontend (Angular 20)

```
Componente → RutasStore (Signals) → RutasApiService → ApiService → HTTP
                                                      ↓
                                        Interceptores (error + loading)
```

- **Standalone Components** sin módulos
- **Signals** para estado reactivo global (Store con caché)
- **Lazy Loading** del módulo de rutas
- **Interceptores funcionales** para errores y loading global

### Backend (Express 5)

```
Route → Middleware (validate) → Controller → Service → Repo → Model (Mongoose)
```

- **Arquitectura en capas** con separación de responsabilidades
- **Validación** con Zod en body, params y query
- **Soft delete** con campo `deleted_at`
- **Slug único** generado automáticamente desde el nombre
- **Manejo centralizado de errores** con AppError

## Instalación y ejecución

### Backend

```bash
cd trailverse-backend
npm install
cp .env.example .env    # Configura MONGODB_URI si es necesario
npm run dev             # Desarrollo (nodemon)
npm run seed            # Cargar datos de ejemplo
```

La API estará disponible en `http://localhost:3000/api`.

### Frontend

```bash
cd trailverse-frontend
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

## Documentación específica

- [Frontend README](./trailverse-frontend/README.md)
- [Backend README](./trailverse-backend/README.md)
