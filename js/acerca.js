  // Este archivo controla el menú y el botón de sesión de la página Acerca.
  // getElementById busca en el HTML los elementos que tienen estos id.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");

  // Cierra el menú y actualiza aria-expanded para lectores de pantalla.
  function cerrarMenu() {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  // Al tocar el botón, agrega o quita la clase que hace visible el menú.
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });

  // También se cierra al hacer clic fuera del menú o al presionar Escape.
  document.addEventListener("click", cerrarMenu);               // clic afuera
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });

  // Cambia el texto del botón según exista o no una sesión guardada.
  const botonSesion = document.getElementById("cerrarSesion");
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";

  // Si había una sesión, la elimina; luego abre la página de inicio de sesión.
  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "../html/login.html";
  });
