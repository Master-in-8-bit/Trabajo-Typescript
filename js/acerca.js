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
    window.location.href = "login.html";
  });

  select.addEventListener("change", dibujar);
  dibujar();