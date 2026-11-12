  (() => {
  const leerSesion = (): { email: string; role: string } | null => {
    try {
      const raw = localStorage.getItem("usuarioSesion");
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data.email === "string" && data.email.trim()) {
          return {
            email: data.email.trim().toLowerCase(),
            role: typeof data.role === "string" ? data.role : "cliente"
          };
        }
      }
    } catch (error) {
      console.warn("No se pudo leer la sesión actual.", error);
    }

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const role = params.get("role");
    if (!email || !email.trim()) return null;

    const sesion = {
      email: email.trim().toLowerCase(),
      role: role || "cliente"
    };

    try { localStorage.setItem("usuarioSesion", JSON.stringify(sesion)); } catch (error) {
      console.warn("No se pudo guardar la sesión actual.", error);
    }
    return sesion;
  };

  // Controla el menú desplegable y el botón de sesión de esta página.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");
  if (menuLista && menuBtn && !(menuBtn as HTMLElement).dataset.menuBound) {
    (menuBtn as HTMLElement).dataset.menuBound = "true";
    const botonMenu = menuBtn;
    const listaMenu = menuLista;
    const cerrarMenu = () => {
      listaMenu.classList.remove("abierto");
      botonMenu.setAttribute("aria-expanded", "false");
    };
    botonMenu.addEventListener("click", e => {
      e.stopPropagation();
      const abierto = listaMenu.classList.toggle("abierto");
      botonMenu.setAttribute("aria-expanded", String(abierto));
    });
    document.addEventListener("click", cerrarMenu);
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });
  }

  const botonSesion = document.getElementById("cerrarSesion");
  const sesionActual = leerSesion();
  if (botonSesion) {
    const sesionActiva = Boolean(sesionActual && sesionActual.email);
    const loginUrl = window.location.pathname.includes("/html/") ? "login.html" : "./html/login.html";
    botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
    botonSesion.addEventListener("click", () => {
      if (sesionActiva) localStorage.removeItem("usuarioSesion");
      window.location.href = new URL(loginUrl, window.location.href).toString();
    });
  }


  // Funciones pequeñas para dar formato a importes, fechas y texto seguro.
  const fmt = (n:number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  type Item = { nombre: string; cantidad: number; regular: number; dto: number; dtoEmpleado?: number; img?: string; emoji?: string };
  type Venta = { nro: string | number; fecha: string; items: Item[]; subtotal: number; descuentos: number; descuentoEmpleado?: number; total: number };
  const precioFinal = (p: Item) => p.regular * (1 - p.dto / 100) * (1 - (p.dtoEmpleado || 0) / 100);
  const fechaLinda = (iso:string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });
  const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapar = (texto:string) => String(texto).replace(/[&<>"']/g, caracter => mapa[caracter] || caracter);
 
  // Las fotos suelen guardarse con ruta desde el inicio. Como esta página está
  // dentro de html/, ajustamos las rutas para que el navegador encuentre la imagen.
  const rutaFoto = (src:string) => /^(https?:|data:|\/|\.\.\/)/.test(src)
    ? src
    : "../" + src.replace(/^\.\//, "");
 
  // Cada cuenta tiene una clave distinta; así el historial queda separado.
  let historial: Venta[] = [];
  try {
    const correoSesion = leerSesion()?.email || "";
    const historialKey = correoSesion ? `historial:${encodeURIComponent(correoSesion)}` : "historial:invitado";
    const guardado = localStorage.getItem(historialKey);
    const datos = guardado ? JSON.parse(guardado) : [];
    historial = Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudo cargar el historial de esta cuenta.", error);
  }
 
  const vistaLista = document.getElementById("vistaLista");
  const vistaDetalle = document.getElementById("vistaDetalle");
  const detalle = document.getElementById("detalle");
  if (!vistaLista || !vistaDetalle || !detalle) return;
 
  // Crea en el HTML una tarjeta por cada compra guardada.
  function dibujarLista() {
    if (!vistaLista || !vistaDetalle || !detalle) return;
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
  function mostrarDetalle(nro:string) {
    if (!vistaLista || !vistaDetalle || !detalle) return;
    const v = historial.find(x => String(x.nro) === nro);
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
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-nro]");
    if (b?.dataset.nro) mostrarDetalle(b.dataset.nro);
  });
  document.getElementById("btnVolver")?.addEventListener("click", () => {
    // Oculta el detalle y vuelve a mostrar la lista de compras.
    vistaDetalle.hidden = true;
    vistaLista.hidden = false;
  });
 
  dibujarLista();
})();
