"use strict";
(() => {
    // Este archivo controla el menú y el botón de sesión de la página Acerca.
    // getElementById busca en el HTML los elementos que tienen estos id.
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
            console.warn("No se pudo leer la sesión de usuario.", error);
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
            console.warn("No se pudo guardar la sesión de usuario.", error);
        }
        return sesion;
    };
    const botonSesion = document.querySelector("#cerrarSesion");
    // Si falta algún elemento, avisamos con un error claro y no seguimos.
    if (botonSesion === null) {
        throw new Error("Revisar el id del botón de sesión.");
    }
    const sesionActual = leerSesion();
    const sesionActiva = Boolean(sesionActual && sesionActual.email);
    botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
    botonSesion.addEventListener("click", () => {
        if (sesionActiva)
            localStorage.removeItem("usuarioSesion");
        const loginUrl = window.location.pathname.includes("/html/") ? "login.html" : "./html/login.html";
        window.location.href = new URL(loginUrl, window.location.href).toString();
    });
})();
