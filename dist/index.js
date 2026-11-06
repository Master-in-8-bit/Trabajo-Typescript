// Para usar tus fotos, agregá  img: "imagenes/traviata.jpg"  a cada producto.
  const productos = [
    { id: 1, nombre: "Galletitas Crackers Familiar Traviata 540g", categoria: "Crackers", regular: 3549.99, dto: 35, emoji: "🥨" },
    { id: 2, nombre: "Galletitas Dulces Surtido Bagley 400g", categoria: "Dulces", regular: 3868.99, dto: 35, emoji: "🍪" },
    { id: 3, nombre: "Galletitas Pepitos con Chips de Chocolate 357g", categoria: "Dulces", regular: 6700.00, dto: 35, emoji: "🍫" },
    { id: 4, nombre: "Galletitas Chocolinas 250g", categoria: "Dulces", regular: 2900.00, dto: 0, emoji: "🍫" },
    { id: 5, nombre: "Galletitas Rellenas Oreo 354g", categoria: "Rellenas", regular: 4200.00, dto: 20, emoji: "🍪" },
    { id: 6, nombre: "Galletitas Cereales Cuatro Sabores 300g", categoria: "Cereales", regular: 3100.00, dto: 0, emoji: "🌾" }
  ];

  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grilla = document.getElementById("grilla");
  const select = document.getElementById("categoria");
  const totalCarrito = document.getElementById("totalCarrito");
  const cantidades = {};   // id -> cantidad elegida en la tarjeta
  let enCarrito = 0;

  // Llenar el desplegable con las categorías que existen
  const categorias = ["Todas", ...new Set(productos.map(p => p.categoria))];
  select.innerHTML = categorias.map(c => `<option value="${c}">${c}</option>`).join("");

  function dibujar() {
    const cat = select.value;
    const lista = productos.filter(p => cat === "Todas" || p.categoria === cat);
    if (!lista.length) {
      grilla.innerHTML = '<p class="vacio">No hay productos en esta categoría.</p>';
      return;
    }
    grilla.innerHTML = lista.map(p => {
      const final = p.regular * (1 - p.dto / 100);
      const cant = cantidades[p.id] || 1;
      return `
        <article class="producto">
          ${p.dto ? `<span class="badge">${p.dto}%DTO</span>` : ""}
          <div class="foto">${p.img ? `<img src="${p.img}" alt="${p.nombre}">` : p.emoji}</div>
          <h2 class="nombre" style="font-size:1.05rem">${p.nombre}</h2>
          ${p.dto ? `<div><span class="etiqueta">PRECIO CON ${p.dto}%DTO</span></div>` : ""}
          <div class="precio">${fmt(final)}</div>
          ${p.dto ? `<p class="regular">Precio regular: ${fmt(p.regular)}</p>` : `<p class="regular">&nbsp;</p>`}
          <div class="cantidad">
            <button type="button" data-accion="menos" data-id="${p.id}" aria-label="Quitar uno">−</button>
            <span class="num" id="num-${p.id}">${cant}</span>
            <button type="button" data-accion="mas" data-id="${p.id}" aria-label="Agregar uno">+</button>
          </div>
          <button type="button" class="agregar" data-accion="agregar" data-id="${p.id}">Agregar</button>
        </article>`;
    }).join("");
  }

  // Un solo listener para todos los botones de las tarjetas
  grilla.addEventListener("click", e => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const id = Number(b.dataset.id);
    const actual = cantidades[id] || 1;

    if (b.dataset.accion === "mas") cantidades[id] = Math.min(actual + 1, 99);
    if (b.dataset.accion === "menos") cantidades[id] = Math.max(actual - 1, 1);
    if (b.dataset.accion === "agregar") {
      enCarrito += actual;
      cantidades[id] = 1;
      totalCarrito.textContent = enCarrito;
    }
    document.getElementById("num-" + id).textContent = cantidades[id] || 1;
  });

  select.addEventListener("change", dibujar);
  dibujar();
