// Para usar tus fotos, agregá  img: "imagenes/traviata.jpg"  a cada producto.
  const productos = [
    { id: 1, nombre: "Detergente MAGISTRAL Ultra Limón Botella 500ml ", categoria: "Limpieza", regular: 3028.29, dto: 35, img: "./src/detergente.jpg" },
    { id: 2, nombre: "Galletitas OREO Rellenas Con Crema Sabor Original 118g ", categoria: "Galletitas", regular: 2640.00, dto: 35, img: "./src/oreo.webp" },
    { id: 3, nombre: "Hamburguesa De Carne Vacuna Paty 320 Grm", categoria: "Comida", regular: 10455.00, dto: 35, img: "./src/paty.jpg" },
    { id: 4, nombre: "Galletitas PEPITOS Con Chips De Chocolate 119g. ", categoria: "Galletitas", regular: 2480.00 , dto: 0, img: "./src/pepito.jpg" },
    { id: 5, nombre: "Salchichas X6 Swift Paq 225 Grm ", categoria: "Comida", regular: 2919.00, dto: 20, img: "./src/salchicha.jpg" },
    { id: 6, nombre: "Jabon En Barra DOVE Original Individual 90 G ", categoria: "Limpieza", regular: 2738.99 , dto: 0, img: "./src/jabon.jpg" },
    { id: 7, nombre: "Galletitas Dulces Sabor Chocolate Chocolinas 170g", categoria: "Galletitas", regular: 2193.99 , dto: 0, img: "./src/chocolinas.jpg" }
  ];

  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grilla = document.getElementById("grilla");
  const select = document.getElementById("categoria");
  const cantidades = {};   // id -> cantidad elegida en la tarjeta
  let enCarrito = 0;

  // Llenar el desplegable con las categorías que existen
  const categorias = ["Todas", ...new Set(productos.map(p => p.categoria))];
  select.innerHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join("");

  function dibujar() {
    const cat = select.value;
    const lista = productos.filter(p => cat === "Todas" || p.categoria === cat);
    if (!lista.length) {
      grilla.innerHTML = '<p class="vacio">No hay productos en esta categoría.</p>';
      return;
    }
    grilla.innerHTML = lista.map(p => {
      const final = p.regular * (1 - p.dto / 100);
      const cant = cantidades[p.id] || 1;
      return `
        <article class="producto">
          ${p.dto ? `<span class="badge">${p.dto}%DTO</span>` : ""}
          <div class="foto">${p.img ? `<img src="${p.img}" alt="${p.nombre}">` : p.emoji}</div>
          <h2 class="nombre" style="font-size:1.05rem">${p.nombre}</h2>
          ${p.dto ? `<div><span class="etiqueta">PRECIO CON ${p.dto}%DTO</span></div>` : ""}
          <div class="precio">${fmt(final)}</div>
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

  // Un solo listener para todos los botones de las tarjetas
  grilla.addEventListener("click", e => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const id = Number(b.dataset.id);
    const actual = cantidades[id] || 1;

    if (b.dataset.accion === "mas") cantidades[id] = Math.min(actual + 1, 99);
    if (b.dataset.accion === "menos") cantidades[id] = Math.max(actual - 1, 1);
    if (b.dataset.accion === "agregar") {
  const p = productos.find(x => x.id === id);   // busca el producto completo
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


// Carrito desplegable

let carrito = {};
try {
  const guardado = JSON.parse(localStorage.getItem("carrito")) || {};
  for (const id in guardado) {
    if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
  }
} catch (e) {}

function guardarCarrito() {
  try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch (e) {}
}


const MAX_VISIBLES = 3;   // cuántos productos se muestran en el desplegable
const totalCarrito = document.getElementById("totalCarrito");
const carritoLista = document.getElementById("carritoLista");
const precioFinal = p => p.regular * (1 - p.dto / 100);

function dibujarCarrito() {
  const items = Object.values(carrito);
  const unidades = items.reduce((s, p) => s + p.cantidad, 0);
  const total = items.reduce((s, p) => s + p.cantidad * precioFinal(p), 0);
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
        <div>${p.nombre}<small>${p.cantidad} × ${fmt(precioFinal(p))}</small></div>
        <strong>${fmt(p.cantidad * precioFinal(p))}</strong>
      </div>`).join("") +
    (resto > 0 ? `<p class="vacio-c">y ${resto} producto${resto > 1 ? "s" : ""} más</p>` : "") +
    `<div class="total"><span>Total</span><span>${fmt(total)}</span></div>
     <a class="ver-mas" href="./html/carrito.html">Ver más</a>`;
}

// Menús desplegables (menú y carrito)
const desplegables = [
  [document.getElementById("menuBtn"), document.getElementById("menuLista")],
  [document.getElementById("carritoBtn"), carritoLista]
];
function cerrarTodos() {
  desplegables.forEach(([btn, lista]) => {
    lista.classList.remove("abierto");
    btn.setAttribute("aria-expanded", "false");
  });
}
desplegables.forEach(([btn, lista]) => {
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
document.addEventListener("click", cerrarTodos);   // clic afuera
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarTodos(); });
 
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    // sessionStorage.clear();  // si guardás datos de sesión, borralos acá
    window.location.href = "login.html";
  });
 
  select.addEventListener("change", dibujar);
  dibujar();
  dibujarCarrito();

