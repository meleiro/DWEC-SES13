/* ==========================================================
   UTILIDADES: limpieza, regex y escapes
   ========================================================== */

/**
 * cleanText(str)
 * -------------
 * Objetivo: "Campos limpios"
 * Antes de validar y guardar, normalizamos el texto:
 *  - Convertimos a string (por si viene null/undefined/número)
 *  - Quitamos espacios al inicio/fin (trim)
 *  - Convertimos múltiples espacios/tabs/saltos en 1 solo espacio
 *
 * ¿Por qué?
 *  - El usuario puede pegar texto con espacios raros
 *  - Evitamos que " Ana   López " falle por culpa de espacios
 *  - Homogeneiza los datos guardados ("calidad del dato")
 */
function cleanText(str) {
  return String(str)
    .trim()                 // elimina espacios al inicio y al final
    .replace(/\s+/g, " ");  // regex: \s = cualquier espacio (tab, salto, etc.), + = 1 o más
                            //      g  = global (todas las ocurrencias)
}

/**
 * escapeHtml(str)
 * --------------
 * Objetivo: "Escape de caracteres"
 * Convierte caracteres especiales a entidades HTML para que el navegador
 * NO los interprete como etiquetas/atributos HTML.
 *
 * EJEMPLO:
 *  Entrada:  <b>Hola</b>
 *  Salida:   &lt;b&gt;Hola&lt;/b&gt;
 *
 * ¿Cuándo usarlo?
 *  - Cuando vas a insertar texto del usuario dentro de un template HTML
 *    (por ejemplo usando innerHTML).
 *
 * IMPORTANTE:
 *  - Escape NO es sanitizar.
 *  - Escape: convierte TODO en texto (no permite HTML).
 *  - Sanitizar: permite "algo" de HTML pero elimina lo peligroso.
 */
function escapeHtml(str) {
  return String(str)
    // El orden es importante:
    // 1) & primero, para no "re-escapar" cosas ya escapadas.
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ==========================================================
   VALIDACIÓN (cliente) con regex
   ========================================================== */

/**
 * nameRegex
 * ---------
 * /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{2,50}$/
 *
 * EXPLICACIÓN CARÁCTER A CARÁCTER:
 * ^   -> inicio de la cadena (no puede haber nada antes)
 * [...] -> conjunto de caracteres permitidos
 * A-Za-z -> letras (mayúsculas y minúsculas) sin acentos
 * ÁÉÍÓÚÜÑáéíóúüñ -> letras comunes en español con acentos + ñ
 * \s  -> whitespace (espacios, tabs, saltos de línea)
 * {2,50} -> longitud mínima 2, máxima 50, SOLO de esos caracteres permitidos
 * $   -> fin de la cadena (no puede haber nada después)
 *
 * EJEMPLOS:
 *  ok "Ana López"          (letras + espacio)
 *  ok "José"               (letras acentuadas)
 *  ko "Ana123"             (números no permitidos)
 *  ko "Ana<>"              (caracteres raros no permitidos)
 *  ko " A "                (limpieza + longitud puede dejarlo corto)
 */
const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{2,50}$/;

/**
 * emailRegex (demo)
 * -----------------
 * /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
 *
 * IMPORTANTE: es una regex "sencilla" para docencia.
 * Validar emails al 100% es más complejo (RFC), pero para clase está bien.
 *
 * EXPLICACIÓN:
 * ^ -> inicio
 * [^\s@]+ -> "uno o más" caracteres que NO sean:
 *            - \s (espacio)
 *            - @
 * @ -> debe existir un @
 * [^\s@]+ -> dominio (otra vez: caracteres que no sean espacios ni @)
 * \. -> un punto literal
 * [^\s@]{2,} -> extensión (min 2 chars): com, es, net...
 * $ -> fin
 *
 * EJEMPLOS:
 *  ok "ana@gmail.com"
 *  ok "user@mail.es"
 *  ko "ana@com"            (no hay .ext)
 *  ko "ana@@mail.com"      (doble @)
 *  ko "ana mail@gmail.com" (espacio)
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * validateName(raw)
 * -----------------
 * Devuelve un objeto estándar:
 *  - ok: boolean (pasa o no pasa)
 *  - value: el texto ya limpio (para usarlo después)
 *  - msg: mensaje de error (si existe)
 *
 * Esto es muy útil porque:
 *  - el formulario puede mostrar errores fácilmente
 *  - el código queda consistente en todos los campos
 */
function validateName(raw) {
  // 1) Limpiamos primero: evitamos falsos negativos por espacios
  const value = cleanText(raw);

  // 2) Comprobaciones por orden:
  //    a) obligatorio
  if (!value) return { ok: false, value, msg: "El nombre es obligatorio." };

  //    b) patrón (regex)
  if (!nameRegex.test(value)) {
    return { ok: false, value, msg: "Solo letras y espacios (2-50)." };
  }

  // 3) Si pasa todo:
  return { ok: true, value, msg: "" };
}

/**
 * validateEmail(raw)
 * ------------------
 * Igual que validateName, pero:
 *  - normalizamos el email a minúsculas
 *    (porque en la práctica suele tratarse de forma case-insensitive)
 */
function validateEmail(raw) {
  const value = cleanText(raw).toLowerCase(); // normalización típica
  if (!value) return { ok: false, value, msg: "El email es obligatorio." };
  if (!emailRegex.test(value)) return { ok: false, value, msg: "Email no válido." };
  return { ok: true, value, msg: "" };
}

/**
 * validateComment(raw)
 * --------------------
 * Comentario:
 * - Permitimos que el usuario escriba HTML (por ejemplo <b>, <p>, etc.)
 * - Pero NO confiamos en él → lo sanitizamos con DOMPurify ANTES de usar innerHTML.
 *
 * Aquí validamos solo:
 * - longitud (regla de negocio)
 *
 * La "seguridad" del HTML se delega a DOMPurify (sanitización).
 */
function validateComment(raw) {
  const value = String(raw ?? ""); // si viene null/undefined → ""
  if (value.length > 500) return { ok: false, value, msg: "Máximo 500 caracteres." };
  return { ok: true, value, msg: "" };
}

/* ==========================================================
   UI / Tabs (interfaz de pestañas)
   ========================================================== */

/**
 * Función $:
 *  - Atajo para document.querySelector
 *  - Facilita leer el código y lo hace más corto
 */
const $ = (sel) => document.querySelector(sel);

// Referencias al formulario y botones principales
const form = $("#profileForm");
const btnReset = $("#btnReset");

// Contenedores para mostrar mensajes de error por campo
const errName = $("#errName");
const errEmail = $("#errEmail");
const errComment = $("#errComment");

// Zonas donde se muestran resultados
const safePreview = $("#safePreview");       // preview con HTML (sanitizado)
const escapedPreview = $("#escapedPreview"); // preview literal (texto)

// Sistema de pestañas
const tabs = document.querySelectorAll(".tab");
const panelPreview = $("#panel-preview");
const panelStorage = $("#panel-storage");
const panelAuth = $("#panel-auth");

/**
 * Al hacer clic en una pestaña:
 * 1) Quitamos "active" de todas
 * 2) Se lo ponemos a la clicada
 * 3) Ocultamos/mostramos paneles según data-tab
 */
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("active"));
    t.classList.add("active");

    const tab = t.dataset.tab; // "preview" | "storage" | "auth"

    // toggle("hidden", condición) → si condición true, pone hidden
    panelPreview.classList.toggle("hidden", tab !== "preview");
    panelStorage.classList.toggle("hidden", tab !== "storage");
    panelAuth.classList.toggle("hidden", tab !== "auth");
  });
});

/* ==========================================================
   SANITIZACIÓN con DOMPurify
   ========================================================== */

/**
 * sanitizeUserHtml(dirtyHtml)
 * ---------------------------
 * DOMPurify.sanitize limpia HTML:
 * - elimina <script>...</script>
 * - elimina atributos peligrosos como onerror, onclick, etc.
 * - elimina URLs peligrosas tipo javascript:...
 *
 * Aquí aplicamos un enfoque de "lista permitida" (whitelist):
 * - Solo permitimos un conjunto de etiquetas seguras
 * - Solo permitimos ciertos atributos
 *
 * Esto es muy didáctico para explicar:
 *  - "No se trata de bloquear lo malo; se trata de permitir solo lo bueno"
 */
function sanitizeUserHtml(dirtyHtml) {
  return DOMPurify.sanitize(dirtyHtml, {
    // Etiquetas permitidas (formato)
    ALLOWED_TAGS: [
      "b", "i", "em", "strong", "u",
      "p", "br",
      "ul", "ol", "li",
      "code", "pre",
      "a"
    ],

    // Atributos permitidos (y solo esos)
    ALLOWED_ATTR: ["href", "target", "rel"],

    // Nota:
    // - Si el usuario mete <img onerror=...> se elimina la etiqueta o el atributo.
    // - DOMPurify por defecto ya es estricto, pero esta lista lo hace más controlado.
  });
}

/* ==========================================================
   STORAGE: localStorage / sessionStorage (NO datos sensibles)
   ========================================================== */

const storageDump = $("#storageDump");
const btnLoadLocal = $("#btnLoadLocal");
const btnLoadSession = $("#btnLoadSession");
const btnClearStorage = $("#btnClearStorage");

/**
 * dumpStorage()
 * -------------
 * Muestra en pantalla lo que hay guardado:
 * - localStorage: persistente (permanece al cerrar navegador)
 * - sessionStorage: dura mientras la pestaña esté abierta
 *
 * NOTA de seguridad:
 * - No guardar tokens o contraseñas aquí, porque si hay XSS, se roban.
 */
function dumpStorage() {
  // Recuperamos un objeto JSON desde localStorage
  const local = {
    profile: JSON.parse(localStorage.getItem("profile") || "null"),
  };

  // Recuperamos un string simple desde sessionStorage
  const session = {
    draftComment: sessionStorage.getItem("draftComment") || null,
  };

  // Mostramos todo en un <pre> de forma legible
  storageDump.textContent =
    "localStorage:\n" + JSON.stringify(local, null, 2) +
    "\n\nsessionStorage:\n" + JSON.stringify(session, null, 2) +
    "\n\nNOTA: No guardes tokens/contraseñas en storage (riesgo XSS).";
}

btnLoadLocal.addEventListener("click", dumpStorage);
btnLoadSession.addEventListener("click", dumpStorage);

btnClearStorage.addEventListener("click", () => {
  localStorage.removeItem("profile");
  sessionStorage.removeItem("draftComment");
  dumpStorage();
});

/* ==========================================================
   COOKIES httpOnly (solo servidor) + FETCH con credenciales
   ========================================================== */

const authDump = $("#authDump");
const btnLogin = $("#btnLogin");
const btnWhoAmI = $("#btnWhoAmI");
const btnLogout = $("#btnLogout");

/**
 * api(path, options)
 * ------------------
 * Wrapper de fetch para:
 *  - enviar/recibir JSON cómodamente
 *  - incluir cookies (credentials: "include")
 *
 * IMPORTANTE:
 * - credentials: "include" hace que el navegador envíe cookies al servidor
 * - Para que esto funcione en CORS, el backend debe permitir credentials
 *   y NO puede usar Access-Control-Allow-Origin: *
 */
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include", // <- clave para cookies httpOnly
  });

  // Intentamos parsear JSON aunque haya errores
  const data = await res.json().catch(() => ({ error: "Respuesta no JSON" }));

  // Si el status HTTP no es 2xx → lanzamos error con el JSON recibido
  if (!res.ok) throw data;

  return data;
}

/**
 * Login:
 * - Llama a /api/login
 * - El servidor crea cookie httpOnly
 * - JS NO puede leerla (document.cookie no la verá),
 *   pero el navegador sí la enviará en siguientes requests.
 */
btnLogin.addEventListener("click", async () => {
  authDump.textContent = "Haciendo login...";
  try {
    const data = await api("/api/login", { method: "POST" });
    authDump.textContent =
      JSON.stringify(data, null, 2) +
      "\n\n(La cookie httpOnly se ha guardado, pero JS no puede leerla.)";
  } catch (e) {
    authDump.textContent = "Error:\n" + JSON.stringify(e, null, 2);
  }
});

btnWhoAmI.addEventListener("click", async () => {
  authDump.textContent = "Consultando /api/whoami...";
  try {
    const data = await api("/api/whoami");
    authDump.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    authDump.textContent = "Error:\n" + JSON.stringify(e, null, 2);
  }
});

btnLogout.addEventListener("click", async () => {
  authDump.textContent = "Logout...";
  try {
    const data = await api("/api/logout", { method: "POST" });
    authDump.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    authDump.textContent = "Error:\n" + JSON.stringify(e, null, 2);
  }
});

/* ==========================================================
   FORM: validación + sanitización + almacenamiento + envío
   ========================================================== */

form.addEventListener("submit", async (ev) => {
  ev.preventDefault(); // evita que la página recargue (comportamiento por defecto)

  /* 1) LEER VALORES CRUDOS (RAW)
     - Los valores vienen del input tal cual los escribió el usuario
  */
  const rawName = $("#name").value;
  const rawEmail = $("#email").value;
  const rawComment = $("#comment").value;

  /* 2) VALIDACIÓN EN CLIENTE (UX)
     - Damos feedback inmediato sin ir al servidor
     - Aun así el servidor debe validar también
  */
  const vName = validateName(rawName);
  const vEmail = validateEmail(rawEmail);
  const vComment = validateComment(rawComment);

  // Mostramos errores
  errName.textContent = vName.msg;
  errEmail.textContent = vEmail.msg;
  errComment.textContent = vComment.msg;

  // Si cualquier campo falla → no seguimos
  const ok = vName.ok && vEmail.ok && vComment.ok;
  if (!ok) return;

  /* 3) SANITIZACIÓN DEL COMENTARIO (clave XSS)
     - Vamos a permitir HTML en el comentario,
       pero solo el que sea seguro.
  */
  const safeHtml = sanitizeUserHtml(vComment.value);

  /* 4) PREVIEW SEGURO EN HTML
     - Usamos innerHTML: PELIGROSO si hay contenido usuario.
     - Por eso:
       - nombre y email: se escapan (escapeHtml)
       - comentario: se sanitiza (DOMPurify)
  */
  safePreview.innerHTML = `
    <p><b>Nombre:</b> ${escapeHtml(vName.value)}</p>
    <p><b>Email:</b> ${escapeHtml(vEmail.value)}</p>
    <p><b>Comentario (sanitizado):</b></p>
    <div>${safeHtml}</div>
  `;

  /* 5) PREVIEW "ESCAPADO" COMO TEXTO LITERAL
     - textContent NO interpreta HTML.
     - Es la forma más segura si no necesitas permitir HTML.
  */
  escapedPreview.textContent =
    `Nombre: ${vName.value}\n` +
    `Email: ${vEmail.value}\n` +
    `Comentario (texto literal):\n${vComment.value}`;

  /* 6) ALMACENAMIENTO EN STORAGE (NO sensible)
     - localStorage: guardamos perfil básico (persistente)
     - sessionStorage: guardamos borrador de comentario (temporal)
  */
  localStorage.setItem(
    "profile",
    JSON.stringify({ name: vName.value, email: vEmail.value })
  );
  sessionStorage.setItem("draftComment", vComment.value);
  dumpStorage();

  /* 7) ENVIAR AL SERVIDOR
     - Aquí mandamos los datos para que el servidor:
       - valide otra vez
       - sanitice otra vez
       - y guarde/gestione
  */
  try {
    const payload = {
      name: vName.value,
      email: vEmail.value,
      comment: vComment.value,
    };

    const data = await api("/api/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Mostramos respuesta del servidor
    safePreview.insertAdjacentHTML(
      "beforeend",
      `<p><b>Servidor:</b> Guardado</p>`
    );
    safePreview.insertAdjacentHTML(
      "beforeend",
      `<div class="muted"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`
    );
  } catch (e) {
    safePreview.insertAdjacentHTML(
      "beforeend",
      `<p><b>Servidor:</b>Error</p>`
    );
    safePreview.insertAdjacentHTML(
      "beforeend",
      `<div class="muted"><pre>${escapeHtml(JSON.stringify(e, null, 2))}</pre></div>`
    );
  }
});

/**
 * Reset del formulario:
 * - Limpia campos
 * - Borra errores
 * - Borra previews
 */
btnReset.addEventListener("click", () => {
  form.reset();
  errName.textContent = "";
  errEmail.textContent = "";
  errComment.textContent = "";
  safePreview.textContent = "";
  escapedPreview.textContent = "";
});
