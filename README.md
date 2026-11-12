# Catálogo de productos con autenticación y SQLite

Aplicación web de catálogo de productos desarrollada en TypeScript, Express y SQLite. La tienda permite ver productos, registrar clientes, iniciar sesión, agregar artículos al carrito, gestionar la compra y consultar el historial de compras del usuario activo. La sesión actual se maneja en el navegador y el carrito queda asociado a cada cuenta.

## Descripción general

La aplicación está compuesta por:

- frontend estático en HTML + TypeScript
- backend Express para servir la app y exponer APIs
- base de datos SQLite para persistir clientes, administradores y productos
- carrito temporal en localStorage, separado por usuario

La lógica de acceso está diseñada para aceptar tanto clientes como administradores, pero los usuarios con correo `@admin.com` no pueden crearse desde la página pública de registro. Los administradores deben generarse manualmente en la base de datos.

## Requisitos

- Node.js 18 o superior
- npm
- SQLite (se maneja a través de la librería `better-sqlite3`)

## Instalación

1. Cloná el repositorio y entrá a la carpeta del proyecto.
2. Instalá las dependencias:

```bash
npm install
```

3. Si necesitás compilar los archivos TypeScript:

```bash
npx tsc --project tsconfig.json
```

4. Iniciá el servidor:

```bash
node server.js
```

5. Abrí en el navegador:

```text
http://localhost:3000
```

## Estructura del proyecto

```text
.
├── data/
│   └── catalogo.sqlite        # Base de datos SQLite
├── dist/                       # Archivos compilados de TypeScript
├── html/                       # Páginas HTML del sitio
├── src/                        # Lógica en TypeScript
│   ├── acerca.ts
│   ├── adminIni.ts
│   ├── carrito.ts
│   ├── cuenta.ts
│   ├── historial.ts
│   ├── index.ts
│   ├── login.ts
│   ├── menu.ts
│   ├── pago.ts
│   ├── registrar.ts
│   └── Logo.png
├── styles/                     # Archivos CSS
├── index.html                  # Página principal
├── package.json
├── server.js                   # Backend Express + SQLite
├── tsconfig.json
├── README.md
└── styles.css
```

## Endpoints principales

El backend expone estos servicios:

- `GET /api/productos` — lista todos los productos
- `POST /api/productos` — crea o actualiza un producto
- `DELETE /api/productos/:id` — elimina un producto
- `POST /api/clientes` — registra un cliente
- `POST /api/login` — valida login de clientes y administradores
- `GET /api/usuario/:email` — obtiene un usuario por correo
- `GET /api/health` — chequeo básico del servidor y la BD

## Base de datos SQLite

La base de datos se crea automáticamente en `data/catalogo.sqlite` la primera vez que se inicia el servidor.

### Tabla `clientes`

Guarda los clientes que se registran desde la aplicación.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Identificador único |
| nombre | TEXT NOT NULL | Nombre del cliente |
| apellido | TEXT NOT NULL | Apellido del cliente |
| email | TEXT NOT NULL UNIQUE | Correo electrónico |
| password | TEXT NOT NULL | Contraseña del usuario |
| created_at | TEXT DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

### Tabla `administradores`

Se usa para almacenar usuarios administrativos creados manualmente, no desde la web.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Identificador único |
| nombre | TEXT NOT NULL | Nombre del administrador |
| apellido | TEXT NOT NULL | Apellido del administrador |
| email | TEXT NOT NULL UNIQUE | Correo electrónico |
| password | TEXT NOT NULL | Contraseña del administrador |
| created_at | TEXT DEFAULT CURRENT_TIMESTAMP | Fecha de alta |

### Tabla `productos`

Contiene los artículos disponibles para vender.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Identificador del producto |
| nombre | TEXT NOT NULL | Nombre del producto |
| categoria | TEXT NOT NULL | Categoría del producto |
| regular | REAL NOT NULL | Precio base |
| dto | INTEGER NOT NULL DEFAULT 0 | Descuento aplicado |
| img | TEXT DEFAULT '' | Ruta o URL de la imagen |

## Seguridad y reglas de negocio

- Los clientes se registran en la tabla `clientes`.
- Los administradores se cargan directamente en la tabla `administradores`.
- El login revisa ambas tablas (`clientes` y `administradores`).
- Los correos terminados en `@admin.com` quedan bloqueados en la creación pública de usuarios.
- El carrito es temporal y se guarda en `localStorage`, separado por cada cuenta activa.

## Puesta en marcha rápida

```bash
npm install
npx tsc --project tsconfig.json
node server.js
```

Luego abrí:

```text
http://localhost:3000
```

## Notas

- La base de datos se crea automáticamente si no existe.
- Si quieres agregar un administrador, podés insertarlo directamente en SQLite con una sentencia `INSERT` en la tabla `administradores`.
- El proyecto usa `localStorage` para la sesión y el carrito del navegador, por lo que cada usuario conserva su estado de compra en su propia cuenta del navegador.
