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
            console.warn("No se pudo leer la sesión del usuario.", error);
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
            console.warn("No se pudo guardar la sesión del usuario.", error);
        }
        return sesion;
    };
    const getCarritoKey = () => {
        const sesion = leerSesion();
        return sesion?.email ? `carrito:${encodeURIComponent(sesion.email)}` : "carrito:invitado";
    };
    let productos = [];
    const entidades = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    const escapar = (texto) => String(texto).replace(/[&<>"']/g, caracter => entidades[caracter]);
    const rutaImagen = (imagen) => {
        if (!imagen)
            return "";
        try {
            const url = new URL(imagen, new URL("./index.html", window.location.href));
            return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
        }
        catch {
            return "";
        }
    };
    async function cargarProductos() {
        try {
            const respuesta = await fetch("/api/productos");
            if (!respuesta.ok)
                throw new Error("No se pudo cargar el catálogo.");
            const datos = await respuesta.json();
            productos = Array.isArray(datos) ? datos : [];
            actualizarFiltro();
            actualizarLista();
        }
        catch (error) {
            console.error("No se pudieron cargar los productos desde SQLite.", error);
            productos = [];
            const tablaProductos = document.getElementById("tablaProductos");
            if (tablaProductos) {
                tablaProductos.innerHTML = '<p class="vacio">No se pudo cargar el catálogo.</p>';
            }
        }
    }
    const actualizarFiltro = () => {
        const filtroCategoria = document.querySelector("#categoria");
        if (!filtroCategoria)
            return;
        const categoriaActual = filtroCategoria.value;
        const categorias = ["Todas", ...new Set(productos.map(producto => producto.categoria))];
        filtroCategoria.innerHTML = categorias
            .map(categoria => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`)
            .join("");
        filtroCategoria.value = categorias.includes(categoriaActual) ? categoriaActual : "Todas";
    };
    function actualizarLista() {
        const tablaProductos = document.getElementById("tablaProductos");
        if (!tablaProductos) {
            console.error("No se encontró el elemento #tablaProductos");
            return;
        }
        const filtroCategoria = document.querySelector("#categoria");
        const categoriaActual = filtroCategoria?.value ?? "Todas";
        const productosFiltrados = productos.filter(producto => categoriaActual === "Todas" || producto.categoria === categoriaActual);
        if (!productosFiltrados.length) {
            tablaProductos.innerHTML = '<p class="vacio">No hay productos en esta categoría.</p>';
            return;
        }
        tablaProductos.innerHTML = productosFiltrados
            .map(producto => {
            const imagen = rutaImagen(producto.img);
            const precioFinal = producto.regular * (1 - producto.dto / 100);
            const dto = Number(producto.dto);
            return `
        <article class="producto">
          ${dto > 0 ? `<span class="badge">${dto}% DTO</span>` : ""}
          <div class="foto">${imagen ? `<img src="${escapar(imagen)}" alt="${escapar(producto.nombre)}">` : "📦"}</div>
          <h3 class="nombre">${escapar(producto.nombre)}</h3>
          <p class="categoria-admin">${escapar(producto.categoria)}</p>
          ${dto > 0 ? `<div><span class="etiqueta">PRECIO CON ${dto}% DTO</span></div>` : ""}
          <div class="precio">$${precioFinal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p class="regular">Precio regular: $${producto.regular.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <button type="button" class="agregar-carrito" data-id="${producto.id}">Agregar al carrito</button>
        </article>
      `;
        })
            .join("");
        document.querySelectorAll(".agregar-carrito").forEach(boton => {
            boton.addEventListener("click", () => {
                const id = Number(boton.dataset.id);
                const productoElegido = productos.find(producto => producto.id === id);
                if (!productoElegido)
                    return;
                try {
                    const sesion = leerSesion();
                    if (!sesion) {
                        window.location.href = "./html/login.html";
                        return;
                    }
                    const carritoKey = getCarritoKey();
                    const carritoActual = JSON.parse(localStorage.getItem(carritoKey) ?? "{}") || {};
                    const productoEnCarrito = carritoActual[id] || {
                        id: productoElegido.id,
                        nombre: productoElegido.nombre,
                        regular: productoElegido.regular,
                        dto: productoElegido.dto,
                        cantidad: 0,
                        img: productoElegido.img
                    };
                    productoEnCarrito.cantidad = Number(productoEnCarrito.cantidad || 0) + 1;
                    carritoActual[id] = productoEnCarrito;
                    localStorage.setItem(carritoKey, JSON.stringify(carritoActual));
                    const totalCarrito = document.getElementById("totalCarrito");
                    if (totalCarrito) {
                        const totalItems = Object.values(carritoActual).reduce((sum, item) => sum + (Number(item?.cantidad) || 0), 0);
                        totalCarrito.textContent = String(totalItems);
                    }
                }
                catch (error) {
                    console.error("No se pudo agregar el producto al carrito.", error);
                }
            });
        });
    }
    const filtroCategoria = document.querySelector("#categoria");
    if (filtroCategoria) {
        actualizarFiltro();
        filtroCategoria.addEventListener("change", actualizarLista);
    }
    const carritoBtn = document.getElementById("carritoBtn");
    const carritoLista = document.getElementById("carritoLista");
    const actualizarTotalCarrito = () => {
        const totalCarrito = document.getElementById("totalCarrito");
        const sesion = leerSesion();
        const carritoKey = sesion?.email ? `carrito:${encodeURIComponent(sesion.email)}` : "carrito:invitado";
        try {
            const carritoActual = JSON.parse(localStorage.getItem(carritoKey) ?? "{}") || {};
            const totalItems = Object.values(carritoActual).reduce((sum, item) => sum + (Number(item?.cantidad) || 0), 0);
            if (totalCarrito)
                totalCarrito.textContent = String(totalItems);
            if (carritoLista) {
                const items = Object.values(carritoActual);
                if (!items.length) {
                    carritoLista.innerHTML = '<p class="vacio-c">Tu carrito está vacío.</p>';
                }
                else {
                    const total = items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
                    carritoLista.innerHTML = `
          ${items.map(item => `
            <div class="item">
              <div>
                <strong>${escapar(item.nombre || "Producto")}</strong>
                <small>${Number(item.cantidad || 0)} unidad${Number(item.cantidad || 0) > 1 ? "es" : ""}</small>
              </div>
              <div>$${((Number(item.regular || 0) * (1 - (Number(item.dto || 0) / 100))) * (Number(item.cantidad || 0))).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          `).join("")}
          <div class="total"><span>Total</span><span>${total} prod.</span></div>
          <div class="ver-mas"><a href="./html/carrito.html">Ver carrito</a></div>
        `;
                }
            }
        }
        catch (error) {
            console.error("No se pudo actualizar el carrito del menú.", error);
            if (totalCarrito)
                totalCarrito.textContent = "0";
            if (carritoLista)
                carritoLista.innerHTML = '<p class="vacio-c">Tu carrito está vacío.</p>';
        }
    };
    if (carritoBtn && carritoLista) {
        const cerrarCarrito = () => {
            carritoLista.classList.remove("abierto");
            carritoBtn.setAttribute("aria-expanded", "false");
        };
        carritoBtn.addEventListener("click", evento => {
            evento.stopPropagation();
            const abierto = carritoLista.classList.toggle("abierto");
            carritoBtn.setAttribute("aria-expanded", String(abierto));
            if (abierto)
                actualizarTotalCarrito();
        });
        carritoLista.addEventListener("click", evento => evento.stopPropagation());
        document.addEventListener("click", cerrarCarrito);
        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape")
                cerrarCarrito();
        });
    }
    actualizarTotalCarrito();
    cargarProductos();
})();
