// Seed de comentarios de clientes para probar el detalle, el resumen IA y el dashboard de sentimiento.
// No borra el resto de datos: se ejecuta sobre la base ya sembrada con `npm run seed`.
//
// Uso: npm run seed:comentarios -- [--sin-sentimiento]
//   --sin-sentimiento  deja todos los comentarios pendientes, para probar `npm run sentimiento:analizar` del agente
//
// Qué deja preparado (a propósito, no en todas las rutas):
//   - Rutas sin opiniones.
//   - Rutas con 1-2 opiniones (no llega al mínimo de 3 para el resumen IA).
//   - Rutas muy bien valoradas, rutas con opiniones mezcladas y 2 rutas en ALERTA (muchas negativas / nota baja).
//   - Algunos comentarios pendientes de analizar, uno editado y uno en la papelera del admin.
// Se puede ejecutar varias veces: borra antes lo que creó en la ejecución anterior.

require("dotenv").config();

const crypto = require("node:crypto");
const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const password = require("./src/utils/password");
const Comment = require("./src/models/comment.model");

const DOMINIO_DEMO = "@clientes.trailverse.test";
const DIA_MS = 24 * 60 * 60 * 1000;

// Clientes de prueba: no pueden iniciar sesión (contraseña aleatoria que no se guarda).
const CLIENTES_DEMO = [
  "Jorge Navarro", "Sara Gil", "Raúl Ortega", "Nuria Vidal", "Iván Molina",
  "Marta Castro", "Hugo Romero", "Irene Sanz", "Diego Ramos", "Laura Iglesias"
];

// [estrellas, texto, sentimiento, puntuación, temas]
const P = "positivo";
const N = "neutro";
const X = "negativo";

const OPINIONES = {
  // ---------- Muy bien valoradas ----------
  "Ruta del Hayedo de Montejo": [
    [5, "Fuimos en octubre y el hayedo estaba espectacular, todo naranja y rojo. El guía explicó muy bien la historia del bosque.", P, 0.9, ["paisaje", "guia", "otoño"]],
    [5, "Ideal para ir con niños. Camino cómodo, bien señalizado y con sitios para parar a merendar.", P, 0.85, ["familias", "señalizacion"]],
    [4, "Muy bonito, aunque el aparcamiento se llena pronto los fines de semana. Recomiendo llegar temprano.", P, 0.5, ["paisaje", "aparcamiento"]],
    [5, "Una de las rutas más bonitas que he hecho en Madrid. El guía muy atento con el grupo.", P, 0.9, ["paisaje", "guia"]],
    [5, "Perfecta para desconectar. Grupos pequeños y ritmo tranquilo.", P, 0.8, ["organizacion", "ritmo"]],
    [4, "Muy agradable. Se queda algo corta si estás acostumbrado a caminar, pero merece la pena.", P, 0.4, ["duracion", "paisaje"]],
    [5, "Repetiría sin dudarlo. Con lluvia el bosque tiene un ambiente mágico.", P, 0.85, ["paisaje", "clima"]],
    [5, "Excelente organización y puntualidad. Las explicaciones sobre las hayas fueron lo mejor.", P, 0.9, ["organizacion", "guia"]]
  ],
  "Ruta de los Lagos de Covadonga": [
    [5, "Paisaje de postal. Vimos los dos lagos con el cielo despejado y vacas pastando alrededor.", P, 0.9, ["paisaje", "fauna"]],
    [5, "Muy bien organizada, el bus hasta los lagos fue cómodo y el guía conocía cada rincón.", P, 0.85, ["organizacion", "transporte", "guia"]],
    [4, "Preciosa, pero había bastante gente en el mirador principal.", P, 0.4, ["paisaje", "masificacion"]],
    [5, "La niebla se levantó a mitad de ruta y las vistas fueron increíbles. Totalmente recomendable.", P, 0.9, ["paisaje", "clima"]],
    [3, "Bonita, aunque esperaba algo más de recorrido. Llevad chubasquero, el tiempo cambia rápido.", N, 0, ["duracion", "clima"]],
    [5, "Una experiencia redonda. Grupo reducido y muchas paradas para hacer fotos.", P, 0.85, ["organizacion", "paisaje"]]
  ],
  "Ruta de la Cola de Caballo": [
    [5, "Ordesa es otro nivel. La cascada al final compensa toda la subida.", P, 0.9, ["paisaje", "cascadas"]],
    [4, "Exigente por la longitud pero muy bien llevada por el guía, con paradas para descansar.", P, 0.6, ["dificultad", "guia", "ritmo"]],
    [5, "Las Gradas de Soaso son preciosas. Ruta imprescindible si vas al Pirineo.", P, 0.9, ["paisaje"]],
    [4, "Muy recomendable. A la vuelta se hace algo pesada, llevad comida y agua de sobra.", P, 0.45, ["dificultad", "agua"]],
    [5, "Fuimos en junio, con el río lleno de agua. El guía nos habló mucho de la flora del valle.", P, 0.85, ["paisaje", "guia", "flora"]]
  ],

  // ---------- Opiniones mezcladas ----------
  "Ruta del Mulhacén": [
    [5, "Llegar a la cima del Mulhacén fue un sueño cumplido. Guía muy profesional y pendiente de la seguridad.", P, 0.9, ["cima", "guia", "seguridad"]],
    [2, "Demasiado dura para lo que se anunciaba. El ritmo del grupo era muy rápido y nos quedamos atrás.", X, -0.6, ["dificultad", "ritmo"]],
    [4, "Muy exigente pero las vistas desde arriba son brutales. Imprescindible buena forma física.", P, 0.5, ["dificultad", "paisaje"]],
    [3, "La ruta está bien, pero la hora de salida era muy temprano y no se avisó con tiempo.", N, -0.1, ["organizacion", "horario"]],
    [2, "Hacía mucho frío arriba y no nos dijeron que lleváramos ropa de abrigo. Mal planificado.", X, -0.55, ["clima", "organizacion"]],
    [5, "Una pasada. El guía controló muy bien los tiempos y el grupo llegó entero a la cima.", P, 0.85, ["guia", "cima"]],
    [4, "Larga y dura, pero vale la pena. Faltó alguna parada más para comer.", P, 0.3, ["dificultad", "ritmo"]]
  ],
  "Ruta del Cares": [
    [5, "La garganta es impresionante, caminar entre esas paredes no se olvida.", P, 0.9, ["paisaje"]],
    [3, "Bonita pero muy concurrida en agosto. A veces costaba avanzar por el sendero.", N, -0.1, ["masificacion", "paisaje"]],
    [4, "Muy recomendable. El regreso en 4x4 estuvo bien organizado.", P, 0.6, ["transporte", "organizacion"]],
    [2, "Hay tramos sin protección y con niños pequeños pasé miedo. Debería indicarse mejor.", X, -0.5, ["seguridad", "familias"]],
    [4, "Espectacular. Llevad gorra, en verano el sol pega fuerte.", P, 0.5, ["paisaje", "clima"]]
  ],
  "Ruta de La Pedriza": [
    [4, "Paisaje granítico muy chulo, con pasos entre rocas divertidos.", P, 0.6, ["paisaje"]],
    [3, "Bien, aunque la señalización en algunos cruces es confusa.", N, -0.15, ["señalizacion"]],
    [5, "El guía nos llevó por rincones que no habría encontrado sola. Gran día.", P, 0.85, ["guia", "paisaje"]],
    [3, "Correcta. El aparcamiento se llena y tardamos en empezar.", N, -0.2, ["aparcamiento", "organizacion"]]
  ],

  // ---------- En alerta (muchas negativas o nota baja) ----------
  "Ruta nocturna de la Calderona": [
    [2, "Empezamos tarde y gran parte del camino lo hicimos sin luz suficiente. No nos avisaron de llevar frontal.", X, -0.65, ["organizacion", "material", "seguridad"]],
    [1, "El guía llegó 40 minutos tarde y no hubo ninguna explicación. Muy decepcionante.", X, -0.85, ["puntualidad", "guia"]],
    [3, "El cielo estrellado era bonito, pero la organización dejó bastante que desear.", N, -0.1, ["paisaje", "organizacion"]],
    [2, "Grupo demasiado grande para una ruta nocturna. Había gente que se quedaba atrás sin que nadie se diera cuenta.", X, -0.6, ["organizacion", "seguridad"]],
    [1, "No volvería. Mal señalizado el punto de encuentro y nos perdimos antes de empezar.", X, -0.8, ["señalizacion", "punto de encuentro"]],
    [4, "A mí me gustó la experiencia, aunque entiendo las quejas sobre la puntualidad.", P, 0.3, ["puntualidad"]]
  ],
  "Costa de Cabo de Gata": [
    [2, "Mucho calor y casi nada de sombra. Deberían hacerla a primera hora y no a mediodía.", X, -0.6, ["clima", "horario"]],
    [4, "Las calas son preciosas, el baño en Mónsul fue lo mejor del día.", P, 0.7, ["paisaje", "playas"]],
    [2, "Tramos mal señalizados entre calas, el guía tuvo que consultar el móvil varias veces.", X, -0.55, ["señalizacion", "guia"]],
    [2, "Se quedó sin agua la mitad del grupo. Hay que avisar de llevar al menos dos litros.", X, -0.6, ["agua", "organizacion"]],
    [3, "El paisaje compensa, pero la ruta es más dura de lo que parece por el calor.", N, -0.05, ["paisaje", "dificultad", "clima"]]
  ],

  // ---------- Pocas opiniones (sin resumen IA todavía) ----------
  "Ruta del Pou Clar": [
    [5, "Perfecta para un día de verano, las pozas son una maravilla.", P, 0.9, ["agua", "paisaje"]],
    [4, "Muy agradable con niños. Llegad pronto que se llena.", P, 0.5, ["familias", "masificacion"]]
  ],
  "Ruta del Montgó": [
    [4, "Subida exigente pero con vistas a Dénia y al mar increíbles.", P, 0.6, ["dificultad", "paisaje"]]
  ],

  // ---------- Pendientes de analizar (sin sentimiento) ----------
  "Ruta de la Font Roja": [
    [5, "El bosque mediterráneo está muy bien conservado. Bonita en primavera.", null],
    [3, "Bien, aunque muy corta para el precio.", null],
    [4, "Agradable y tranquila. El guía sabía mucho de botánica.", null]
  ]
};

// Rutas sin comentarios a propósito: Peñón de Ifach, Calderona, Circo de Gredos, Montaña Pelada,
// Bosque Encantado, Faros de la Costa da Morte, Turó de l'Home, Cerrada de Elías y Laguna de Peñalara.

function parsearArgumentos(argv) {
  const opciones = { sinSentimiento: false };
  for (const argumento of argv) {
    if (argumento === "--sin-sentimiento") opciones.sinSentimiento = true;
    else throw new Error(`Argumento desconocido: ${argumento}`);
  }
  return opciones;
}

async function prepararClientesDemo(db) {
  const usuariosDemo = await db.collection("users").find({ email: { $regex: `${DOMINIO_DEMO.replace(".", "\\.")}$` } }).toArray();
  const idsDemo = usuariosDemo.map((u) => u._id);

  // Limpieza de la ejecución anterior.
  await Promise.all([
    db.collection("comments").deleteMany({ userId: { $in: idsDemo } }),
    db.collection("profiles").deleteMany({ userId: { $in: idsDemo } }),
    db.collection("users").deleteMany({ _id: { $in: idsDemo } })
  ]);

  const rolUsuario = await db.collection("roles").findOne({ name: "USER" });
  if (!rolUsuario) throw new Error("No existe el rol USER. Ejecuta antes `npm run seed`.");

  const passwordHash = await password.hashPassword(crypto.randomBytes(24).toString("base64url"));
  const ahora = new Date();
  const usuarios = CLIENTES_DEMO.map((nombre, indice) => ({
    _id: new mongoose.Types.ObjectId(),
    email: `cliente${indice + 1}${DOMINIO_DEMO}`,
    passwordHash,
    roleId: rolUsuario._id,
    isActive: true,
    deleted_at: null,
    created_at: ahora,
    updated_at: ahora
  }));
  await db.collection("users").insertMany(usuarios);
  await db.collection("profiles").insertMany(
    usuarios.map((usuario, indice) => ({
      userId: usuario._id,
      name: CLIENTES_DEMO[indice],
      avatarUrl: "",
      bio: "",
      phone: "",
      created_at: ahora,
      updated_at: ahora
    }))
  );
  return usuarios.map((u) => u._id);
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("El seed no se puede ejecutar en producción");
  const opciones = parsearArgumentos(process.argv.slice(2));

  await connectDB();
  const db = mongoose.connection.db;

  // Clientes: primero los usuarios del seed principal (sin el admin) y después los de prueba.
  const rolAdmin = await db.collection("roles").findOne({ name: "ADMIN" });
  const admin = await db.collection("users").findOne({ roleId: rolAdmin?._id, deleted_at: null });
  const idsDemo = await prepararClientesDemo(db);
  const usuariosSeed = await db.collection("users")
    .find({ deleted_at: null, isActive: true, roleId: { $ne: rolAdmin?._id }, _id: { $nin: idsDemo } })
    .sort({ created_at: 1 })
    .toArray();
  const clientes = [...usuariosSeed.map((u) => u._id), ...idsDemo];

  const nombres = Object.keys(OPINIONES);
  const rutas = await db.collection("rutas").find({ nombre: { $in: nombres }, deleted_at: null }).toArray();
  const rutaPorNombre = new Map(rutas.map((ruta) => [ruta.nombre, ruta]));
  const faltan = nombres.filter((nombre) => !rutaPorNombre.has(nombre));
  if (faltan.length) console.warn(`Rutas no encontradas (se omiten): ${faltan.join(", ")}`);

  // Se borran también los comentarios de usuarios reales en estas rutas para respetar
  // "una reseña por usuario y ruta" al volver a sembrar.
  const idsRutas = rutas.map((ruta) => ruta._id);
  const { deletedCount: anteriores } = await db.collection("comments").deleteMany({
    rutaId: { $in: idsRutas },
    userId: { $in: clientes }
  });

  const ahora = Date.now();
  const documentos = [];
  let indiceGlobal = 0;

  for (const [nombre, opiniones] of Object.entries(OPINIONES)) {
    const ruta = rutaPorNombre.get(nombre);
    if (!ruta) continue;

    opiniones.forEach(([valoracion, texto, etiqueta, puntuacion, temas], indice) => {
      // Cada ruta empieza en un cliente distinto para repartir los autores.
      const userId = clientes[(indice + nombres.indexOf(nombre) * 3) % clientes.length];
      // Fechas repartidas en los últimos ~5 meses; las primeras opiniones de la lista son las más recientes.
      const creado = new Date(ahora - (indice * 9 + (indiceGlobal % 7) + 1) * DIA_MS - indiceGlobal * 37 * 60 * 1000);
      const analizar = !opciones.sinSentimiento && etiqueta != null;

      documentos.push({
        userId,
        rutaId: ruta._id,
        texto,
        valoracion,
        sentimiento: analizar
          ? { etiqueta, puntuacion, temas, analizadoEn: new Date(creado.getTime() + DIA_MS) }
          : null,
        deleted_at: null,
        deletedBy: null,
        created_at: creado,
        updated_at: creado
      });
      indiceGlobal++;
    });
  }

  if (clientes.length < Math.max(...Object.values(OPINIONES).map((lista) => lista.length))) {
    throw new Error("No hay suficientes clientes para respetar una opinión por usuario y ruta");
  }

  // Un comentario editado (se ve "editado" en el detalle y queda pendiente de reanalizar).
  const editado = documentos.find((d) => d.texto.startsWith("Bien, aunque la señalización"));
  if (editado) {
    editado.texto += " Actualizo: en la segunda visita ya habían puesto carteles nuevos.";
    editado.updated_at = new Date(editado.created_at.getTime() + 3 * DIA_MS);
    editado.sentimiento = null;
  }

  // Un comentario en la papelera del admin (moderado por lenguaje inapropiado).
  const moderado = {
    userId: clientes[clientes.length - 1],
    rutaId: rutaPorNombre.get("Ruta nocturna de la Calderona")?._id,
    texto: "Una basura de ruta, los organizadores son unos inútiles. No vayáis.",
    valoracion: 1,
    sentimiento: opciones.sinSentimiento ? null : { etiqueta: X, puntuacion: -0.95, temas: ["organizacion"], analizadoEn: new Date() },
    deleted_at: new Date(ahora - 2 * DIA_MS),
    deletedBy: admin?._id ?? null,
    created_at: new Date(ahora - 3 * DIA_MS),
    updated_at: new Date(ahora - 3 * DIA_MS)
  };
  if (moderado.rutaId) documentos.push(moderado);

  await db.collection("comments").insertMany(documentos);
  await Comment.syncIndexes();

  const activos = documentos.filter((d) => !d.deleted_at);
  const pendientes = activos.filter((d) => !d.sentimiento).length;
  console.log(
    `Seed de comentarios completado: ${activos.length} comentarios activos en ${rutas.length} rutas, ` +
    `1 en la papelera, ${pendientes} pendientes de analizar, ${idsDemo.length} clientes de prueba` +
    (anteriores ? ` (${anteriores} comentarios anteriores reemplazados).` : ".")
  );
  if (pendientes) {
    console.log("Para analizar los pendientes con IA: cd ../trailverse-agent && npm run sentimiento:analizar");
  }
}

main()
  .catch((error) => {
    console.error("Error ejecutando el seed de comentarios:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
