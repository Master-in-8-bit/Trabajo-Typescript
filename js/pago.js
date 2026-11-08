
  // Herramientas para mostrar precios, identificar la cuenta y preparar el pago.
  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let correoSesion = "";
  try {
    correoSesion = sessionStorage.getItem("usuarioSesion") || "";
  } catch (error) {
    console.error("No se pudo verificar el descuento de empleado.", error);
  }
  const descuentoEmpleado = correoSesion.toLowerCase().endsWith("@admin.com") ? 0.10 : 0;
  // El carrito y el historial se guardan por separado para cada correo.
  const cuentaKey = encodeURIComponent(correoSesion.toLowerCase());
  const carritoKey = `carrito:${cuentaKey}`;
  const historialKey = `historial:${cuentaKey}`;
  // Calcula los precios aplicando los descuentos y evita insertar texto como HTML.
  const precioBase = p => p.regular * (1 - p.dto / 100);
  const precioFinal = p => precioBase(p) * (1 - descuentoEmpleado);
  const escapar = texto => String(texto).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[caracter]);

  // Configuración del menú, su botón de sesión y el comportamiento para cerrarlo.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");
  const botonSesion = document.getElementById("cerrarSesion");
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
  menuBtn.addEventListener("click", evento => {
    evento.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", String(abierto));
  });
  menuLista.addEventListener("click", evento => evento.stopPropagation());
  document.addEventListener("click", () => {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      menuLista.classList.remove("abierto");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "../html/login.html";
  });
 
  // Leemos el carrito que pertenece a la cuenta activa.
  let carrito = {};
  try {
    const guardado = correoSesion ? JSON.parse(localStorage.getItem(carritoKey)) || {} : {};
    for (const id in guardado) {
      if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
    }
  } catch (e) {}
 
  // Object.values transforma el objeto por id en una lista para calcular totales.
  const items = Object.values(carrito);
  const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
  const descuentos = items.reduce((s, p) => s + p.cantidad * (p.regular - precioBase(p)), 0);
  const ahorroEmpleado = items.reduce((s, p) => s + p.cantidad * precioBase(p) * descuentoEmpleado, 0);
  const total = subtotal - descuentos - ahorroEmpleado;
 
  const seccionPago = document.getElementById("seccionPago");
 
  // Sin productos no tiene sentido mostrar el formulario de pago.
  if (!items.length) {
    // Carrito vacío: no se puede pagar
    seccionPago.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
    document.getElementById("seccionResumen").hidden = true;
  } else {
    document.getElementById("items").innerHTML = items.map(p => `
      <div class="linea">
        <span>${escapar(p.nombre)}<br><small>${p.cantidad} × ${fmt(precioFinal(p))}</small></span>
        <strong>${fmt(p.cantidad * precioFinal(p))}</strong>
      </div>`).join("");
    document.getElementById("subtotal").textContent = fmt(subtotal);
    document.getElementById("descuentos").textContent = "-" + fmt(descuentos);
    const filaDescuentoEmpleado = document.getElementById("filaDescuentoEmpleado");
    filaDescuentoEmpleado.hidden = !descuentoEmpleado;
    document.getElementById("descuentoEmpleado").textContent = "-" + fmt(ahorroEmpleado);
    document.getElementById("total").textContent = fmt(total);
 
    // Si encontramos los datos de la cuenta, usamos su nombre como titular inicial.
    try {
      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
      let u = usuarios.find(usuario => usuario.email.toLowerCase() === correoSesion.toLowerCase());
      if (!u) {
        const usuarioAnterior = JSON.parse(localStorage.getItem("usuario") || "null");
        if (usuarioAnterior && usuarioAnterior.email.toLowerCase() === correoSesion.toLowerCase()) u = usuarioAnterior;
      }
      if (u && u.nombre) document.getElementById("titular").value = (u.nombre + " " + (u.apellido || "")).trim();
    } catch (e) {}
 
    const titular = document.getElementById("titular");
    const numero = document.getElementById("numero");
    const venc = document.getElementById("venc");
    const cvv = document.getElementById("cvv");
    const campos = { titular, numero, venc, cvv };
    const errores = {
      titular: document.getElementById("errTitular"),
      numero: document.getElementById("errNumero"),
      venc: document.getElementById("errVenc"),
      cvv: document.getElementById("errCvv")
    };
 
    // Ayudamos a completar los datos con el formato esperado.
    numero.addEventListener("input", () => {
      const d = numero.value.replace(/\D/g, "").slice(0, 16);
      numero.value = d.replace(/(.{4})/g, "$1 ").trim();
    });
    venc.addEventListener("input", () => {
      const d = venc.value.replace(/\D/g, "").slice(0, 4);
      venc.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
    cvv.addEventListener("input", () => { cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4); });
 
    // Muestra un error al lado del campo y marca el campo visualmente.
    function setError(c, texto) {
      errores[c].textContent = texto;
      campos[c].classList.add("invalid");
    }
 
    // Comprueba los campos antes de simular la aprobación del pago.
    function validar() {
      let ok = true;
      for (const c in campos) { errores[c].textContent = ""; campos[c].classList.remove("invalid"); }
 
      if (titular.value.trim().length < 3) { setError("titular", "Ingresá el nombre del titular."); ok = false; }
 
      if (numero.value.replace(/\s/g, "").length !== 16) {
        setError("numero", "El número debe tener 16 dígitos."); ok = false;
      }
 
      const m = venc.value.match(/^(\d{2})\/(\d{2})$/);
      if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
        setError("venc", "Usá el formato MM/AA."); ok = false;
      } else {
        const hoy = new Date();
        const finMes = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
        if (finMes < hoy) { setError("venc", "La tarjeta está vencida."); ok = false; }
      }
 
      if (cvv.value.length < 3) { setError("cvv", "Ingresá 3 o 4 dígitos."); ok = false; }
      return ok;
    }
 
    // Al corregir un campo, desaparece su mensaje de error.
    for (const c in campos) {
      campos[c].addEventListener("input", () => {
        errores[c].textContent = "";
        campos[c].classList.remove("invalid");
      });
    }
 
    document.getElementById("formPago").addEventListener("submit", async e => {
      e.preventDefault();
      // Comprobamos la sesión otra vez al enviar, no solo al abrir esta página.
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
      if (!validar()) return;
 
      // Desactivamos el botón para evitar enviar el formulario varias veces.
      const btn = document.getElementById("btnConfirmar");
      btn.disabled = true;
      btn.textContent = "Procesando pago...";
      await new Promise(r => setTimeout(r, 1800));   // simulación
 
      // Esta tienda simula el pago: registra la compra y luego vacía el carrito.
      // El historial se inserta al principio para que la compra más nueva aparezca primero.
let historial = [];
try { historial = JSON.parse(localStorage.getItem(historialKey)) || []; } catch (err) {
  console.error("No se pudo leer el historial de esta cuenta.", err);
}
const nroPedido = "#" + String(historial.length + 1).padStart(4, "0");
historial.unshift({
  nro: nroPedido,
  fecha: new Date().toISOString(),
  items: items.map(p => ({
    nombre: p.nombre, cantidad: p.cantidad, regular: p.regular,
    dto: p.dto, dtoEmpleado: descuentoEmpleado * 100,
    img: p.img || "", emoji: p.emoji || ""
  })),
  subtotal: subtotal,
  descuentos: descuentos,
  descuentoEmpleado: ahorroEmpleado,
  total: total
});
// Guardamos la compra completa para poder mostrarla después en Historial.
try { localStorage.setItem(historialKey, JSON.stringify(historial)); } catch (err) {
  console.error("No se pudo guardar el historial de esta cuenta.", err);
}

// La compra ya quedó registrada; quitamos del navegador el carrito pagado.
try { localStorage.removeItem(carritoKey); } catch (err) {
  console.error("No se pudo vaciar el carrito de esta cuenta.", err);
}
 
      // Ocultamos el formulario y mostramos el número de pedido y el total.
      document.getElementById("textoPedido").textContent = "Número de pedido: " + nroPedido;
      document.getElementById("textoTotal").textContent = "Total pagado: " + fmt(total);
      seccionPago.hidden = true;
      document.getElementById("seccionResumen").hidden = true;
      document.getElementById("exito").hidden = false;
    });
  }
