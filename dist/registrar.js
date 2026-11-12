"use strict";
const form = document.getElementById("registroForm");
const mensaje = document.getElementById("mensaje");
const btn = document.getElementById("btn");
const toggle = document.getElementById("toggle");
const campos = {
    nombre: document.getElementById("nombre"),
    apellido: document.getElementById("apellido"),
    email: document.getElementById("email"),
    password: document.getElementById("password")
};
const errores = {
    nombre: document.getElementById("nombreError"),
    apellido: document.getElementById("apellidoError"),
    email: document.getElementById("emailError"),
    password: document.getElementById("passError")
};
if (form && mensaje && btn && toggle &&
    campos.nombre && campos.apellido &&
    campos.email && campos.password &&
    errores.nombre && errores.apellido &&
    errores.email && errores.password) {
    const setError = (campo, texto) => {
        errores[campo].textContent = texto;
        campos[campo].classList.add("invalid");
    };
    const validar = () => {
        let ok = true;
        for (const c of Object.keys(campos)) {
            errores[c].textContent = "";
            campos[c].classList.remove("invalid");
        }
        if (campos.nombre.value.trim().length < 2) {
            setError("nombre", "Ingresá tu nombre.");
            ok = false;
        }
        if (campos.apellido.value.trim().length < 2) {
            setError("apellido", "Ingresá tu apellido.");
            ok = false;
        }
        const mail = campos.email.value.trim();
        if (!mail) {
            setError("email", "Ingresá tu correo electrónico.");
            ok = false;
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
            setError("email", "El correo no es válido.");
            ok = false;
        }
        else if (mail.toLowerCase().endsWith("@admin.com")) {
            setError("email", "No se pueden crear administradores desde la página de registro.");
            ok = false;
        }
        if (!campos.password.value) {
            setError("password", "Creá una contraseña.");
            ok = false;
        }
        else if (campos.password.value.length < 6) {
            setError("password", "La contraseña debe tener al menos 6 caracteres.");
            ok = false;
        }
        return ok;
    };
    toggle.addEventListener("click", () => {
        const oculto = campos.password.type === "password";
        campos.password.type = oculto ? "text" : "password";
        toggle.textContent = oculto ? "Ocultar" : "Mostrar";
    });
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        mensaje.className = "";
        mensaje.textContent = "";
        if (!validar())
            return;
        btn.disabled = true;
        btn.textContent = "Creando cuenta...";
        const datos = {
            nombre: campos.nombre.value.trim(),
            apellido: campos.apellido.value.trim(),
            email: campos.email.value.trim().toLowerCase(),
            password: campos.password.value
        };
        try {
            const respuesta = await fetch('/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const data = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(data.mensaje || 'No se pudo guardar la cuenta.');
            }
            mensaje.className = 'ok';
            mensaje.textContent = '¡Cuenta creada! Redirigiendo al inicio de sesión...';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
        catch (error) {
            console.error('No se pudo guardar la cuenta.', error);
            const mensajeError = error instanceof Error ? error.message : 'No se pudo guardar la cuenta.';
            if (mensajeError.toLowerCase().includes('correo')) {
                setError('email', mensajeError);
            }
            else {
                mensaje.className = 'fail';
                mensaje.textContent = mensajeError;
            }
            btn.disabled = false;
            btn.textContent = 'Crear cuenta';
        }
    });
    for (const c of Object.keys(campos)) {
        campos[c].addEventListener("input", () => {
            errores[c].textContent = "";
            campos[c].classList.remove("invalid");
        });
    }
}
