const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const precioFinal = p => p.regular * (1 - p.dto / 100);

// Menú desplegable (solo funciona si existe en esta página)
const menuBtn = document.getElementById("menuBtn");
const menuLista = document.getElementById("menuLista");
if (menuBtn && menuLista) {
  const cerrarMenu = () => {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });
  document.addEventListener("click", cerrarMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });
}
const btnSalir = document.getElementById("cerrarSesion");
if (btnSalir) {
  btnSalir.addEventListener("click", () => { window.location.href = "login.html"; });
}

/* FIN HEADER */

// Cargar el carrito guardado
let carrito = {};
try {
  const guardado = JSON.parse(localStorage.getItem("carrito")) || {};
  for (const id in guardado) {
    if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
  }
} catch (e) {}

function guardar() {
  try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch (e) {}
}

const lista = document.getElementById("lista");
const btnPagar = document.getElementById("btnPagar");
const btnVaciar = document.getElementById("btnVaciar");

function dibujar() {
  const items = Object.values(carrito);

  // Subtotal = sin descuento. Total = con descuento.
  const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
  const total = items.reduce((s, p) => s + p.cantidad * precioFinal(p), 0);
  const descuentos = subtotal - total;

  document.getElementById("subtotal").textContent = fmt(subtotal);
  document.getElementById("descuentos").textContent = "-" + fmt(descuentos);
  document.getElementById("total").textContent = fmt(total);
  btnPagar.disabled = btnVaciar.disabled = !items.length;

  if (!items.length) {
    lista.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
    return;
  }
  lista.innerHTML = items.map(p => `
    <div class="item">
      <div class="foto">${p.img ? `<img src="${p.img}" alt="${p.nombre}">` : p.emoji}</div>
      <div>
        <p class="nombre">${p.nombre}</p>
        <p class="detalle">
          ${fmt(precioFinal(p))} c/u
          ${p.dto ? `<span class="dto">(${p.dto}% DTO)</span>` : ""}
        </p>
        <div class="controles">
          <button type="button" class="cant" data-accion="menos" data-id="${p.id}" aria-label="Quitar uno">−</button>
          <span class="num">${p.cantidad}</span>
          <button type="button" class="cant" data-accion="mas" data-id="${p.id}" aria-label="Agregar uno">+</button>
          <button type="button" class="quitar" data-accion="quitar" data-id="${p.id}">Quitar</button>
        </div>
      </div>
      <div class="sub-item">${fmt(p.cantidad * precioFinal(p))}</div>
    </div>`).join("");
}

lista.addEventListener("click", e => {
  const b = e.target.closest("button[data-accion]");
  if (!b) return;
  const id = Number(b.dataset.id);
  if (!carrito[id]) return;
  if (b.dataset.accion === "mas") carrito[id].cantidad = Math.min(carrito[id].cantidad + 1, 99);
  if (b.dataset.accion === "menos") carrito[id].cantidad = Math.max(carrito[id].cantidad - 1, 1);
  if (b.dataset.accion === "quitar") delete carrito[id];
  guardar();
  dibujar();
});

btnVaciar.addEventListener("click", () => {
  if (confirm("¿Querés vaciar el carrito?")) {
    carrito = {};
    guardar();
    dibujar();
  }
});

btnPagar.addEventListener("click", () => {
  window.location.href = "pago.html";   // cambiá por tu página de pago
});

dibujar();