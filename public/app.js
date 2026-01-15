/*
  Ejemplo de entrada con espacios innecesarios
  --------------------------------------------
  "Ana   Lópes"  →  "Ana Lópes"

  La idea es normalizar el texto antes de validarlo
*/

function cleanText(str) {

    // Convertimos el valor recibido y devolvemos una versión limpia
    return (str)
        // Elimina espacios al principio y al final del texto
        .trim()

        // Sustituye uno o más espacios en blanco por un solo espacio
        // \s  → cualquier espacio en blanco
        // +   → uno o más
        // g   → global (todas las coincidencias)
        .replace(/\s+/g, " ");
}


/*
  Ejemplo de ataque XSS (inyección de código HTML/JS)
  ---------------------------------------------------
  <script>for() {}</script>

  Si este contenido se muestra sin escapar,
  el navegador puede ejecutar código malicioso
*/

function escaparHtml(str) {

   // Aseguramos que el valor sea tratado como texto
   return String(str)

    // El orden es importante: primero '&'
    // para evitar dobles escapes
    .replaceAll("&", "&amp;")

    // Escapamos los símbolos que el navegador interpreta como HTML
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

    // Escapamos comillas dobles (atributos HTML)
    .replaceAll('"', "&quot;")

    // Escapamos comillas simples
    .replaceAll("'", "&#039;");
}


/*
  Expresión regular para validar nombres
  --------------------------------------
  - Solo letras
  - Se permiten acentos
  - Se permiten espacios
  - Longitud entre 2 y 50 caracteres
*/

const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóú\s]{2,50}$/;


/*
  Ejemplos de correos
  ------------------
  ✔ pepe@gmail.com
  ✖ pepe@com
  ✖ pepe@@mail.com
  ✖ pepe pepe@mail.com
*/

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


/*
  Valida el nombre introducido en un formulario
  ---------------------------------------------
  Devuelve un objeto con:
  - ok: true / false
  - valor: texto limpio
  - msg: mensaje de error (si existe)
*/

function validarNombre(registro) {

    // Limpiamos el texto antes de validar
    const valor = cleanText(registro);

    // Comprobamos si está vacío
    if (!valor) {
        return { ok: false, valor, msg: "El nombre es obligatorio" };
    }

    // Validamos contra la expresión regular
    if (!nameRegex.test(valor)) {
        return {
            ok: false,
            valor,
            msg: "Solo letras y espacios, se permiten acentos (2-50)"
        };
    }

    // Si todo es correcto
    return { ok: true, valor, msg: "" };
}


/*
  Valida un email
  ---------------
  - Limpia espacios
  - Convierte a minúsculas
*/

function validarMail(registro) {

    // Limpiamos el texto y lo normalizamos a minúsculas
    const valor = cleanText(registro).toLowerCase();

    // Comprobamos si está vacío
    if (!valor) {
        return { ok: false, valor, msg: "El mail es obligatorio" };
    }

    // Validamos formato email
    if (!emailRegex.test(valor)) {
        return {
            ok: false,
            valor,
            msg: "Formato de email no válido"
        };
    }

    return { ok: true, valor, msg: "" };
}


/*
  Valida un comentario o asunto
  -----------------------------
  - Obligatorio
  - Máximo 255 caracteres
*/

function validarComment(registro) {

    // Limpiamos el texto
    const valor = cleanText(registro);

    // Campo obligatorio
    if (!valor) {
        return { ok: false, valor, msg: "El asunto es obligatorio" };
    }

    // Control de longitud máxima
    // (normalmente ligado a límites de base de datos)
    if (valor.length > 255) {
        return {
            ok: false,
            valor,
            msg: "Máximo 255 caracteres"
        };
    }

    return { ok: true, valor, msg: "" };
}


/*
  Alias del selector CSS
  ----------------------
  Permite seleccionar múltiples elementos de forma abreviada
  Ejemplo:
  $("#profileForm")
*/

const $ = (sel) => document.querySelectorAll(sel);


// Seleccionamos el formulario por su ID
const form = $("#profileForm");

// Seleccionamos el botón de reset
const btnReset = $("#btnReset");
