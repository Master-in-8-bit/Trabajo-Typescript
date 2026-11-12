"use strict";
(() => {
    const leerSesion = () => {
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
        }
        catch (error) {
            console.warn("No se pudo leer la sesión actual.", error);
        }
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email");
        const role = params.get("role");
        if (!email || !email.trim())
            return null;
        const sesion = {
            email: email.trim().toLowerCase(),
            role: role || "cliente"
        };
        try {
            localStorage.setItem("usuarioSesion", JSON.stringify(sesion));
        }
        catch (error) {
            console.warn("No se pudo restaurar la sesión.", error);
        }
        return sesion;
    };
    // Formatea importes en pesos argentinos con dos decimales.
    const fmt = (n) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sesion = leerSesion();
    const correoSesion = sesion?.email || "";
    const descuentoEmpleado = correoSesion.endsWith("@admin.com") ? 0.10 : 0;
    // Cada cuenta tiene su propia clave de almacenamiento para no mezclar carritos.
    const carritoKey = correoSesion ? `carrito:${encodeURIComponent(correoSesion)}` : "carrito:invitado";
    // El descuento del producto se aplica primero; luego se calcula el precio final.
    const precioBase = (p) => p.regular * (1 - p.dto / 100);
    const precioFinal = (p) => precioBase(p) * (1 - descuentoEmpleado);
    // Convierte caracteres especiales en entidades HTML antes de insertar texto.
    const entidades = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    };
    const escapar = (texto) => String(texto).replace(/[&<>"']/g, caracter => entidades[caracter]);
    // Muestra el texto correcto y permite cerrar la sesión.
    const btnSalir = document.querySelector("#cerrarSesion");
    if (btnSalir) {
        const sesionActiva = Boolean(sesion && sesion.email);
        btnSalir.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
        btnSalir.addEventListener("click", () => {
            if (sesionActiva)
                localStorage.removeItem("usuarioSesion");
            const loginUrl = window.location.pathname.includes("/html/") ? "login.html" : "./html/login.html";
            window.location.href = new URL(loginUrl, window.location.href).toString();
        });
    }
    /* FIN HEADER */
    // Cargar desde el navegador el carrito asociado al correo actual.
    let carrito = {};
    try {
        const guardado = carritoKey ? JSON.parse(localStorage.getItem(carritoKey) ?? "{}") || {} : {};
        for (const id in guardado) {
            if (guardado[id] && typeof guardado[id] === "object")
                carrito[Number(id)] = guardado[id];
        }
    }
    catch (e) { }
    function guardar() {
        if (!carritoKey)
            return;
        // localStorage guarda texto; JSON convierte el objeto del carrito a ese formato.
        try {
            localStorage.setItem(carritoKey, JSON.stringify(carrito));
        }
        catch (error) {
            console.error("No se pudo guardar el carrito de esta cuenta.", error);
        }
    }
    const lista = document.querySelector("#lista");
    const btnPagar = document.querySelector("#btnPagar");
    const btnVaciar = document.querySelector("#btnVaciar");
    const subtotalTexto = document.querySelector("#subtotal");
    const descuentosTexto = document.querySelector("#descuentos");
    const filaDescuentoEmpleado = document.querySelector("#filaDescuentoEmpleado");
    const descuentoEmpleadoTexto = document.querySelector("#descuentoEmpleado");
    const totalTexto = document.querySelector("#total");
    // Si falta algún elemento, avisamos con un error claro y no seguimos.
    if (lista === null || btnPagar === null || btnVaciar === null || subtotalTexto === null ||
        descuentosTexto === null || filaDescuentoEmpleado === null ||
        descuentoEmpleadoTexto === null || totalTexto === null) {
        throw new Error("Revisar los id del carrito y del resumen de precios.");
    }
    // Actualiza los productos visibles y vuelve a calcular todos los importes.
    const dibujar = () => {
        const items = Object.values(carrito);
        // El subtotal usa precios originales; los descuentos se restan para obtener el total.
        const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
        const descuentos = items.reduce((s, p) => s + p.cantidad * (p.regular - precioBase(p)), 0);
        const ahorroEmpleado = items.reduce((s, p) => s + p.cantidad * precioBase(p) * descuentoEmpleado, 0);
        const total = subtotal - descuentos - ahorroEmpleado;
        subtotalTexto.textContent = fmt(subtotal);
        descuentosTexto.textContent = "-" + fmt(descuentos);
        filaDescuentoEmpleado.hidden = !descuentoEmpleado;
        descuentoEmpleadoTexto.textContent = "-" + fmt(ahorroEmpleado);
        totalTexto.textContent = fmt(total);
        btnPagar.disabled = btnVaciar.disabled = !items.length;
        // Si no quedan productos, mostramos el mensaje de carrito vacío.
        if (!items.length) {
            lista.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
            return;
        }
        lista.innerHTML = items.map(p => {
            const precioUnitario = precioFinal(p);
            const totalItem = p.cantidad * precioUnitario;
            return `
      <article class="item">
        <div class="foto">${p.img ? `<img src="${escapar(p.img)}" alt="${escapar(p.nombre)}">` : escapar(p.emoji || "")}</div>

        <div class="item-info">
          <div class="item-header">
            <p class="nombre">${escapar(p.nombre)}</p>
            <div class="sub-item">${fmt(totalItem)}</div>
          </div>

          <div class="item-meta">
            <span>${fmt(precioUnitario)} c/u</span>
            ${p.dto ? `<span class="dto">(${p.dto}% DTO)</span>` : ""}
            ${descuentoEmpleado ? `<span class="dto">+ 10% empleado</span>` : ""}
          </div>

          <div class="controles">
            <button type="button" class="cant" data-accion="menos" data-id="${p.id}" aria-label="Quitar uno">−</button>
            <span class="num">${p.cantidad}</span>
            <button type="button" class="cant" data-accion="mas" data-id="${p.id}" aria-label="Agregar uno">+</button>
            <button type="button" class="quitar" data-accion="quitar" data-id="${p.id}">Quitar</button>
          </div>
        </div>
      </article>`;
        }).join("");
    };
    // Un solo listener atiende los botones de todos los productos (evento delegado).
    lista.addEventListener("click", e => {
        const objetivo = e.target;
        if (!(objetivo instanceof HTMLElement))
            return;
        const b = objetivo.closest("button[data-accion]");
        if (!b)
            return;
        const id = Number(b.dataset.id);
        if (!carrito[id])
            return;
        // Los botones guardan su acción e id en atributos data-* del HTML.
        if (b.dataset.accion === "mas")
            carrito[id].cantidad = Math.min(carrito[id].cantidad + 1, 99);
        if (b.dataset.accion === "menos")
            carrito[id].cantidad = Math.max(carrito[id].cantidad - 1, 1);
        if (b.dataset.accion === "quitar")
            delete carrito[id];
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
        const sesionActiva = Boolean(sesion && sesion.email);
        if (!sesionActiva) {
            window.alert("No iniciaste sesión. Iniciá sesión para realizar una compra.");
            window.location.href = "../html/login.html";
            return;
        }
        const rolePago = sesion?.role || "cliente";
        window.location.href = `pago.html?email=${encodeURIComponent(correoSesion)}&role=${encodeURIComponent(rolePago)}`;
    });
    // Dibuja la vista inicial usando el carrito leído del almacenamiento.
    dibujar();
})();
