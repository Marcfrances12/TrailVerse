# TrailVerse Frontend

SPA de administración y consulta de rutas de senderismo, construida con Angular 20 y conectada a la API REST de TrailVerse.

## Requisitos e instalación

Se recomienda Node.js 20.19+ (o versión compatible con Angular 20) y npm.

```bash
cd trailverse-frontend
npm install
npm start
```

Abre `http://localhost:4200`. La aplicación usa `http://localhost:3000/api` como API por defecto; inicia el backend antes de usar las pantallas con datos.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Servidor Angular de desarrollo |
| `npm run build` | Build de producción |
| `npm run watch` | Build de desarrollo en modo watch |
| `npm test` | Tests unitarios con Karma |

## Módulos y navegación

Los módulos se cargan de forma lazy. Las vistas de gestión incluyen listados, formularios y operaciones según el recurso:

| Sección | Rutas principales |
|---|---|
| Rutas | `/rutas`, `/rutas/new`, `/rutas/:slug`, `/rutas/:slug/edit` |
| Localizaciones | `/admin/localizaciones`, `/admin/localizaciones/new`, `/admin/localizaciones/:id/edit` |
| Categorías | `/admin/categorias`, `/admin/categorias/new`, `/admin/categorias/:id/edit` |
| Hosts | `/admin/hosts`, `/admin/hosts/new`, `/admin/hosts/:id/edit` |
| Usuarios | `/admin/usuarios`, `/admin/usuarios/new`, `/admin/usuarios/:id/edit` |
| Salidas | `/admin/departures`, `/admin/departures/new`, `/admin/departures/:id/edit` |
| Roles | `/admin/roles`, `/admin/roles/new`, `/admin/roles/:id/edit` |

Las pantallas de listado admiten el ciclo de vida implementado por cada recurso: activar/desactivar, papelera, restaurar y borrar definitivamente cuando corresponde. La papelera tiene vistas separadas con acciones de restauración y borrado permanente.

### Funciones de formularios y listados

- Las rutas se consultan por slug y su formulario permite gestionar varias imágenes mediante URLs, con vista previa; quitar una imagen solo modifica el formulario hasta guardar.
- El listado de hosts muestra el nombre del usuario asociado, o `—` si no hay asociación.
- El selector de rol en formularios de usuario carga solo roles activos.
- El formulario de rutas ofrece solo localizaciones, categorías y hosts activos; el de salidas, rutas activas. El selector de rol para usuarios también filtra roles activos.
- Las operaciones destructivas solicitan confirmación con SweetAlert2.

> Las rutas `/admin/...` son pantallas de interfaz, no una garantía de control de acceso: actualmente no hay login ni guards de autorización.

## Arquitectura

```text
Página/componente → Store (Signals) → API service → ApiService → HttpClient → backend
                                                               ↕
                                                interceptores de carga y errores
```

- Componentes standalone con detección `OnPush` y rutas lazy-loaded.
- Stores por recurso mantienen datos y estado reactivo con Signals.
- Servicios API separan las llamadas HTTP de la presentación.
- Formularios reactivos con validación local; la API también valida las peticiones.
- `loadingInterceptor` coordina el indicador global de carga; `errorInterceptor` normaliza errores HTTP y los comunica con SweetAlert2.
- `shared/` contiene piezas reutilizables como la shell de listados, tablas, estados vacío/error, skeletons y utilidades.

## Configuración de API

Los archivos están en `environments/` en la raíz del proyecto (no dentro de `src/`):

- `environments/environment.development.ts` para desarrollo.
- `environments/environment.ts` para build de producción.

Ambos apuntan actualmente a `http://localhost:3000/api` y tienen un timeout de `10000` ms. Para cambiar el backend, modifica `API_URL` en el entorno correspondiente. `TIMEOUT_MS` define el tiempo máximo de espera de las peticiones gestionadas por `ApiService`.

## Estructura

```text
trailverse-frontend/
├── src/app/
│   ├── core/              # Modelos, servicios, stores e interceptores
│   ├── features/          # Rutas, localizaciones, categorías, hosts, usuarios, salidas y roles
│   ├── layouts/           # Layout principal, navegación y panel lateral
│   └── shared/            # Componentes y utilidades comunes
└── environments/         # Configuración development/production
```

## Documentación relacionada

- [README general](../README.md)
- [README del backend y referencia de API](../trailverse-backend/README.md)
