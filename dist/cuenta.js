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
    const botonSesion = document.getElementById("cerrarSesion");
    const sesionActual = leerSesion();
    const sessionEmail = sesionActual?.email || "";
    const sesionActiva = Boolean(sessionEmail);
    if (botonSesion) {
        botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";
        botonSesion.addEventListener("click", () => {
            if (sessionEmail)
                localStorage.removeItem("usuarioSesion");
            window.location.href = "../html/login.html";
        });
    }
    let usuario = null;
    const sinDatos = document.getElementById("sinDatos");
    const conDatos = document.getElementById("conDatos");
    const saludo = document.getElementById("saludo");
    const nombreCompleto = document.getElementById("nombreCompleto");
    const correo = document.getElementById("correo");
    const clave = document.getElementById("clave");
    const btnVer = document.getElementById("btnVer");
    function renderCuenta() {
        if (!usuario ||
            !usuario.nombre ||
            !sinDatos ||
            !conDatos ||
            !saludo ||
            !nombreCompleto ||
            !correo) {
            return;
        }
        sinDatos.hidden = true;
        conDatos.hidden = false;
        saludo.textContent = "Hola, " + usuario.nombre + "!";
        nombreCompleto.textContent = usuario.nombre + " " + (usuario.apellido || "");
        correo.textContent = usuario.email;
        let visible = false;
        if (clave && btnVer && usuario.password) {
            const password = usuario.password;
            const pintarClave = () => {
                clave.textContent = visible ? password : "•".repeat(password.length);
                btnVer.textContent = visible ? "Ocultar" : "Mostrar";
            };
            btnVer.addEventListener("click", () => {
                visible = !visible;
                pintarClave();
            });
            pintarClave();
        }
    }
    async function cargarUsuarioDesdeBase() {
        const correoSesion = (sesionActual?.email || "").trim();
        if (!correoSesion)
            return;
        try {
            const respuesta = await fetch(`/api/usuario/${encodeURIComponent(correoSesion)}`);
            const data = await respuesta.json();
            if (!respuesta.ok || !data.ok || !data.usuario) {
                throw new Error(data.mensaje || "No se pudo cargar el perfil actual.");
            }
            usuario = data.usuario;
            renderCuenta();
        }
        catch (error) {
            console.error("No se pudieron cargar los datos del usuario desde SQLite.", error);
            usuario = null;
        }
    }
    void cargarUsuarioDesdeBase();
})();
