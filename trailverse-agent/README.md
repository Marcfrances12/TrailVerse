# TrailVerse Agent

Servicio independiente del asistente IA de TrailVerse. Corre en el puerto **3001** y comparte la base de datos MongoDB del backend principal (puerto 3000). El servicio HTTP solo **lee** de la base de datos; la escritura de contenido generado por IA se hace con scripts separados.

## Qué hace

- **Chat global** en toda la web: responde sobre rutas, FAQs, alrededores y uso de la web. Usa herramientas para buscar rutas, leer datos de una ruta, buscar lugares cercanos (OpenStreetMap) y geocodificar pueblos.
- **Guía de ruta**: consejos (FAQs generadas por IA), lugares para comer, dormir, transporte y aparcar, y un resumen redactado por IA. Se genera por lotes y se sirve desde la base de datos.
- **Generación de contenido** con IA (scripts): FAQs y guía de lugares para cada ruta.
- Tool calling con máximo 4 rondas. Respuesta en streaming SSE.

## Puesta en marcha

```bash
cd trailverse-agent
cp .env.example .env     # rellena las claves y MONGODB_URI
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
| GET | `/api/agent/rutas/:id/guia` | Consejos, lugares cercanos y resumen de una ruta |
| GET | `/api/agent/rutas/:id/valoracion` | Resumen IA de los comentarios de clientes de una ruta (mín. 3 comentarios) |

Body de `POST /api/agent/chat` (`routeId` es opcional):

```json
{
  "message": "¿Puedo ir con perro?",
  "history": [{ "role": "user", "content": "hola" }, { "role": "assistant", "content": "¡Hola!" }],
  "routeId": "66b000000000000000000001"
}
```

Eventos SSE: `token` (`{ texto }`), `tool` (`{ nombre, estado }`), `done`, `error` (`{ mensaje }`).

## Scripts de generación con IA

Escriben en la colección `rutas`. Por defecto solo procesan las rutas publicadas que aún no tienen el contenido.

```bash
npm run faqs:generar -- --dry-run                  # muestra las FAQs sin guardar
npm run faqs:generar                               # genera FAQs para las rutas sin FAQs
npm run guia:generar -- --slug=ruta-del-pou-clar   # genera la guía de una ruta
npm run guia:generar                               # genera la guía de las rutas que no la tienen
```

Opciones: `--slug=<slug>` limita a una ruta, `--sobrescribir` reemplaza el contenido existente y `--dry-run` no guarda nada.

- **FAQs** (`faqs`): el modelo solo puede afirmar lo que aparece en los datos de la ruta. Lo demás se formula como recomendación. Se valida el JSON antes de guardar.
- **Guía** (`guiaIA`): una sola consulta a Overpass por ruta (restaurantes, alojamientos, transporte y aparcamiento); el modelo redacta el resumen usando solo esos lugares. Overpass público suele estar saturado, así que el script reintenta ante 429 y 503.

## Comentarios de clientes

- **Resumen de valoración** (`/rutas/:id/valoracion`): el modelo principal del chat resume los últimos 60 comentarios (texto y estrellas, sin datos del autor). El resultado se cachea en memoria con una clave que cambia al publicar, editar o borrar un comentario, así que solo se llama al modelo cuando hay cambios. Varias visitas simultáneas comparten la misma llamada. Si la IA falla, se devuelven la media y el total sin resumen (`disponible: false`). No usa el proveedor de respaldo gratuito porque los comentarios son contenido de los usuarios.
- **Sentimiento** (script): clasifica cada comentario como positivo, neutro o negativo, con puntuación de -1 a 1 y temas, y lo guarda en `comments.sentimiento`. El dashboard del admin lo agrega por ruta desde el backend.

```bash
npm run sentimiento:analizar -- --dry-run   # muestra el análisis sin guardar
npm run sentimiento:analizar                # analiza los comentarios pendientes
npm run sentimiento:analizar -- --todos     # vuelve a analizar todos
```

Al editar el texto de un comentario, el backend borra su sentimiento y vuelve a quedar pendiente.

## Proveedores de IA

| Uso | Variables | Proveedor por defecto |
| --- | --- | --- |
| Chat (principal) | `LLM_PROVIDER_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | Groq |
| Chat (respaldo, solo si el principal falla antes de responder) | `LLM_RESPALDO_BASE_URL`, `LLM_RESPALDO_API_KEY`, `LLM_RESPALDO_MODEL` | OpenRouter, modelo `:free` |
| Generación de FAQs y guías | `FAQ_LLM_BASE_URL`, `FAQ_LLM_API_KEY`, `FAQ_LLM_MODEL` | Gemini (nivel gratuito) |

Usa siempre modelos `:free` en el respaldo y comprueba que soportan tools. Los modelos de OpenRouter gratuitos pueden usar los datos para entrenar, así que el respaldo solo debe recibir las peticiones del chat, nunca datos personales.

## Seguridad

- Solo lectura en el servicio HTTP: la conexión desactiva `autoIndex` y `autoCreate`. Recomendado: un usuario de MongoDB con rol `read`.
- Los scripts usan `MONGODB_URI_ESCRITURA` (si se define) con un usuario que solo tenga permiso de escritura sobre `rutas`. Si no se define, usan `MONGODB_URI`.
- Solo expone rutas `published`, activas y no borradas. Del organizador solo se devuelve el nombre.
- `message` máx. 500 caracteres. `history` máx. 10 mensajes con roles `user` o `assistant`.
- Rate limit del chat: 30 peticiones / 10 min por IP. Rate limit de la guía: 60 / 10 min por IP.
- Las claves solo viven en `.env` del servicio y de los scripts. Nunca llegan al frontend.
- Los logs registran metadatos (duración, rondas, tools usadas), nunca el contenido de los mensajes.
