# TrailVerse Frontend

SPA en Angular 20 para la gestión de rutas de senderismo, conectada a la API REST de TrailVerse.

## Requisitos

- Node.js 18+
- Angular CLI 20+

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (http://localhost:4200) |
| `npm run build` | Build de producción |
| `npm run watch` | Build en modo watch |
| `npm test` | Tests unitarios (Karma) |

## Estructura

```
src/app/
├── core/
│   ├── interceptors/          # error.interceptor, loading.interceptor
│   ├── models/                # Ruta, RutaInput, RutasFiltros, ApiResponse
│   ├── services/              # ApiService, RutasApiService, LoadingService
│   └── stores/                # RutasStore (Signals)
├── features/
│   └── rutas/
│       ├── pages/
│       │   ├── ruta-list/     # Listado con tabla admin
│       │   ├── ruta-detail/   # Detalle de ruta
│       │   └── ruta-form/     # Crear/editar ruta
│       └── rutas.routes.ts    # Rutas con lazy loading
├── layouts/
│   └── main-layout/           # Navbar + Footer + RouterOutlet
├── shared/
│   ├── components/            # Navbar, AdminTable, ActionBotones, SkeletonGrid, EmptyState, ErrorState, Loader
│   └── utils/                 # formatos, validators, errores
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── app.config.ts              # Providers (router, http, interceptores)
├── app.routes.ts              # Rutas raíz
├── app.html
└── app.ts                     # Componente raíz
```

## Arquitectura

### Estado global (Signals)

El `RutasStore` es un servicio inyectable que usa Signals para mantener el estado global:

- **Caché** de rutas cargadas (una sola petición al listar)
- **Sincronización** automática entre listado y detalle
- **Estado compartido**: `rutas`, `seleccionada`, `cargando`, `error`, `filtros`

### Flujo de datos

```
Componente → RutasStore → RutasApiService → ApiService → HTTP API
                ↑                                        ↓
                └───────────── Interceptores ←────────────┘
```

### Interceptores

- **error.interceptor**: captura errores HTTP y de red, muestra toast con SweetAlert2
- **loading.interceptor**: incrementa/decrementa contador de peticiones para el spinner global

### Componentes principales

| Componente | Descripción |
|------------|-------------|
| `AdminTable` | Tabla de rutas estilo panel admin con acciones por fila |
| `ActionBotones` | Botones de activar/desactivar, editar y borrar |
| `RutaList` | Página principal con la tabla de rutas |
| `RutaDetail` | Detalle completo de una ruta |
| `RutaForm` | Formulario reactivo para crear/editar rutas |

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `API_URL` | `http://localhost:3000/api` | URL base de la API |
| `TIMEOUT_MS` | `10000` | Timeout de peticiones HTTP |

## Documentación

- [README general](../README.md)
- [Backend README](../trailverse-backend/README.md)
