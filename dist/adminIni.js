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
            console.warn("No se pudo leer la sesión de administrador.", error);
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
            console.warn("No se pudo guardar la sesión de administrador.", error);
        }
        return sesion;
    };
    const sesionGuardada = leerSesion();
    const roleSesion = sesionGuardada?.role || "";
    const emailSesion = sesionGuardada?.email || "";
    if (!emailSesion || roleSesion !== "administrador") {
        window.location.replace("../index.html");
        return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("email", emailSesion);
    url.searchParams.set("role", roleSesion);
    window.history.replaceState({}, "", url.toString());
    document.body.hidden = false;
    const form = document.querySelector("#formProducto");
    const idInput = document.querySelector("#productoId");
    const nombreInput = document.querySelector("#nombre");
    const categoriaInput = document.querySelector("#categoriaProducto");
    const precioInput = document.querySelector("#precio");
    const descuentoInput = document.querySelector("#descuento");
    const imagenInput = document.querySelector("#imagen");
    const tituloForm = document.querySelector("#formTitulo");
    const botonGuardar = document.querySelector("#guardarProducto");
    const botonCancelar = document.querySelector("#cancelarEdicion");
    const filtroCategoria = document.querySelector("#categoria");
    const grilla = document.querySelector("#grillaAdmin");
    const totalProductos = document.querySelector("#totalProductos");
    const mensaje = document.querySelector("#mensajeAdmin");
    const botonCerrarSesion = document.querySelector("#cerrarSesionAdmin");
    if (form === null || idInput === null || nombreInput === null || categoriaInput === null ||
        precioInput === null || descuentoInput === null || imagenInput === null ||
        tituloForm === null || botonGuardar === null || botonCancelar === null ||
        filtroCategoria === null || grilla === null || totalProductos === null ||
        mensaje === null || botonCerrarSesion === null) {
        throw new Error("Revisar los id del formulario, los filtros y el menú.");
    }
    const mostrarMensaje = (texto, esError = false) => {
        mensaje.textContent = texto;
        mensaje.classList.toggle("error", esError);
    };
    const entidades = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    function escapar(texto) {
        return String(texto).replace(/[&<>"']/g, caracter => entidades[caracter]);
    }
    function rutaImagen(imagen) {
        if (!imagen)
            return "";
        try {
            const url = new URL(imagen, new URL("../index.html", window.location.href));
            return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
        }
        catch {
            return "";
        }
    }
    let productos = [];
    async function cargarProductos() {
        try {
            const respuesta = await fetch("/api/productos");
            if (!respuesta.ok)
                throw new Error("No se pudo cargar el catálogo");
            const datos = await respuesta.json();
            productos = Array.isArray(datos) ? datos : [];
            actualizarFiltro();
            dibujar();
        }
        catch (error) {
            console.error("No se pudieron cargar los productos desde SQLite.", error);
            mostrarMensaje("No se pudo cargar el catálogo desde la base de datos.", true);
            productos = [];
            if (grilla) {
                grilla.innerHTML = '<p class="vacio">No se pudo cargar el catálogo.</p>';
            }
        }
    }
    const actualizarFiltro = () => {
        const seleccion = filtroCategoria.value;
        const categorias = ["Todas", ...new Set(productos.map(producto => producto.categoria))];
        filtroCategoria.innerHTML = categorias
            .map(categoria => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`)
            .join("");
        filtroCategoria.value = categorias.includes(seleccion) ? seleccion : "Todas";
    };
    const dibujar = () => {
        actualizarFiltro();
        const categoria = filtroCategoria.value;
        const lista = productos.filter(producto => categoria === "Todas" || producto.categoria === categoria);
        totalProductos.textContent = `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`;
        if (!lista.length) {
            grilla.innerHTML = '<p class="vacio">No hay productos en esta categoría.</p>';
            return;
        }
        grilla.innerHTML = lista.map(producto => {
            const imagen = rutaImagen(producto.img);
            const dto = Number(producto.dto);
            return `
        <article class="producto">
          ${dto > 0 ? `<span class="badge">${dto}% DTO</span>` : ""}
          <div class="foto">${imagen ? `<img src="${escapar(imagen)}" alt="${escapar(producto.nombre)}">` : "📦"}</div>
          <h3 class="nombre">${escapar(producto.nombre)}</h3>
          <p class="categoria-admin">${escapar(producto.categoria)}</p>
          ${dto > 0 ? `<div><span class="etiqueta">PRECIO CON ${dto}% DTO</span></div>` : ""}
          <div class="precio">$${(producto.regular * (1 - dto / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p class="regular">Precio regular: $${producto.regular.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div class="acciones-producto">
            <button type="button" class="editar" data-accion="editar" data-id="${producto.id}">Editar</button>
            <button type="button" class="eliminar" data-accion="eliminar" data-id="${producto.id}">Borrar</button>
          </div>
        </article>`;
        }).join("");
    };
    const limpiarFormulario = () => {
        form.reset();
        idInput.value = "";
        descuentoInput.value = "0";
        tituloForm.textContent = "Agregar producto";
        botonGuardar.textContent = "Agregar producto";
        botonCancelar.hidden = true;
    };
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const nombre = nombreInput.value.trim();
        const categoria = categoriaInput.value.trim();
        const regular = Number(precioInput.value);
        const dto = Number(descuentoInput.value);
        const img = imagenInput.value.trim();
        if (!nombre || !categoria || !Number.isFinite(regular) || regular <= 0 ||
            !Number.isInteger(dto) || dto < 0 || dto > 100) {
            mostrarMensaje("Revisá los datos: el precio debe ser mayor a cero y el descuento debe estar entre 0 y 100.", true);
            return;
        }
        if (img && !rutaImagen(img)) {
            mostrarMensaje("La imagen debe ser una URL http(s) o una ruta local válida.", true);
            return;
        }
        const eraEdicion = Boolean(idInput.value);
        const producto = {
            id: eraEdicion ? Number(idInput.value) : undefined,
            nombre,
            categoria,
            regular,
            dto,
            img
        };
        try {
            botonGuardar.disabled = true;
            botonGuardar.textContent = eraEdicion ? "Guardando..." : "Agregando...";
            const respuesta = await fetch("/api/productos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(producto)
            });
            const data = await respuesta.json();
            if (!respuesta.ok)
                throw new Error(data.mensaje || "No se pudo guardar el producto.");
            limpiarFormulario();
            mostrarMensaje(eraEdicion ? "Producto actualizado." : "Producto agregado.");
            await cargarProductos();
        }
        catch (error) {
            console.error("No se pudo guardar el producto.", error);
            mostrarMensaje(error instanceof Error ? error.message : "No se pudo guardar el producto.", true);
        }
        finally {
            botonGuardar.disabled = false;
            botonGuardar.textContent = "Agregar producto";
        }
    });
    grilla.addEventListener("click", async (evento) => {
        const objetivo = evento.target;
        if (!(objetivo instanceof HTMLElement))
            return;
        const boton = objetivo.closest("button[data-accion]");
        if (!boton)
            return;
        const id = Number(boton.dataset.id);
        const producto = productos.find(item => item.id === id);
        if (!producto)
            return;
        if (boton.dataset.accion === "editar") {
            idInput.value = String(producto.id);
            nombreInput.value = producto.nombre;
            categoriaInput.value = producto.categoria;
            precioInput.value = String(producto.regular);
            descuentoInput.value = String(producto.dto);
            imagenInput.value = producto.img;
            tituloForm.textContent = "Editar producto";
            botonGuardar.textContent = "Guardar cambios";
            botonCancelar.hidden = false;
            form.scrollIntoView({ behavior: "smooth", block: "start" });
            nombreInput.focus();
            mostrarMensaje(`Editando: ${producto.nombre}`);
            return;
        }
        if (boton.dataset.accion === "eliminar" && window.confirm(`¿Querés borrar "${producto.nombre}"?`)) {
            try {
                const respuesta = await fetch(`/api/productos/${id}`, { method: "DELETE" });
                const data = await respuesta.json();
                if (!respuesta.ok)
                    throw new Error(data.mensaje || "No se pudo borrar el producto.");
                mostrarMensaje("Producto eliminado.");
                await cargarProductos();
            }
            catch (error) {
                console.error("No se pudo borrar el producto.", error);
                mostrarMensaje(error instanceof Error ? error.message : "No se pudo borrar el producto.", true);
            }
        }
    });
    botonCancelar.addEventListener("click", () => {
        limpiarFormulario();
        mostrarMensaje("Edición cancelada.");
    });
    botonCerrarSesion.addEventListener("click", () => {
        window.location.replace("../html/login.html");
    });
    filtroCategoria.addEventListener("change", dibujar);
    cargarProductos();
})();
