// Cada producto tiene id, nombre, categoría, precio, descuento e imagen.
// Para usar otra foto, cambiá el valor de img por la ruta de esa imagen.
  const productosIniciales = [
    { id: 1, nombre: "Detergente MAGISTRAL Ultra Limón Botella 500ml ", categoria: "Limpieza", regular: 3028.29, dto: 35, img: "./src/detergente.jpg" },
    { id: 2, nombre: "Galletitas OREO Rellenas Con Crema Sabor Original 118g ", categoria: "Galletitas", regular: 2640.00, dto: 35, img: "./src/oreo.webp" },
    { id: 3, nombre: "Hamburguesa De Carne Vacuna Paty 320 Grm", categoria: "Comida", regular: 10455.00, dto: 35, img: "./src/paty.jpg" },
    { id: 4, nombre: "Galletitas PEPITOS Con Chips De Chocolate 119g. ", categoria: "Galletitas", regular: 2480.00 , dto: 0, img: "./src/pepito.jpg" },
    { id: 5, nombre: "Salchichas X6 Swift Paq 225 Grm ", categoria: "Comida", regular: 2919.00, dto: 20, img: "./src/salchicha.jpg" },
    { id: 6, nombre: "Jabon En Barra DOVE Original Individual 90 G ", categoria: "Limpieza", regular: 2738.99 , dto: 0, img: "./src/jabon.jpg" },
    { id: 7, nombre: "Galletitas Dulces Sabor Chocolate Chocolinas 170g", categoria: "Galletitas", regular: 2193.99 , dto: 0, img: "./src/chocolinas.jpg" }
  ];

  // El panel de administración y la tienda comparten este catálogo.
  const PRODUCTOS_KEY = "catalogoProductos";
  // Leemos la cuenta activa para separar carritos y aplicar el descuento de empleado.
  let correoSesion = "";
  try {
    correoSesion = sessionStorage.getItem("usuarioSesion") || "";
  } catch (error) {
    console.error("No se pudo verificar el descuento de empleado.", error);
  }
  const descuentoEmpleado = correoSesion.toLowerCase().endsWith("@admin.com") ? 0.10 : 0;
  // El correo forma parte del nombre de la clave de carrito de cada cuenta.
  const carritoKey = correoSesion ? `carrito:${encodeURIComponent(correoSesion.toLowerCase())}` : null;

  // Lee el catálogo guardado y comprueba que cada producto tenga datos válidos.
  // Si el almacenamiento no existe o no tiene el formato esperado, usa los productos iniciales.
  function cargarProductos() {
    try {
      const guardados = localStorage.getItem(PRODUCTOS_KEY);
      if (guardados === null) return productosIniciales;
      const productosGuardados = JSON.parse(guardados);
      if (Array.isArray(productosGuardados) && productosGuardados.every(p =>
        p && Number.isInteger(p.id) && typeof p.nombre === "string" &&
        typeof p.categoria === "string" && Number.isFinite(p.regular) &&
        Number.isFinite(p.dto) && typeof p.img === "string"
      )) return productosGuardados;
      console.error("El catálogo guardado tiene un formato inválido; se mostrarán los productos iniciales.");
    } catch (error) {
      console.error("No se pudo leer el catálogo guardado; se mostrarán los productos iniciales.", error);
    }
    return productosIniciales;
  }
  const productos = cargarProductos();

  // Convierte caracteres especiales para que los nombres no se interpreten como HTML.
  const escapar = texto => String(texto).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);

  // Convierte una ruta de imagen a una dirección completa; devuelve vacío si no es válida.
  function rutaImagen(imagen) {
    if (!imagen) return "";
    try {
      const url = new URL(imagen, window.location.href);
      return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  // Formato de moneda y referencias a los elementos principales del catálogo.
  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grilla = document.getElementById("grilla");
  const select = document.getElementById("categoria");
  // Guarda la cantidad elegida en cada tarjeta mientras la página está abierta.
  const cantidades = {};
  let enCarrito = 0;

  // Construye el filtro con las categorías que aparecen en los productos.
  const categorias = ["Todas", ...new Set(productos.map(p => p.categoria))];
  select.innerHTML = categorias.map(c => `<option value="${escapar(c)}">${escapar(c)}</option>`).join("");

  // Dibuja las tarjetas de productos de la categoría seleccionada.
  function dibujar() {
    const cat = select.value;
    const lista = productos.filter(p => cat === "Todas" || p.categoria === cat);
    if (!lista.length) {
      grilla.innerHTML = '<p class="vacio">No hay productos en esta categoría.</p>';
      return;
    }
    grilla.innerHTML = lista.map(p => {
      const final = p.regular * (1 - p.dto / 100) * (1 - descuentoEmpleado);
      const cant = cantidades[p.id] || 1;
      const imagen = rutaImagen(p.img);
      return `
        <article class="producto">
          ${p.dto ? `<span class="badge">${p.dto}%DTO</span>` : ""}
          <div class="foto">${imagen ? `<img src="${escapar(imagen)}" alt="${escapar(p.nombre)}">` : escapar(p.emoji || "📦")}</div>
          <h2 class="nombre" style="font-size:1.05rem">${escapar(p.nombre)}</h2>
          ${p.dto ? `<div><span class="etiqueta">PRECIO CON ${p.dto}%DTO</span></div>` : ""}
          <div class="precio">${fmt(final)}</div>
          ${descuentoEmpleado ? `<p class="regular descuento-empleado">Descuento empleado aplicado: 10%</p>` : ""}
          ${p.dto ? `<p class="regular">Precio regular: ${fmt(p.regular)}</p>` : `<p class="regular">&nbsp;</p>`}
          <div class="cantidad">
            <button type="button" data-accion="menos" data-id="${p.id}" aria-label="Quitar uno">−</button>
            <span class="num" id="num-${p.id}">${cant}</span>
            <button type="button" data-accion="mas" data-id="${p.id}" aria-label="Agregar uno">+</button>
          </div>
          <button type="button" class="agregar" data-accion="agregar" data-id="${p.id}">Agregar</button>
        </article>`;
    }).join("");
  }

  // Un solo listener atiende los botones de todas las tarjetas (evento delegado).
  grilla.addEventListener("click", e => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const id = Number(b.dataset.id);
    const actual = cantidades[id] || 1;

    if (b.dataset.accion === "mas") cantidades[id] = Math.min(actual + 1, 99);
    if (b.dataset.accion === "menos") cantidades[id] = Math.max(actual - 1, 1);
    // Los botones guardan la acción ("mas", "menos" o "agregar") y el id del producto.
    if (b.dataset.accion === "agregar") {
  // Para agregar al carrito hace falta una sesión; si no, se guía al login.
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  if (!sesionActiva) {
    window.alert("No iniciaste sesión. Iniciá sesión para agregar productos al carrito.");
    window.location.href = "./html/login.html";
    return;
  }
  // Buscamos la información completa del producto usando el id de la tarjeta.
  const p = productos.find(x => x.id === id);
  if (!p) return;
  // Guardamos en el carrito una copia de los datos necesarios para comprarlo.
  carrito[id] = {
    id: p.id,
    nombre: p.nombre,
    regular: p.regular,
    dto: p.dto,
    emoji: p.emoji,
    img: p.img ? new URL(p.img, location.href).href : "",
    cantidad: (carrito[id] ? carrito[id].cantidad : 0) + actual
  };
  cantidades[id] = 1;
  guardarCarrito();
  dibujarCarrito();
}
    document.getElementById("num-" + id).textContent = cantidades[id] || 1;
  });


// Sección del carrito desplegable: leer, guardar y mostrar los productos agregados.

let carrito = {};
try {
  const guardado = carritoKey ? JSON.parse(localStorage.getItem(carritoKey)) || {} : {};
  for (const id in guardado) {
    if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
  }
} catch (e) {}

function guardarCarrito() {
  if (!carritoKey) return;
  // JSON.stringify convierte el objeto en texto para poder guardarlo en el navegador.
  try { localStorage.setItem(carritoKey, JSON.stringify(carrito)); } catch (error) {
    console.error("No se pudo guardar el carrito de esta cuenta.", error);
  }
}


// Para que el menú no sea demasiado largo mostramos solo los primeros tres productos.
const MAX_VISIBLES = 3;
const totalCarrito = document.getElementById("totalCarrito");
const carritoLista = document.getElementById("carritoLista");
const precioBase = p => p.regular * (1 - p.dto / 100);
const precioFinal = p => precioBase(p) * (1 - descuentoEmpleado);

// Actualiza el contador y el resumen del carrito desplegable.
function dibujarCarrito() {
  const items = Object.values(carrito);
  const unidades = items.reduce((s, p) => s + p.cantidad, 0);
  const total = items.reduce((s, p) => s + p.cantidad * precioFinal(p), 0);
  const ahorroEmpleado = items.reduce((s, p) => s + p.cantidad * precioBase(p) * descuentoEmpleado, 0);
  totalCarrito.textContent = unidades;

  if (!items.length) {
    carritoLista.innerHTML = '<p class="vacio-c">Tu carrito está vacío.</p>';
    return;
  }
  const visibles = items.slice(0, MAX_VISIBLES);
  const resto = items.length - MAX_VISIBLES;
  carritoLista.innerHTML =
    visibles.map(p => `
      <div class="item">
        <div>${escapar(p.nombre)}<small>${p.cantidad} × ${fmt(precioFinal(p))}</small></div>
        <strong>${fmt(p.cantidad * precioFinal(p))}</strong>
      </div>`).join("") +
    (resto > 0 ? `<p class="vacio-c">y ${resto} producto${resto > 1 ? "s" : ""} más</p>` : "") +
    (descuentoEmpleado ? `<div class="item"><div>Descuento empleado (10%)</div><strong>-${fmt(ahorroEmpleado)}</strong></div>` : "") +
    `<div class="total"><span>Total</span><span>${fmt(total)}</span></div>
     <a class="ver-mas" href="./html/carrito.html">Ver más</a>`;
}

// Menús desplegables y acceso al enlace de administración.
const enlaceAdmin = document.getElementById("enlaceAdmin");
try {
  // El enlace solo aparece para una sesión cuyo correo termina en @admin.com.
  const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
  enlaceAdmin.hidden = !correoSesion.endsWith("@admin.com");
} catch (error) {
  console.error("No se pudo verificar el acceso de administración.", error);
  enlaceAdmin.hidden = true;
}
const desplegables = [
  [document.getElementById("menuBtn"), document.getElementById("menuLista")],
  [document.getElementById("carritoBtn"), carritoLista]
];
// Cierra el menú principal y el carrito para que no queden abiertos a la vez.
function cerrarTodos() {
  desplegables.forEach(([btn, lista]) => {
    lista.classList.remove("abierto");
    btn.setAttribute("aria-expanded", "false");
  });
}
desplegables.forEach(([btn, lista]) => {
  // Clic en un botón: cierra los menús y abre el que corresponda.
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const estabaAbierto = lista.classList.contains("abierto");
    cerrarTodos();
    if (!estabaAbierto) {
      lista.classList.add("abierto");
      btn.setAttribute("aria-expanded", "true");
    }
  });
  lista.addEventListener("click", e => e.stopPropagation());
});
// Clic fuera o Escape cierra todos los desplegables.
document.addEventListener("click", cerrarTodos);
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarTodos(); });
 
  // El botón inicia sesión cuando no hay cuenta y cierra la sesión cuando sí la hay.
  const botonSesion = document.getElementById("cerrarSesion");
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "./html/login.html";
  });
 
  // Preparar la página mostrando el catálogo y el resumen del carrito.
  select.addEventListener("change", dibujar);
  dibujar();
  dibujarCarrito();
