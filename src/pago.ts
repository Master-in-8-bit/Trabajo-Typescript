//esta mierda esta recontra vibecodeada, si hay algun error no me pregunten, no quiero saber nada mas de esta mierda, lo odio con toda mi alma y me quiero matar


// ---------- Tipos ----------
interface ItemCarrito {
  nombre: string;
  cantidad: number;
  regular: number;
  dto: number;
  img?: string;
  emoji?: string;
}
 
interface Usuario {
  email: string;
  nombre?: string;
  apellido?: string;
}
 
interface ItemPedido {
  nombre: string;
  cantidad: number;
  regular: number;
  dto: number;
  dtoEmpleado: number;
  img: string;
  emoji: string;
}
 
interface Pedido {
  nro: string;
  fecha: string;
  items: ItemPedido[];
  subtotal: number;
  descuentos: number;
  descuentoEmpleado: number;
  total: number;
}
 
type Campo = "titular" | "numero" | "venc" | "cvv";
type Precio = Pick<ItemCarrito, "regular" | "dto">;
 
// Verifica que un valor leído de localStorage tenga la forma de un ítem del carrito.
function esItemCarrito(valor: unknown): valor is ItemCarrito {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v.nombre === "string" &&
    typeof v.cantidad === "number" &&
    typeof v.regular === "number" &&
    typeof v.dto === "number"
  );
}
 
// Busca un elemento por id y falla con un mensaje claro si no existe.
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta el elemento #${id}`);
  return el as T;
};
 
(() => {
  // Herramientas para mostrar precios, identificar la cuenta y preparar el pago.
  const fmt = (n: number): string =>
    "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
  const params = new URLSearchParams(window.location.search);
  const correoSesion = (params.get("email") || "").toLowerCase();
  const descuentoEmpleado = correoSesion.endsWith("@admin.com") ? 0.10 : 0;
 
  // El carrito y el historial se guardan por separado para cada correo.
  const cuentaKey = encodeURIComponent(correoSesion.toLowerCase());
  const carritoKey = `carrito:${cuentaKey}`;
  const historialKey = `historial:${cuentaKey}`;
 
  // Calcula los precios aplicando los descuentos y evita insertar texto como HTML.
  const precioBase = (p: Precio): number => p.regular * (1 - p.dto / 100);
  const precioFinal = (p: Precio): number => precioBase(p) * (1 - descuentoEmpleado);
  const mapa: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  };
  const escapar = (texto: string): string =>
    String(texto).replace(/[&<>"']/g, caracter => mapa[caracter] || caracter);
 
  // Configuración del menú, su botón de sesión y el comportamiento para cerrarlo.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");
  const botonSesion = document.getElementById("cerrarSesion");
  if (!menuBtn || !menuLista || !botonSesion) return;
  const sesionActiva = Boolean(params.get("email"));
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
    window.location.href = "../html/login.html";
  });
 
  // Leemos el carrito que pertenece a la cuenta activa.
  const carrito: Record<string, ItemCarrito> = {};
  try {
    const guardado: Record<string, unknown> = correoSesion
      ? JSON.parse(localStorage.getItem(carritoKey) || "{}")
      : {};
    for (const id in guardado) {
      const item = guardado[id];
      if (esItemCarrito(item)) carrito[id] = item;
    }
  } catch (e) {}
 
  // Object.values transforma el objeto por id en una lista para calcular totales.
  const items = Object.values(carrito);
  const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
  const descuentos = items.reduce((s, p) => s + p.cantidad * (p.regular - precioBase(p)), 0);
  const ahorroEmpleado = items.reduce((s, p) => s + p.cantidad * precioBase(p) * descuentoEmpleado, 0);
  const total = subtotal - descuentos - ahorroEmpleado;
 
  const seccionPago = $("seccionPago");
 
  // Sin productos no tiene sentido mostrar el formulario de pago.
  if (!items.length) {
    // Carrito vacío: no se puede pagar
    seccionPago.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
    $("seccionResumen").hidden = true;
  } else {
    $("items").innerHTML = items.map(p => `
      <div class="linea">
        <span>${escapar(p.nombre)}<br><small>${p.cantidad} × ${fmt(precioFinal(p))}</small></span>
        <strong>${fmt(p.cantidad * precioFinal(p))}</strong>
      </div>`).join("");
    $("subtotal").textContent = fmt(subtotal);
    $("descuentos").textContent = "-" + fmt(descuentos);
    $("filaDescuentoEmpleado").hidden = !descuentoEmpleado;
    $("descuentoEmpleado").textContent = "-" + fmt(ahorroEmpleado);
    $("total").textContent = fmt(total);
 
    const titular = $<HTMLInputElement>("titular");
    const numero = $<HTMLInputElement>("numero");
    const venc = $<HTMLInputElement>("venc");
    const cvv = $<HTMLInputElement>("cvv");
 
    // Si encontramos los datos de la cuenta, usamos su nombre como titular inicial.
    const cargarTitularDesdeBase = async (): Promise<void> => {
      try {
        const correoSesionActual = (params.get("email") || "").trim();
        if (!correoSesionActual) return;

        const respuesta = await fetch(`/api/usuario/${encodeURIComponent(correoSesionActual)}`);
        const data = await respuesta.json();

        if (respuesta.ok && data.ok && data.usuario && data.usuario.nombre) {
          const u = data.usuario as Usuario;
          titular.value = (u.nombre + " " + (u.apellido || "")).trim();
        }
      } catch (e) {
        console.error("No se pudo cargar el titular desde SQLite.", e);
      }
    };

    void cargarTitularDesdeBase();
 
    const campos: Record<Campo, HTMLInputElement> = { titular, numero, venc, cvv };
    const errores: Record<Campo, HTMLElement> = {
      titular: $("errTitular"),
      numero: $("errNumero"),
      venc: $("errVenc"),
      cvv: $("errCvv")
    };
    const nombresCampos = Object.keys(campos) as Campo[];
 
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
    function setError(c: Campo, texto: string): void {
      errores[c].textContent = texto;
      campos[c].classList.add("invalid");
    }
 
    // Comprueba los campos antes de simular la aprobación del pago.
    function validar(): boolean {
      let ok = true;
      for (const c of nombresCampos) {
        errores[c].textContent = "";
        campos[c].classList.remove("invalid");
      }
 
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
    for (const c of nombresCampos) {
      campos[c].addEventListener("input", () => {
        errores[c].textContent = "";
        campos[c].classList.remove("invalid");
      });
    }
 
    $<HTMLFormElement>("formPago").addEventListener("submit", async e => {
      e.preventDefault();
      // Comprobamos la sesión otra vez al enviar, no solo al abrir esta página.
      const sesionActivaAlEnviar = Boolean(new URLSearchParams(window.location.search).get("email"));
      if (!sesionActivaAlEnviar) {
        window.alert("No iniciaste sesión. Iniciá sesión para realizar una compra.");
        window.location.href = "../html/login.html";
        return;
      }
      if (!validar()) return;
 
      // Desactivamos el botón para evitar enviar el formulario varias veces.
      const btn = $<HTMLButtonElement>("btnConfirmar");
      btn.disabled = true;
      btn.textContent = "Procesando pago...";
      await new Promise<void>(r => setTimeout(r, 1800));   // simulación
 
      // Esta tienda simula el pago: registra la compra y luego vacía el carrito.
      // El historial se inserta al principio para que la compra más nueva aparezca primero.
      let historial: Pedido[] = [];
      try {
        historial = JSON.parse(localStorage.getItem(historialKey) || "[]");
      } catch (err) {
        console.error("No se pudo leer el historial de esta cuenta.", err);
      }
      const nroPedido = "#" + String(historial.length + 1).padStart(4, "0");
      historial.unshift({
        nro: nroPedido,
        fecha: new Date().toISOString(),
        items: items.map(p => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          regular: p.regular,
          dto: p.dto,
          dtoEmpleado: descuentoEmpleado * 100,
          img: p.img || "",
          emoji: p.emoji || ""
        })),
        subtotal,
        descuentos,
        descuentoEmpleado: ahorroEmpleado,
        total
      });
 
      // Guardamos la compra completa para poder mostrarla después en Historial.
      try {
        localStorage.setItem(historialKey, JSON.stringify(historial));
      } catch (err) {
        console.error("No se pudo guardar el historial de esta cuenta.", err);
      }
 
      // La compra ya quedó registrada; quitamos del navegador el carrito pagado.
      try {
        localStorage.removeItem(carritoKey);
      } catch (err) {
        console.error("No se pudo vaciar el carrito de esta cuenta.", err);
      }
 
      // Ocultamos el formulario y mostramos el número de pedido y el total.
      $("textoPedido").textContent = "Número de pedido: " + nroPedido;
      $("textoTotal").textContent = "Total pagado: " + fmt(total);
      seccionPago.hidden = true;
      $("seccionResumen").hidden = true;
      $("exito").hidden = false;
    });
  }
})();
