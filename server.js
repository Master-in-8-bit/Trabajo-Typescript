const express = require("express");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "catalogo.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS administradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    regular REAL NOT NULL,
    dto INTEGER NOT NULL DEFAULT 0,
    img TEXT DEFAULT ''
  );
`);

const productosIniciales = [
  { nombre: "Detergente MAGISTRAL Ultra Limón Botella 500ml", categoria: "Limpieza", regular: 3028.29, dto: 35, img: "./src/detergente.jpg" },
  { nombre: "Galletitas OREO Rellenas Con Crema Sabor Original 118g", categoria: "Galletitas", regular: 2640, dto: 35, img: "./src/oreo.webp" },
  { nombre: "Hamburguesa De Carne Vacuna Paty 320 Grm", categoria: "Comida", regular: 10455, dto: 35, img: "./src/paty.jpg" },
  { nombre: "Galletitas PEPITOS Con Chips De Chocolate 119g.", categoria: "Galletitas", regular: 2480, dto: 0, img: "./src/pepito.jpg" },
  { nombre: "Salchichas X6 Swift Paq 225 Grm", categoria: "Comida", regular: 2919, dto: 20, img: "./src/salchicha.jpg" },
  { nombre: "Jabon En Barra DOVE Original Individual 90 G", categoria: "Limpieza", regular: 2738.99, dto: 0, img: "./src/jabon.jpg" },
  { nombre: "Galletitas Dulces Sabor Chocolate Chocolinas 170g", categoria: "Galletitas", regular: 2193.99, dto: 0, img: "./src/chocolinas.jpg" }
];

const productoCount = db.prepare("SELECT COUNT(*) AS total FROM productos").get()?.total || 0;
if (productoCount === 0) {
  const insertProducto = db.prepare(
    "INSERT INTO productos (nombre, categoria, regular, dto, img) VALUES (?, ?, ?, ?, ?)"
  );
  const transaction = db.transaction(() => {
    for (const producto of productosIniciales) {
      insertProducto.run(producto.nombre, producto.categoria, producto.regular, producto.dto, producto.img);
    }
  });
  transaction();
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function normalizarEmail(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

app.get("/api/productos", (req, res) => {
  const productos = db.prepare("SELECT * FROM productos ORDER BY id ASC").all();
  res.json(productos.map(producto => ({
    ...producto,
    regular: Number(producto.regular),
    dto: Number(producto.dto)
  })));
});

app.post("/api/productos", (req, res) => {
  const payload = req.body || {};
  const nombre = String(payload.nombre || "").trim();
  const categoria = String(payload.categoria || "").trim();
  const regular = Number(payload.regular);
  const dto = Number(payload.dto || 0);
  const img = String(payload.img || "").trim();
  const id = payload.id ? Number(payload.id) : null;

  if (!nombre || !categoria || !Number.isFinite(regular) || regular <= 0) {
    return res.status(400).json({ ok: false, mensaje: "Datos del producto inválidos." });
  }

  if (!Number.isInteger(dto) || dto < 0 || dto > 100) {
    return res.status(400).json({ ok: false, mensaje: "El descuento debe estar entre 0 y 100." });
  }

  if (id) {
    const result = db.prepare(
      "UPDATE productos SET nombre = ?, categoria = ?, regular = ?, dto = ?, img = ? WHERE id = ?"
    ).run(nombre, categoria, regular, dto, img, id);

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado." });
    }

    const productoActualizado = db.prepare("SELECT * FROM productos WHERE id = ?").get(id);
    return res.json({ ok: true, producto: productoActualizado });
  }

  const result = db.prepare(
    "INSERT INTO productos (nombre, categoria, regular, dto, img) VALUES (?, ?, ?, ?, ?)"
  ).run(nombre, categoria, regular, dto, img);

  const producto = db.prepare("SELECT * FROM productos WHERE id = ?").get(Number(result.lastInsertRowid));
  return res.status(201).json({ ok: true, producto });
});

app.delete("/api/productos/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ ok: false, mensaje: "Id inválido." });
  }

  const result = db.prepare("DELETE FROM productos WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, mensaje: "Producto no encontrado." });
  }

  return res.json({ ok: true, eliminado: id });
});

app.post("/api/clientes", (req, res) => {
  const { nombre, apellido, email, password } = req.body || {};
  const nombreTrim = String(nombre || "").trim();
  const apellidoTrim = String(apellido || "").trim();
  const emailTrim = normalizarEmail(email);
  const passwordTrim = String(password || "");

  if (!nombreTrim || !apellidoTrim || !emailTrim || !passwordTrim || passwordTrim.length < 6) {
    return res.status(400).json({ ok: false, mensaje: "Revisá los datos del cliente." });
  }

  if (emailTrim.endsWith("@admin.com")) {
    return res.status(400).json({
      ok: false,
      mensaje: "No se pueden crear administradores desde la página de registro."
    });
  }

  try {
    const result = db.prepare(
      "INSERT INTO clientes (nombre, apellido, email, password) VALUES (?, ?, ?, ?)"
    ).run(nombreTrim, apellidoTrim, emailTrim, passwordTrim);

    const cliente = db.prepare("SELECT id, nombre, apellido, email FROM clientes WHERE id = ?").get(Number(result.lastInsertRowid));
    return res.status(201).json({ ok: true, cliente });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint failed")) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe una cuenta con ese correo." });
    }

    console.error("Error al guardar cliente:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo guardar el cliente." });
  }
});

app.post("/api/login", (req, res) => {
  const email = normalizarEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, mensaje: "Correo y contraseña requeridos." });
  }

  const tablas = [
    { tabla: "administradores", role: "administrador" },
    { tabla: "clientes", role: "cliente" }
  ];

  for (const entrada of tablas) {
    const usuario = db.prepare(
      `SELECT id, nombre, apellido, email, password FROM ${entrada.tabla} WHERE lower(email) = lower(?) AND password = ?`
    ).get(email, password);

    if (usuario) {
      return res.json({
        ok: true,
        role: entrada.role,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          password: usuario.password,
          role: entrada.role
        }
      });
    }
  }

  return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos." });
});

app.get("/api/usuario/:email", (req, res) => {
  const email = normalizarEmail(req.params.email);

  if (!email) {
    return res.status(400).json({ ok: false, mensaje: "Correo requerido." });
  }

  const tablas = [
    { tabla: "administradores", role: "administrador" },
    { tabla: "clientes", role: "cliente" }
  ];

  for (const entrada of tablas) {
    const usuario = db.prepare(
      `SELECT id, nombre, apellido, email, password FROM ${entrada.tabla} WHERE lower(email) = lower(?)`
    ).get(email);

    if (usuario) {
      return res.json({
        ok: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          password: usuario.password,
          role: entrada.role
        }
      });
    }
  }

  return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado." });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, database: DB_PATH });
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
