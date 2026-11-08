// Formatea importes en pesos argentinos con dos decimales.
const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Leemos el correo activo para aplicar beneficios y separar el carrito de cada cuenta.
let correoSesion = "";
try {
  correoSesion = sessionStorage.getItem("usuarioSesion") || "";
} catch (error) {
  console.error("No se pudo verificar el descuento de empleado.", error);
}
const descuentoEmpleado = correoSesion.toLowerCase().endsWith("@admin.com") ? 0.10 : 0;
// Cada cuenta tiene su propia clave de almacenamiento para no mezclar carritos.
const carritoKey = correoSesion ? `carrito:${encodeURIComponent(correoSesion.toLowerCase())}` : null;
// El descuento del producto se aplica primero; luego se calcula el precio final.
const precioBase = p => p.regular * (1 - p.dto / 100);
const precioFinal = p => precioBase(p) * (1 - descuentoEmpleado);
// Convierte caracteres especiales en entidades HTML antes de insertar texto.
const escapar = texto => String(texto).replace(/[&<>"']/g, caracter => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[caracter]);

// Conectar los controles del menú si están presentes en esta página.
const menuBtn = document.getElementById("menuBtn");
const menuLista = document.getElementById("menuLista");
if (menuBtn && menuLista) {
  // Permite abrir/cerrar el menú, y cerrarlo con clic afuera o Escape.
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
// Muestra el texto correcto y permite cerrar la sesión.
const btnSalir = document.getElementById("cerrarSesion");
if (btnSalir) {
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  btnSalir.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
  btnSalir.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "../html/login.html";
  });
}

/* FIN HEADER */

// Cargar desde el navegador el carrito asociado al correo actual.
let carrito = {};
try {
  const guardado = carritoKey ? JSON.parse(localStorage.getItem(carritoKey)) || {} : {};
  for (const id in guardado) {
    if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
  }
} catch (e) {}

function guardar() {
  if (!carritoKey) return;
  // localStorage guarda texto; JSON convierte el objeto del carrito a ese formato.
  try { localStorage.setItem(carritoKey, JSON.stringify(carrito)); } catch (error) {
    console.error("No se pudo guardar el carrito de esta cuenta.", error);
  }
}

const lista = document.getElementById("lista");
const btnPagar = document.getElementById("btnPagar");
const btnVaciar = document.getElementById("btnVaciar");

// Actualiza los productos visibles y vuelve a calcular todos los importes.
function dibujar() {
  const items = Object.values(carrito);

  // El subtotal usa precios originales; los descuentos se restan para obtener el total.
  const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
  const descuentos = items.reduce((s, p) => s + p.cantidad * (p.regular - precioBase(p)), 0);
  const ahorroEmpleado = items.reduce((s, p) => s + p.cantidad * precioBase(p) * descuentoEmpleado, 0);
  const total = subtotal - descuentos - ahorroEmpleado;

  document.getElementById("subtotal").textContent = fmt(subtotal);
  document.getElementById("descuentos").textContent = "-" + fmt(descuentos);
  const filaDescuentoEmpleado = document.getElementById("filaDescuentoEmpleado");
  filaDescuentoEmpleado.hidden = !descuentoEmpleado;
  document.getElementById("descuentoEmpleado").textContent = "-" + fmt(ahorroEmpleado);
  document.getElementById("total").textContent = fmt(total);
  btnPagar.disabled = btnVaciar.disabled = !items.length;

  // Si no quedan productos, mostramos el mensaje de carrito vacío.
  if (!items.length) {
    lista.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
    return;
  }
  lista.innerHTML = items.map(p => `
    <div class="item">
      <div class="foto">${p.img ? `<img src="${escapar(p.img)}" alt="${escapar(p.nombre)}">` : escapar(p.emoji || "")}</div>
      <div>
        <p class="nombre">${escapar(p.nombre)}</p>
        <p class="detalle">
          ${fmt(precioFinal(p))} c/u
          ${p.dto ? `<span class="dto">(${p.dto}% DTO)</span>` : ""}
          ${descuentoEmpleado ? `<span class="dto"> + 10% descuento empleado</span>` : ""}
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

// Un solo listener atiende los botones de todos los productos (evento delegado).
lista.addEventListener("click", e => {
  const b = e.target.closest("button[data-accion]");
  if (!b) return;
  const id = Number(b.dataset.id);
  if (!carrito[id]) return;
  // Los botones guardan su acción e id en atributos data-* del HTML.
  if (b.dataset.accion === "mas") carrito[id].cantidad = Math.min(carrito[id].cantidad + 1, 99);
  if (b.dataset.accion === "menos") carrito[id].cantidad = Math.max(carrito[id].cantidad - 1, 1);
  if (b.dataset.accion === "quitar") delete carrito[id];
  guardar();
  dibujar();
});

btnVaciar.addEventListener("click", () => {
  // Pedimos confirmación antes de quitar todos los productos.
  if (confirm("¿Querés vaciar el carrito?")) {
    carrito = {};
    guardar();
    dibujar();
  }
});

btnPagar.addEventListener("click", () => {
  // No se puede iniciar una compra si no hay una cuenta activa.
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  if (!sesionActiva) {
    window.alert("No iniciaste sesión. Iniciá sesión para realizar una compra.");
    window.location.href = "../html/login.html";
    return;
  }
  // Con sesión activa se abre el formulario para completar el pago.
  window.location.href = "pago.html";
});

// Dibuja la vista inicial usando el carrito leído del almacenamiento.
dibujar();