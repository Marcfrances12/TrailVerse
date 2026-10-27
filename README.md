# TrailVerse

Plataforma full-stack para explorar y administrar rutas de senderismo, sus localizaciones, categorías, anfitriones, salidas y usuarios.

## Tecnologías y requisitos

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 20, TypeScript, Tailwind CSS, RxJS, Signals, formularios reactivos y SweetAlert2 |
| Backend | Node.js, Express 5, Mongoose 8, Zod, Helmet y Morgan |
| Base de datos | MongoDB 6+ (local o Atlas) |

Se recomienda Node.js 20.19+ (o una versión compatible con Angular 20) y npm.

## Funcionalidades

- Consulta de rutas con filtros por dificultad, provincia, circularidad, estado y disponibilidad.
- Ficha de ruta por slug, con anfitrión, localización, categorías, punto geográfico y galería de imágenes por URL.
- Administración de rutas, categorías, localizaciones, hosts, salidas, usuarios y roles.
- Activación/desactivación, papelera, restauración y borrado permanente para los recursos compatibles.
- Salidas con SKU único, fecha, precio, aforo, stock y estado.
- Validación de datos en formularios y API, además de tratamiento centralizado de errores.

> Hay pantallas de administración y gestión de permisos de roles, pero actualmente no hay inicio de sesión ni protección de rutas/API mediante autenticación.

## Estructura del repositorio

```text
TrailVerse/
├── trailverse-frontend/                 # SPA Angular
│   ├── environments/                    # URL de API y timeout por configuración
│   └── src/app/
│       ├── core/                        # Modelos, servicios, stores e interceptores
│       ├── features/                    # Rutas, localizaciones, categorías, hosts,
│       │                                 # usuarios, salidas y roles
│       ├── layouts/                     # Navegación y layout
│       └── shared/                      # Componentes y utilidades reutilizables
├── trailverse-backend/                  # API REST Express/Mongoose
│   ├── src/                             # Rutas, controladores, servicios, repos y modelos
│   └── seed.js                          # Reinicializa la base de datos con datos demo
└── README.md
```

## Puesta en marcha

### Backend

Se necesita una instancia de MongoDB. En `trailverse-backend`, instala dependencias y crea manualmente un archivo `.env` (no se incluye `.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/rutas_senderismo
NODE_ENV=development
```

```bash
cd trailverse-backend
npm install
npm run dev
```

La API queda en `http://localhost:3000`, con prefijo `/api`. El endpoint de salud es `GET /api/health`.

**Cuidado:** `npm run seed` borra primero los documentos existentes de las colecciones de TrailVerse y después carga datos de ejemplo. No lo ejecutes contra una base de datos con datos que quieras conservar.

### Frontend

```bash
cd trailverse-frontend
npm install
npm start
```

La aplicación queda en `http://localhost:4200`. La URL base y el timeout de la API se configuran en `trailverse-frontend/environments/environment.development.ts` y `environment.ts` (por defecto, `http://localhost:3000/api` y 10 segundos).

## Módulos de la API

Los recursos son `/api/rutas`, `/api/categories`, `/api/locations`, `/api/hosts`, `/api/departures`, `/api/users` y `/api/roles`. Todos ofrecen listado y operaciones de gestión, filtros por `isActive` y gestión de elementos eliminados. Rutas, hosts, categorías y localizaciones se consultan por slug; las salidas, por SKU.

Consulta la referencia completa en el [README del backend](./trailverse-backend/README.md) y las secciones de la SPA en el [README del frontend](./trailverse-frontend/README.md).

## Comandos útiles

| Proyecto | Comando | Uso |
|---|---|---|
| Backend | `npm run dev` | Servidor de desarrollo |
| Backend | `npm start` | Inicia el servidor |
| Backend | `npm run seed` | Reinicializa y carga datos demo (**destructivo**) |
| Frontend | `npm start` | Servidor Angular de desarrollo |
| Frontend | `npm run build` | Compilación de producción |
| Frontend | `npm test` | Tests unitarios con Karma |
