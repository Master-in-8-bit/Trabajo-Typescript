  // Controla el menú desplegable y el botón de sesión de esta página.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");

  // Cierra el menú y comunica el cambio a tecnologías de asistencia.
  function cerrarMenu() {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  // Abre o cierra el menú; también se cierra al hacer clic afuera o pulsar Escape.
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });
  document.addEventListener("click", cerrarMenu);               // clic afuera
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });

  const botonSesion = document.getElementById("cerrarSesion");
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
  // El mismo botón permite salir de la cuenta o dirigirse al login.
  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "../html/login.html";
  });


  // Funciones pequeñas para dar formato a importes, fechas y texto seguro.
  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const precioFinal = p => p.regular * (1 - p.dto / 100) * (1 - (p.dtoEmpleado || 0) / 100);
  const fechaLinda = iso => new Date(iso).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
    const escapar = texto => String(texto).replace(/[&<>"']/g, caracter => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[caracter]);
 
  // Las fotos suelen guardarse con ruta desde el inicio. Como esta página está
  // dentro de html/, ajustamos las rutas para que el navegador encuentre la imagen.
  const rutaFoto = src => /^(https?:|data:|\/|\.\.\/)/.test(src)
    ? src
    : "../" + src.replace(/^\.\//, "");
 
  // Cada cuenta tiene una clave distinta; así el historial queda separado.
  let historial = [];
  try {
    const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
    const historialKey = correoSesion ? `historial:${encodeURIComponent(correoSesion)}` : null;
    historial = historialKey ? JSON.parse(localStorage.getItem(historialKey)) || [] : [];
  } catch (error) {
    console.error("No se pudo cargar el historial de esta cuenta.", error);
  }
 
  const vistaLista = document.getElementById("vistaLista");
  const vistaDetalle = document.getElementById("vistaDetalle");
  const detalle = document.getElementById("detalle");
 
  // Crea en el HTML una tarjeta por cada compra guardada.
  function dibujarLista() {
    if (!historial.length) {
      vistaLista.innerHTML = '<div class="panel vacio">Todavía no hiciste ninguna compra.<br><a href="../index.html">Ir a ver productos</a></div>';
      return;
    }
    vistaLista.innerHTML = historial.map(v => {
      const unidades = v.items.reduce((s, p) => s + p.cantidad, 0);
      return `
        <article class="panel venta">
          <div>
            <h2>Venta ${v.nro}</h2>
            <p class="meta">${fechaLinda(v.fecha)}</p>
            <p class="meta">${unidades} producto${unidades > 1 ? "s" : ""}</p>
          </div>
          <div class="derecha">
            <div class="monto">${fmt(v.total)}</div>
            <button type="button" class="btn" data-nro="${v.nro}">Ver detalle</button>
          </div>
        </article>`;
    }).join("");
  }
 
  // Busca una compra por su número y muestra los productos y totales.
  function mostrarDetalle(nro) {
    const v = historial.find(x => x.nro === nro);
    if (!v) return;
 
    detalle.innerHTML = `
      <h2>Venta ${v.nro}</h2>
      <p class="fecha">${fechaLinda(v.fecha)}</p>
      ${v.items.map(p => `
        <div class="producto">
          <div class="foto">${p.img ? `<img src="${escapar(rutaFoto(p.img))}" alt="">` : escapar(p.emoji || "🛒")}</div>
          <div>
            <p class="nombre">${escapar(p.nombre)}</p>
            <p class="det">${p.cantidad} × ${fmt(precioFinal(p))}
              ${p.dto ? `<span class="dto">(${p.dto}% DTO)</span>` : ""}
              ${p.dtoEmpleado ? `<span class="dto">(+ ${p.dtoEmpleado}% descuento empleado)</span>` : ""}</p>
          </div>
          <div class="sub">${fmt(p.cantidad * precioFinal(p))}</div>
        </div>`).join("")}
      <div class="totales">
        <div class="fila"><span>Subtotal</span><span>${fmt(v.subtotal)}</span></div>
        <div class="fila desc"><span>Descuentos</span><span>-${fmt(v.descuentos)}</span></div>
        ${v.descuentoEmpleado ? `<div class="fila desc"><span>Descuento empleado (10%)</span><span>-${fmt(v.descuentoEmpleado)}</span></div>` : ""}
        <div class="fila total"><span>Total pagado</span><span>${fmt(v.total)}</span></div>
      </div>`;
 
    vistaLista.hidden = true;
    vistaDetalle.hidden = false;
    window.scrollTo(0, 0);
  }
 
  vistaLista.addEventListener("click", e => {
    // El botón de cada compra guarda su número en data-nro.
    const b = e.target.closest("button[data-nro]");
    if (b) mostrarDetalle(b.dataset.nro);
  });
  document.getElementById("btnVolver").addEventListener("click", () => {
    // Oculta el detalle y vuelve a mostrar la lista de compras.
    vistaDetalle.hidden = true;
    vistaLista.hidden = false;
  });
 
  dibujarLista();
