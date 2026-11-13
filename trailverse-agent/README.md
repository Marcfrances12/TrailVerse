# TrailVerse Agent

Servicio independiente del asistente IA de TrailVerse. Corre en el puerto **3001** y comparte la base de datos MongoDB del backend principal (puerto 3000), en **solo lectura**.

## Qué hace

- Responde FAQs de una ruta, datos de dificultad, distancia y duración.
- Busca restaurantes, bares, alojamientos, transporte público y aparcamientos cercanos (OpenStreetMap / Overpass).
- Geocodifica pueblos o zonas (OpenStreetMap / Nominatim).
- Tool calling con máximo 4 rondas. Respuesta en streaming SSE.

## Puesta en marcha

```bash
cd trailverse-agent
cp .env.example .env     # rellena LLM_API_KEY y MONGODB_URI
npm install
npm run dev              # http://localhost:3001
npm test
```

El `.npmrc` activa `legacy-peer-deps` porque `openai` declara un peer opcional `zod@^3`, y el proyecto usa `zod@4`, igual que el backend.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| POST | `/api/agent/chat` | Chat con streaming SSE |

Body de `POST /api/agent/chat`:

```json
{
  "message": "¿Puedo ir con perro?",
  "history": [{ "role": "user", "content": "hola" }, { "role": "assistant", "content": "¡Hola!" }],
  "routeId": "66b000000000000000000001"
}
```

Eventos SSE: `token` (`{ texto }`), `tool` (`{ nombre, estado }`), `done`, `error` (`{ mensaje }`).

## Seguridad

- Solo lectura: la conexión desactiva `autoIndex` y `autoCreate`. Recomendado: un usuario de MongoDB con rol `read`.
- Solo expone rutas `published`, activas y no borradas. Del organizador solo se devuelve el nombre.
- `message` máx. 500 caracteres. `history` máx. 10 mensajes con roles `user` o `assistant`.
- Rate limit de 20 peticiones / 10 min por IP.
- Las claves solo viven en `.env` del servicio. Nunca llegan al frontend.
- Los logs registran metadatos (duración, rondas, tools usadas), nunca el contenido de los mensajes.
