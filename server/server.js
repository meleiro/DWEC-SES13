/****************************************************
 * IMPORTACIONES
 ****************************************************/

// Framework web minimalista para Node.js
import express from "express";

// Middleware para controlar CORS (orígenes permitidos)
import cors from "cors";

// Middleware de seguridad que añade cabeceras HTTP seguras
import helmet from "helmet";

// Middleware para leer cookies desde las peticiones
import cookieParser from "cookie-parser";

// Librería para sanitizar HTML en el servidor
import sanitizeHtml from "sanitize-html";

// Utilidades para trabajar con rutas y ES Modules
import path from "path";
import { fileURLToPath } from "url";

/****************************************************
 * CONFIGURACIÓN BÁSICA
 ****************************************************/

const app = express();
const PORT = process.env.PORT || 3000;

/*
  Como estamos usando ES Modules (import/export),
  no existe __dirname directamente.
  Este bloque lo reconstruye de forma segura.
*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde está el frontend (HTML, CSS, JS)
const publicDir = path.join(__dirname, "..", "public");

/****************************************************
 * OTRAS MEDIDAS DE SEGURIDAD: HELMET
 ****************************************************/

app.use(
  helmet({
    /*
      Helmet añade cabeceras como:
      - X-Content-Type-Options
      - X-Frame-Options
      - Referrer-Policy
      - etc.

      CSP (Content-Security-Policy) la desactivamos
      para no bloquear el CDN de DOMPurify en esta demo.
    */
    contentSecurityPolicy: false,
  })
);

// Permite recibir JSON (limitado a 100 KB)
app.use(express.json({ limit: "100kb" }));

// Permite leer cookies (req.cookies)
app.use(cookieParser());

/****************************************************
 * CORS CONTROLADO DESDE SERVIDOR
 ****************************************************/

/*
  Lista BLANCA de orígenes permitidos.
  Muy importante cuando se usan cookies (credentials).
*/
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      /*
        origin undefined:
        - Peticiones same-origin
        - curl / Postman
      */
      if (!origin) return cb(null, true);

      // Solo permitimos los orígenes de la lista blanca
      if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);

      // Cualquier otro origen se rechaza
      return cb(new Error("CORS: origen no permitido"));
    },

    // Necesario para que el navegador envíe cookies
    credentials: true,
  })
);

/****************************************************
 * SERVIR ARCHIVOS ESTÁTICOS (FRONTEND)
 ****************************************************/

// Sirve index.html, styles.css, app.js, etc.
app.use(express.static(publicDir));

/****************************************************
 * VALIDACIÓN Y LIMPIEZA DE DATOS (SERVIDOR)
 ****************************************************/

/*
  EXPRESIÓN REGULAR PARA EL NOMBRE
  --------------------------------
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{2,50}$/

  ^     -> inicio de la cadena
  [...] -> conjunto de caracteres permitidos
  A-Za-z -> letras sin acentos
  ÁÉÍÓÚÜÑáéíóúüñ -> letras acentuadas y ñ
  \s    -> espacios en blanco
  {2,50}-> longitud mínima 2, máxima 50 caracteres
  $     -> fin de la cadena

  "Ana López"  -> válido
  "José"       -> válido
  "Ana123"     -> inválido
  "<script>"  -> inválido
*/
const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{2,50}$/;

/*
  EXPRESIÓN REGULAR PARA EL EMAIL (simplificada)
  ----------------------------------------------
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  ^           -> inicio
  [^\s@]+    -> uno o más caracteres que NO sean espacio ni @
  @           -> símbolo @ obligatorio
  [^\s@]+    -> dominio (gmail, outlook, etc.)
  \.          -> punto literal
  [^\s@]{2,} -> extensión de al menos 2 caracteres (com, es, net)
  $           -> fin

  ok ana@gmail.com
  ok user@mail.es
  x ana@com
  x ana@@mail.com
*/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
  LIMPIEZA BÁSICA DE TEXTO
  -----------------------
  - Elimina espacios al inicio y final
  - Sustituye múltiples espacios por uno solo
*/
function cleanText(str) {
  return String(str)
    .trim()
    .replace(/\s+/g, " ");
}

/*
  VALIDACIÓN COMPLETA DEL PERFIL
*/
function validateProfile({ name, email, comment }) {
  const errors = {};

  // Limpieza y normalización
  const n = cleanText(name ?? "");
  const e = cleanText(email ?? "").toLowerCase();
  const c = String(comment ?? "");

  // Validación nombre
  if (!n) {
    errors.name = "Nombre obligatorio";
  } else if (!nameRegex.test(n)) {
    errors.name = "Nombre inválido (solo letras y espacios, 2-50)";
  }

  // Validación email
  if (!e) {
    errors.email = "Email obligatorio";
  } else if (!emailRegex.test(e)) {
    errors.email = "Email inválido";
  }

  // Validación comentario (solo longitud)
  if (c.length > 500) {
    errors.comment = "Comentario demasiado largo (máx. 500)";
  }

  return {
    ok: Object.keys(errors).length === 0,
    cleaned: { name: n, email: e, comment: c },
    errors,
  };
}

/****************************************************
 * SANITIZACIÓN HTML EN SERVIDOR
 ****************************************************/

/*
  DEFENSA EN PROFUNDIDAD:
  Aunque el frontend use DOMPurify,
  el servidor SIEMPRE debe sanitizar.
*/
function sanitizeCommentHtml(dirty) {
  return sanitizeHtml(dirty, {
    // Etiquetas permitidas
    allowedTags: [
      "b", "i", "em", "strong", "u",
      "p", "br",
      "ul", "ol", "li",
      "code", "pre",
      "a"
    ],

    // Atributos permitidos por etiqueta
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },

    // Evita javascript:, data:, etc.
    allowedSchemes: ["http", "https", "mailto"]
  });
}

/****************************************************
 * COOKIES HTTPONLY (AUTENTICACIÓN)
 ****************************************************/

app.post("/api/login", (req, res) => {
  // Simulamos una sesión
  const fakeSessionId =
    "sess_" + Math.random().toString(36).slice(2);

  res.cookie("sid", fakeSessionId, {
    httpOnly: true,   // JS no puede leerla
    sameSite: "lax",  // protección CSRF básica
    secure: false,    // true SOLO con HTTPS
    maxAge: 1000 * 60 * 30 // 30 minutos
  });

  res.json({
    ok: true,
    msg: "Login correcto (cookie httpOnly creada)"
  });
});

app.get("/api/whoami", (req, res) => {
  const sid = req.cookies.sid;

  if (!sid) {
    return res.status(401).json({
      ok: false,
      error: "No autenticado"
    });
  }

  res.json({
    ok: true,
    sessionIdSeenByServer: sid
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("sid");
  res.json({ ok: true, msg: "Logout correcto" });
});

/****************************************************
 * ENDPOINT PERFIL: VALIDAR + SANITIZAR
 ****************************************************/

app.post("/api/profile", (req, res) => {
  const { ok, cleaned, errors } =
    validateProfile(req.body || {});

  if (!ok) {
    return res.status(400).json({ ok: false, errors });
  }

  // Sanitizamos HTML del comentario
  const commentSanitized =
    sanitizeCommentHtml(cleaned.comment);

  res.json({
    ok: true,
    saved: {
      name: cleaned.name,
      email: cleaned.email,
      commentSanitized
    },
    notes: [
      "Validación y sanitización también se hacen en servidor",
      "Nunca confíes solo en el frontend"
    ]
  });
});

/****************************************************
 * ARRANQUE DEL SERVIDOR
 ****************************************************/

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
