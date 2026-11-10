

interface UsuarioRegistro {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

type CampoRegistro = "nombre" | "apellido" | "email" | "password";

const form = document.getElementById("registroForm") as HTMLFormElement | null;
const mensaje = document.getElementById("mensaje");
const btn = document.getElementById("btn") as HTMLButtonElement | null;
const toggle = document.getElementById("toggle");

const campos = {
  nombre: document.getElementById("nombre") as HTMLInputElement | null,
  apellido: document.getElementById("apellido") as HTMLInputElement | null,
  email: document.getElementById("email") as HTMLInputElement | null,
  password: document.getElementById("password") as HTMLInputElement | null
};

const errores = {
  nombre: document.getElementById("nombreError"),
  apellido: document.getElementById("apellidoError"),
  email: document.getElementById("emailError"),
  password: document.getElementById("passError")
};

const USUARIOS_KEY = "usuarios";

if (
  form && mensaje && btn && toggle &&
  campos.nombre && campos.apellido &&
  campos.email && campos.password &&
  errores.nombre && errores.apellido &&
  errores.email && errores.password
) {
  const cargarUsuarios = (): UsuarioRegistro[] => {
    const guardados = localStorage.getItem(USUARIOS_KEY);

    if (guardados !== null) {
      const usuarios = JSON.parse(guardados) as UsuarioRegistro[];

      if (!Array.isArray(usuarios)) {
        throw new Error("La lista de usuarios no es válida.");
      }

      return usuarios;
    }

    const anterior = localStorage.getItem("usuario");

    return anterior ? [JSON.parse(anterior) as UsuarioRegistro] : [];
  };

  const setError = (campo: CampoRegistro, texto: string): void => {
    errores[campo]!.textContent = texto;
    campos[campo]!.classList.add("invalid");
  };

  const validar = (): boolean => {
    let ok = true;

    for (const c of Object.keys(campos) as CampoRegistro[]) {
      errores[c]!.textContent = "";
      campos[c]!.classList.remove("invalid");
    }

    if (campos.nombre!.value.trim().length < 2) {
      setError("nombre", "Ingresá tu nombre.");
      ok = false;
    }

    if (campos.apellido!.value.trim().length < 2) {
      setError("apellido", "Ingresá tu apellido.");
      ok = false;
    }

    const mail = campos.email!.value.trim();

    if (!mail) {
      setError("email", "Ingresá tu correo electrónico.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      setError("email", "El correo no es válido.");
      ok = false;
    }

    if (!campos.password!.value) {
      setError("password", "Creá una contraseña.");
      ok = false;
    } else if (campos.password!.value.length < 6) {
      setError("password", "La contraseña debe tener al menos 6 caracteres.");
      ok = false;
    }

    return ok;
  };

  toggle.addEventListener("click", () => {
    const oculto = campos.password!.type === "password";
    campos.password!.type = oculto ? "text" : "password";
    toggle.textContent = oculto ? "Ocultar" : "Mostrar";
  });

  form.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();

    mensaje.className = "";
    mensaje.textContent = "";

    if (!validar()) return;

    btn.disabled = true;
    btn.textContent = "Creando cuenta...";

    const datos: UsuarioRegistro = {
      nombre: campos.nombre!.value.trim(),
      apellido: campos.apellido!.value.trim(),
      email: campos.email!.value.trim().toLowerCase(),
      password: campos.password!.value
    };

    try {
      const usuarios = cargarUsuarios();

      if (usuarios.some(usuario => usuario.email.toLowerCase() === datos.email)) {
        setError("email", "Ya existe una cuenta con ese correo.");
        btn.disabled = false;
        btn.textContent = "Crear cuenta";
        return;
      }

      usuarios.push(datos);
      localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    } catch (error) {
      console.error("No se pudo guardar la cuenta.", error);
      mensaje.className = "fail";
      mensaje.textContent = "No se pudo guardar la cuenta en este navegador.";
      btn.disabled = false;
      btn.textContent = "Crear cuenta";
      return;
    }

    mensaje.className = "ok";
    mensaje.textContent = "¡Cuenta creada! Redirigiendo al inicio de sesión...";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  });

  for (const c of Object.keys(campos) as CampoRegistro[]) {
    campos[c]!.addEventListener("input", () => {
      errores[c]!.textContent = "";
      campos[c]!.classList.remove("invalid");
    });
  }
}
