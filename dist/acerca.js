"use strict";
(() => {
    // Este archivo controla el menú y el botón de sesión de la página Acerca.
    // getElementById busca en el HTML los elementos que tienen estos id.
    const menuBtn = document.querySelector("#menuBtn");
    const menuLista = document.querySelector("#menuLista");
    const botonSesion = document.querySelector("#cerrarSesion");
    // Si falta algún elemento, avisamos con un error claro y no seguimos.
    if (menuBtn === null || menuLista === null || botonSesion === null) {
        throw new Error("Revisar los id del menú y del botón de sesión.");
    }
    // Cierra el menú y actualiza aria-expanded para lectores de pantalla.
    const cerrarMenu = () => {
        menuLista.classList.remove("abierto");
        menuBtn.setAttribute("aria-expanded", "false");
    };
    // Al tocar el botón, agrega o quita la clase que hace visible el menú.
    menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        const abierto = menuLista.classList.toggle("abierto");
        menuBtn.setAttribute("aria-expanded", String(abierto));
    });
    // También se cierra al hacer clic fuera del menú o al presionar Escape.
    document.addEventListener("click", cerrarMenu); // clic afuera
    document.addEventListener("keydown", e => { if (e.key === "Escape")
        cerrarMenu(); });
    // Cambia el texto del botón según exista o no una sesión guardada.
    let sesionActiva = false;
    try {
        sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
    }
    catch (error) {
        console.error("No se pudo verificar la sesión.", error);
    }
    botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
    // Si había una sesión, la elimina; luego abre la página de inicio de sesión.
    botonSesion.addEventListener("click", () => {
        if (sesionActiva) {
            try {
                sessionStorage.removeItem("usuarioSesion");
            }
            catch (error) {
                console.error("No se pudo cerrar la sesión.", error);
            }
        }
        window.location.href = "../html/login.html";
    });
})();
