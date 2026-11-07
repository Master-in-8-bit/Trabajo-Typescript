// Menú desplegable
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");

  function cerrarMenu() {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });
  document.addEventListener("click", cerrarMenu);               // clic afuera
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });

  document.getElementById("cerrarSesion").addEventListener("click", () => {
    // sessionStorage.clear();  // si guardás datos de sesión, borralos acá
    window.location.href = "../html/login.html";
  });


    const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const precioFinal = p => p.regular * (1 - p.dto / 100);
  const fechaLinda = iso => new Date(iso).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
 
  // Las fotos se guardan como "./src/foto.jpg" (relativas al inicio).
  // Desde la carpeta html/ hay que subir un nivel.
  const rutaFoto = src => /^(https?:|data:|\/|\.\.\/)/.test(src)
    ? src
    : "../" + src.replace(/^\.\//, "");
 
  // Leer el historial guardado por la página de pago
  let historial = [];
  try { historial = JSON.parse(localStorage.getItem("historial")) || []; } catch (e) {}
 
  const vistaLista = document.getElementById("vistaLista");
  const vistaDetalle = document.getElementById("vistaDetalle");
  const detalle = document.getElementById("detalle");
 
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
 
  function mostrarDetalle(nro) {
    const v = historial.find(x => x.nro === nro);
    if (!v) return;
 
    detalle.innerHTML = `
      <h2>Venta ${v.nro}</h2>
      <p class="fecha">${fechaLinda(v.fecha)}</p>
      ${v.items.map(p => `
        <div class="producto">
          <div class="foto">${p.img ? `<img src="${rutaFoto(p.img)}" alt="">` : (p.emoji || "🛒")}</div>
          <div>
            <p class="nombre">${p.nombre}</p>
            <p class="det">${p.cantidad} × ${fmt(precioFinal(p))}
              ${p.dto ? `<span class="dto">(${p.dto}% DTO)</span>` : ""}</p>
          </div>
          <div class="sub">${fmt(p.cantidad * precioFinal(p))}</div>
        </div>`).join("")}
      <div class="totales">
        <div class="fila"><span>Subtotal</span><span>${fmt(v.subtotal)}</span></div>
        <div class="fila desc"><span>Descuentos</span><span>-${fmt(v.descuentos)}</span></div>
        <div class="fila total"><span>Total pagado</span><span>${fmt(v.total)}</span></div>
      </div>`;
 
    vistaLista.hidden = true;
    vistaDetalle.hidden = false;
    window.scrollTo(0, 0);
  }
 
  vistaLista.addEventListener("click", e => {
    const b = e.target.closest("button[data-nro]");
    if (b) mostrarDetalle(b.dataset.nro);
  });
  document.getElementById("btnVolver").addEventListener("click", () => {
    vistaDetalle.hidden = true;
    vistaLista.hidden = false;
  });
 
  dibujarLista();
