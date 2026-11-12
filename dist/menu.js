"use strict";
(() => {
    const leerSesion = () => {
        try {
            const raw = localStorage.getItem("usuarioSesion");
            if (!raw)
                return null;
            const data = JSON.parse(raw);
            if (data && typeof data.email === "string" && data.email.trim()) {
                return {
                    email: data.email.trim().toLowerCase(),
                    role: typeof data.role === "string" ? data.role : "cliente"
                };
            }
        }
        catch (error) {
            console.error("No se pudo leer la sesión almacenada.", error);
        }
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email");
        const role = params.get("role");
        if (!email)
            return null;
        return { email: email.trim().toLowerCase(), role: role || "cliente" };
    };
    const sincronizarSesionEnUrl = () => {
        const sesion = leerSesion();
        const url = new URL(window.location.href);
        if (sesion) {
            url.searchParams.set("email", sesion.email);
            url.searchParams.set("role", sesion.role);
        }
        else {
            url.searchParams.delete("email");
            url.searchParams.delete("role");
        }
        if (window.location.href !== url.href) {
            window.history.replaceState({}, "", url.toString());
        }
    };
    const inicializarMenu = () => {
        sincronizarSesionEnUrl();
        const enlaceAdmin = document.getElementById("enlaceAdmin");
        const menuBtn = document.getElementById("menuBtn");
        const menuLista = document.getElementById("menuLista");
        const botonCerrarSesion = document.getElementById("cerrarSesion");
        if (menuBtn && menuLista && !menuBtn.dataset.menuBound) {
            menuBtn.dataset.menuBound = "true";
            const cerrarMenu = () => {
                menuLista.classList.remove("abierto");
                menuBtn.setAttribute("aria-expanded", "false");
            };
            menuBtn.addEventListener("click", evento => {
                evento.stopPropagation();
                const abierto = menuLista.classList.toggle("abierto");
                menuBtn.setAttribute("aria-expanded", String(abierto));
            });
            menuLista.addEventListener("click", evento => evento.stopPropagation());
            document.addEventListener("click", cerrarMenu);
            document.addEventListener("keydown", evento => {
                if (evento.key === "Escape")
                    cerrarMenu();
            });
        }
        const loginUrl = window.location.pathname.includes("/html/") ? "login.html" : "./html/login.html";
        if (botonCerrarSesion) {
            const sesion = leerSesion();
            const sesionActiva = Boolean(sesion && sesion.email);
            botonCerrarSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
            botonCerrarSesion.addEventListener("click", () => {
                if (sesionActiva) {
                    localStorage.removeItem("usuarioSesion");
                }
                window.location.href = new URL(loginUrl, window.location.href).toString();
            });
        }
        if (!enlaceAdmin)
            return;
        const sesion = leerSesion();
        const rolSesion = sesion?.role || "cliente";
        enlaceAdmin.hidden = rolSesion !== "administrador";
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarMenu);
    }
    else {
        inicializarMenu();
    }
})();
