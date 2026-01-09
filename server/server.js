/* ============================
   IMPORTACIONES DE MÓDULOS
   ============================ */

import express from "express";
/* 
   Importa Express, el framework web más usado en Node.js.
   Permite crear servidores HTTP, definir rutas y usar middleware.
*/

import cors from "cors";
/*
   Middleware que controla qué orígenes (dominios) pueden acceder
   a la API mediante peticiones HTTP (CORS).
*/

import helmet from "helmet";
/*
   Middleware de seguridad que añade cabeceras HTTP para
   proteger la aplicación frente a ataques comunes.
*/

import cookieParser from "cookie-parser";
/*
   Middleware que permite leer cookies enviadas por el cliente
   y acceder a ellas desde req.cookies.
*/

import sinitizeHtml from "sanitize-html";
/*
   Librería para limpiar HTML malicioso (XSS).
   ⚠️ Ojo: aquí está importada pero todavía NO se está usando.
*/

import path from "path";
/*
   Módulo nativo de Node.js para trabajar con rutas de archivos
   de forma segura e independiente del sistema operativo.
*/

import { fileURLToPath } from "url";
/*
   Necesario cuando usamos ES Modules (import/export) para obtener
   la ruta del archivo actual, ya que __filename no existe por defecto.
*/

/* ============================
   CONFIGURACIÓN BÁSICA
   ============================ */

const app = express();
/*
   Crea la aplicación Express. A partir de aquí se configuran
   middlewares, rutas y servidor.
*/

const PORT = process.env.PORT || 3000;
/*
   Define el puerto:
   - Usa el valor de la variable de entorno PORT si existe
   - Si no, usa el puerto 3000 por defecto
*/

/* ============================
   RUTAS DEL SISTEMA DE ARCHIVOS
   ============================ */

const __filename = fileURLToPath(import.meta.url);
/*
   Convierte la URL del módulo actual en una ruta de archivo real.
*/

const __dirname = path.dirname(__filename);
/*
   Obtiene el directorio donde se encuentra este archivo.
*/

const publicDir = path.join(__dirname, "..", "public");
/*
   Construye la ruta absoluta a la carpeta "public",
   subiendo un nivel desde el directorio actual.
*/

/* ============================
   MIDDLEWARE DE SEGURIDAD
   ============================ */

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
/*
   Activa Helmet para añadir cabeceras de seguridad.
   Se desactiva la Content Security Policy (CSP), lo cual puede ser
   útil en desarrollo o si se cargan recursos externos.
*/

/* ============================
   MIDDLEWARE PARA JSON
   ============================ */

app.use(express.json({ limit: "100kb" }));
/*
   Permite que Express entienda peticiones con cuerpo JSON.
   Se limita el tamaño a 100 KB para evitar ataques por payload grande.
*/

/* ============================
   COOKIES
   ============================ */

app.use(cookieParser());
/*
   Permite leer cookies desde req.cookies.
   Muy común en autenticación basada en sesiones o tokens.
*/

/* ============================
   CONFIGURACIÓN CORS
   ============================ */

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);
/*
   Conjunto de orígenes permitidos.
   Solo estas URLs podrán hacer peticiones a la API.
*/

/* Middleware CORS personalizado */
app.use(
  cors({
    origin: (origin, cb) => {
      /*
         origin → dominio desde el que se hace la petición
         cb     → callback que decide si se permite o no
      */

      if (!origin) return cb(null, false);
      /*
         Si no hay origen (por ejemplo, peticiones internas),
         se rechaza por seguridad.
      */

      if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      /*
         Si el origen está en la lista blanca, se permite.
      */

      return cb(new Error("ORIGEN NO PERMITIDO"));
      /*
         Si no está permitido, se devuelve un error.
      */
    },

    credentials: true,
    /*
       Permite el envío de cookies y credenciales entre cliente y servidor.
       Imprescindible para autenticación con cookies.
    */
  })
);
