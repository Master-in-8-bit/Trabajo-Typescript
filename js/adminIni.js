(() => {
  // Antes de mostrar el panel, comprobamos quién inició sesión.
  let correoSesion = "";
  try {
    correoSesion = sessionStorage.getItem("usuarioSesion") || "";
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }

  if (!correoSesion) {
    // Sin sesión, enviamos a la persona al formulario de inicio de sesión.
    window.location.replace("../html/login.html");
    return;
  }
  if (!correoSesion.toLowerCase().endsWith("@admin.com")) {
    // Una cuenta común no tiene permiso para administrar productos.
    window.location.replace("../index.html");
    return;
  }

  document.body.hidden = false;

  // Nombre de la clave y catálogo inicial usado la primera vez que se abre el panel.
  const PRODUCTOS_KEY = "catalogoProductos";
  const productosIniciales = [
    { id: 1, nombre: "Detergente MAGISTRAL Ultra Limón Botella 500ml", categoria: "Limpieza", regular: 3028.29, dto: 35, img: "./src/detergente.jpg" },
    { id: 2, nombre: "Galletitas OREO Rellenas Con Crema Sabor Original 118g", categoria: "Galletitas", regular: 2640, dto: 35, img: "./src/oreo.webp" },
    { id: 3, nombre: "Hamburguesa De Carne Vacuna Paty 320 Grm", categoria: "Comida", regular: 10455, dto: 35, img: "./src/paty.jpg" },
    { id: 4, nombre: "Galletitas PEPITOS Con Chips De Chocolate 119g.", categoria: "Galletitas", regular: 2480, dto: 0, img: "./src/pepito.jpg" },
    { id: 5, nombre: "Salchichas X6 Swift Paq 225 Grm", categoria: "Comida", regular: 2919, dto: 20, img: "./src/salchicha.jpg" },
    { id: 6, nombre: "Jabon En Barra DOVE Original Individual 90 G", categoria: "Limpieza", regular: 2738.99, dto: 0, img: "./src/jabon.jpg" },
    { id: 7, nombre: "Galletitas Dulces Sabor Chocolate Chocolinas 170g", categoria: "Galletitas", regular: 2193.99, dto: 0, img: "./src/chocolinas.jpg" }
  ];

  // Guardamos referencias a los controles del formulario, filtros y menú.
  const form = document.getElementById("formProducto");
  const idInput = document.getElementById("productoId");
  const nombreInput = document.getElementById("nombre");
  const categoriaInput = document.getElementById("categoriaProducto");
  const precioInput = document.getElementById("precio");
  const descuentoInput = document.getElementById("descuento");
  const imagenInput = document.getElementById("imagen");
  const tituloForm = document.getElementById("formTitulo");
  const botonGuardar = document.getElementById("guardarProducto");
  const botonCancelar = document.getElementById("cancelarEdicion");
  const filtroCategoria = document.getElementById("categoria");
  const grilla = document.getElementById("grillaAdmin");
  const totalProductos = document.getElementById("totalProductos");
  const mensaje = document.getElementById("mensajeAdmin");
  const botonCerrarSesion = document.getElementById("cerrarSesionAdmin");
  const botonMenu = document.getElementById("menuBtn");
  const listaMenu = document.getElementById("menuLista");

  // Abrir/cerrar el menú y mantener actualizado su estado accesible.
  botonMenu.addEventListener("click", evento => {
    evento.stopPropagation();
    const abierto = listaMenu.classList.toggle("abierto");
    botonMenu.setAttribute("aria-expanded", String(abierto));
  });
  listaMenu.addEventListener("click", evento => evento.stopPropagation());
  document.addEventListener("click", () => {
    listaMenu.classList.remove("abierto");
    botonMenu.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      listaMenu.classList.remove("abierto");
      botonMenu.setAttribute("aria-expanded", "false");
    }
  });

  // Muestra un aviso en pantalla; el segundo parámetro indica si es un error.
  function mostrarMensaje(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("error", esError);
  }

  // Verifica que un elemento guardado tenga todos los datos esperados.
  function esProducto(producto) {
    return producto &&
      Number.isInteger(producto.id) &&
      typeof producto.nombre === "string" &&
      typeof producto.categoria === "string" &&
      Number.isFinite(producto.regular) &&
      Number.isFinite(producto.dto) &&
      typeof producto.img === "string";
  }

  // Lee el catálogo guardado. Si no había uno, guarda y devuelve el catálogo inicial.
  function cargarProductos() {
    try {
      const guardados = localStorage.getItem(PRODUCTOS_KEY);
      if (guardados === null) {
        localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosIniciales));
        return [...productosIniciales];
      }
      const productosGuardados = JSON.parse(guardados);
      if (!Array.isArray(productosGuardados) || !productosGuardados.every(esProducto)) {
        throw new Error("Los datos guardados no tienen el formato esperado.");
      }
      return productosGuardados;
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      mostrarMensaje(`No se pudieron cargar los productos: ${detalle}`, true);
      return [...productosIniciales];
    }
  }

  // Esta lista en memoria es la versión que se muestra y modifica en la página.
  let productos = cargarProductos();

  // Persiste una lista nueva y solo actualiza la memoria si el guardado tuvo éxito.
  function guardarProductos(nuevosProductos) {
    try {
      localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(nuevosProductos));
      productos = nuevosProductos;
      return true;
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      mostrarMensaje(`No se pudieron guardar los cambios: ${detalle}`, true);
      return false;
    }
  }

  // Evita que nombres o categorías se interpreten como etiquetas HTML.
  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]);
  }

  // Acepta rutas de imagen válidas y devuelve su dirección completa.
  function rutaImagen(imagen) {
    if (!imagen) return "";
    try {
      const url = new URL(imagen, new URL("../index.html", window.location.href));
      return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  // Crea las opciones del filtro a partir de las categorías actuales.
  function actualizarFiltro() {
    const seleccion = filtroCategoria.value;
    const categorias = ["Todas", ...new Set(productos.map(producto => producto.categoria))];
    filtroCategoria.innerHTML = categorias
      .map(categoria => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`)
      .join("");
    filtroCategoria.value = categorias.includes(seleccion) ? seleccion : "Todas";
  }

  // Vuelve a crear las tarjetas del catálogo usando la lista actual de productos.
  function dibujar() {
    actualizarFiltro();
    const categoria = filtroCategoria.value;
    const lista = productos.filter(producto => categoria === "Todas" || producto.categoria === categoria);
    totalProductos.textContent = `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`;

    // Si el filtro no encuentra productos, mostramos un aviso en lugar de tarjetas.
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
  }

  // Deja el formulario listo para agregar un producto nuevo.
  function limpiarFormulario() {
    form.reset();
    idInput.value = "";
    descuentoInput.value = "0";
    tituloForm.textContent = "Agregar producto";
    botonGuardar.textContent = "Agregar producto";
    botonCancelar.hidden = true;
  }

  // El mismo formulario sirve para agregar productos y guardar ediciones.
  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const nombre = nombreInput.value.trim();
    const categoria = categoriaInput.value.trim();
    const regular = Number(precioInput.value);
    const dto = Number(descuentoInput.value);
    const img = imagenInput.value.trim();

    // Validamos los datos antes de crear o guardar el producto.
    if (!nombre || !categoria || !Number.isFinite(regular) || regular <= 0 ||
        !Number.isInteger(dto) || dto < 0 || dto > 100) {
      mostrarMensaje("Revisá los datos: el precio debe ser mayor a cero y el descuento debe estar entre 0 y 100.", true);
      return;
    }
    if (img && !rutaImagen(img)) {
      mostrarMensaje("La imagen debe ser una URL http(s) o una ruta local válida.", true);
      return;
    }

    // Un id oculto indica que estamos editando; si está vacío, agregamos un producto.
    const eraEdicion = Boolean(idInput.value);
    const editandoId = Number(idInput.value);
    const producto = {
      id: eraEdicion ? editandoId : Math.max(0, ...productos.map(item => item.id)) + 1,
      nombre,
      categoria,
      regular,
      dto,
      img
    };
    // En edición reemplazamos el producto por id; al agregar, creamos una lista nueva.
    const nuevosProductos = eraEdicion
      ? productos.map(item => item.id === editandoId ? producto : item)
      : [...productos, producto];

    if (guardarProductos(nuevosProductos)) {
      limpiarFormulario();
      mostrarMensaje(eraEdicion ? "Producto actualizado." : "Producto agregado.");
      dibujar();
    }
  });

  // Un listener en toda la grilla atiende los botones Editar y Borrar de cada tarjeta.
  grilla.addEventListener("click", evento => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    const id = Number(boton.dataset.id);
    const producto = productos.find(item => item.id === id);
    if (!producto) return;

    // Copiamos los datos de la tarjeta al formulario para poder modificarlos.
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

    // Antes de borrar pedimos confirmación; después guardamos la lista sin ese producto.
    if (boton.dataset.accion === "eliminar" && window.confirm(`¿Querés borrar "${producto.nombre}"?`)) {
      if (guardarProductos(productos.filter(item => item.id !== id))) {
        mostrarMensaje("Producto eliminado.");
        dibujar();
      }
    }
  });

  botonCancelar.addEventListener("click", () => {
    // Cancelar no guarda cambios: solo vuelve el formulario a su estado inicial.
    limpiarFormulario();
    mostrarMensaje("Edición cancelada.");
  });

  botonCerrarSesion.addEventListener("click", () => {
    // Borra la cuenta activa y vuelve a la pantalla de inicio de sesión.
    try {
      sessionStorage.removeItem("usuarioSesion");
    } catch (error) {
      console.error("No se pudo cerrar la sesión.", error);
    }
    window.location.replace("../html/login.html");
  });

  // Cuando cambia el filtro, se vuelven a dibujar las tarjetas.
  filtroCategoria.addEventListener("change", dibujar);
  // Dibujo inicial del catálogo al terminar de configurar la página.
  dibujar();
})();