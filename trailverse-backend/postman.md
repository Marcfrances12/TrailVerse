# Pruebas de la API con Postman

Base URL:

```text
http://localhost:3000
```

Antes de probar los endpoints:

```bash
npm install
npm run seed
npm run dev
```

---

## 1. Comprobar la API

### GET

```text
GET http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "OK",
  "message": "API funcionando correctamente"
}
```

---

## 2. Obtener todas las rutas

### GET

```text
GET http://localhost:3000/api/rutas
```

Debe devolver las rutas introducidas mediante `seed.js`.

---

## 3. Filtrar por dificultad

### GET

```text
GET http://localhost:3000/api/rutas?dificultad=facil
```

Valores permitidos:

```text
facil
media
dificil
```

---

## 4. Filtrar por provincia

### GET

```text
GET http://localhost:3000/api/rutas?provincia=Valencia
```

---

## 5. Filtrar rutas circulares

### GET

```text
GET http://localhost:3000/api/rutas?circular=true
```

Para rutas no circulares:

```text
GET http://localhost:3000/api/rutas?circular=false
```

---

## 6. Obtener una ruta por ID

Primero realiza:

```text
GET http://localhost:3000/api/rutas
```

Copia el valor de `_id`.

Después:

```text
GET http://localhost:3000/api/rutas/AQUI_EL_ID
```

Ejemplo:

```text
GET http://localhost:3000/api/rutas/68d000000000000000000001
```

El ID del ejemplo es ficticio. Utiliza el que te devuelva MongoDB.

---

## 6.0 Ver las rutas borradas (soft delete)

### GET

```text
GET http://localhost:3000/api/rutas/deleted
```

Devuelve solo las rutas con `deleted_at` rellenado, la última borrada primero. Prueba primero el DELETE (apartado 10) y vuelve aquí.

---

## 6.1 Obtener una ruta por slug

### GET

```text
GET http://localhost:3000/api/rutas/slug/ruta-del-montgo
```

El slug aparece en el campo `slug` de cada ruta. Si no existe devuelve `404`.

---

## 7. Crear una ruta

### POST

```text
POST http://localhost:3000/api/rutas
```

En Postman:

**Body → raw → JSON**

```json
{
  "nombre": "Ruta de prueba",
  "descripcion": "Ruta creada desde Postman",
  "dificultad": "facil",
  "distanciaKm": 5.5,
  "desnivelM": 180,
  "duracionHoras": 2,
  "ubicacion": "Ontinyent",
  "provincia": "Valencia",
  "circular": true,
  "imagen": "https://ejemplo.com/ruta.jpg"
}
```

Debe devolver `201 Created` e incluir `slug`, `isActive: true`, `status: "published"`, `created_at`, `updated_at` y `deleted_at: null`.

Si creas otra ruta con el mismo nombre, el slug será `ruta-de-prueba-2`.

Guarda el `_id` de la respuesta porque lo utilizaremos en PUT y DELETE.

---

## 8. Actualizar una ruta

### PUT

```text
PUT http://localhost:3000/api/rutas/AQUI_EL_ID
```

Body:

```json
{
  "nombre": "Ruta de prueba modificada",
  "descripcion": "Descripción modificada desde Postman",
  "dificultad": "media",
  "distanciaKm": 7,
  "desnivelM": 250,
  "duracionHoras": 2.5,
  "ubicacion": "Ontinyent",
  "provincia": "Valencia",
  "circular": false,
  "imagen": "https://ejemplo.com/ruta-modificada.jpg"
}
```

Debe devolver `200 OK`.

---

## 9. Activar / desactivar una ruta

### PATCH

```text
PATCH http://localhost:3000/api/rutas/AQUI_EL_ID/deactivate
PATCH http://localhost:3000/api/rutas/AQUI_EL_ID/activate
```

No necesitan body. Devuelven la ruta con `isActive` en `false` / `true`.

Para ver solo las desactivadas:

```text
GET http://localhost:3000/api/rutas?isActive=false
```

---

## 10. Eliminar una ruta (soft delete)

### DELETE

```text
DELETE http://localhost:3000/api/rutas/AQUI_EL_ID
```

Debe devolver `200` con `"message": "Ruta eliminada correctamente"` y la ruta con `deleted_at` rellenado.

El documento **no se borra** de MongoDB: solo se marca. Después:

```text
GET http://localhost:3000/api/rutas/AQUI_EL_ID
GET http://localhost:3000/api/rutas/slug/SU_SLUG
```

Ambas deben devolver `404`, y la ruta ya no aparece en `GET /api/rutas`, pero sí en `GET /api/rutas/deleted`.

---

# Pruebas de errores

## 11. ID incorrecto

### GET

```text
GET http://localhost:3000/api/rutas/123
```

Respuesta esperada (`400`):

```json
{
  "ok": false,
  "error": "Error de validación",
  "details": [
    { "origen": "params", "campo": "id", "mensaje": "ID de MongoDB no válido" }
  ]
}
```

---

## 12. Ruta inexistente

### GET

Utiliza un ObjectId válido que no exista:

```text
GET http://localhost:3000/api/rutas/68d000000000000000000999
```

Respuesta esperada:

```json
{
  "ok": false,
  "error": "Ruta no encontrada"
}
```

---

## 13. Crear ruta sin campos obligatorios

### POST

```text
POST http://localhost:3000/api/rutas
```

Body:

```json
{
  "nombre": "Ruta incompleta"
}
```

Debe devolver `400` con un `details` que indica cada campo que falta o es incorrecto.

---

## 14. Enviar campos que no se pueden modificar

### PUT

```text
PUT http://localhost:3000/api/rutas/AQUI_EL_ID
```

Body:

```json
{
  "slug": "otro-slug",
  "deleted_at": null,
  "isActive": false
}
```

Debe devolver `400`: `slug`, `deleted_at` e `isActive` no se pueden enviar por POST/PUT.

---

## 15. Slug no válido

### GET

```text
GET http://localhost:3000/api/rutas/slug/Slug_Mal!
```

Debe devolver `400`.

---

# Orden completo de pruebas

```text
1. GET    /api/health
2. GET    /api/rutas
3. GET    /api/rutas?dificultad=facil
4. GET    /api/rutas?provincia=Valencia
5. GET    /api/rutas?circular=true
6. GET    /api/rutas/:id
7. GET    /api/rutas/slug/:slug
8. POST   /api/rutas
9. PUT    /api/rutas/:id
10. PATCH /api/rutas/:id/deactivate
11. PATCH /api/rutas/:id/activate
12. DELETE /api/rutas/:id
13. GET   /api/rutas/:id  (debe dar 404)
14. GET   /api/rutas/deleted  (debe aparecer la borrada)
```

Así puedes comprobar todos los endpoints principales y también algunos errores.
