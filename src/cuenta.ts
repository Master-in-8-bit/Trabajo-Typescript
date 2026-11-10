
interface Usuario {
  email: string;
  nombre?: string;
  apellido?: string;
  password: string;
}

const menuBtn = document.getElementById("menuBtn");
const menuLista = document.getElementById("menuLista");

function cerrarMenu(): void {
  if (!menuLista || !menuBtn) return;

  menuLista.classList.remove("abierto");
  menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn && menuLista) {
  menuBtn.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();

    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", String(abierto));
  });

  document.addEventListener("click", cerrarMenu);

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") cerrarMenu();
  });
}

const botonSesion = document.getElementById("cerrarSesion");
let sesionActiva = false;

try {
  sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
} catch (error) {
  console.error("No se pudo verificar la sesión.", error);
}

if (botonSesion) {
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";

  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try {
        sessionStorage.removeItem("usuarioSesion");
      } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }

    window.location.href = "../html/login.html";
  });
}

let usuario: Usuario | null = null;

try {
  const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
  const usuarios = JSON.parse(
    localStorage.getItem("usuarios") || "[]"
  ) as Usuario[];

  usuario = usuarios.find(
    (item: Usuario) => item.email.toLowerCase() === correoSesion
  ) || null;

  if (!usuario && correoSesion) {
    const usuarioAnterior = JSON.parse(
      localStorage.getItem("usuario") || "null"
    ) as Usuario | null;

    if (usuarioAnterior && usuarioAnterior.email.toLowerCase() === correoSesion) {
      usuario = usuarioAnterior;
    }
  }
} catch (error) {
  console.error("No se pudieron cargar los datos de la cuenta activa.", error);
}

const sinDatos = document.getElementById("sinDatos");
const conDatos = document.getElementById("conDatos");
const saludo = document.getElementById("saludo");
const nombreCompleto = document.getElementById("nombreCompleto");
const correo = document.getElementById("correo");
const clave = document.getElementById("clave");
const btnVer = document.getElementById("btnVer");

if (
  usuario &&
  usuario.nombre &&
  sinDatos &&
  conDatos &&
  saludo &&
  nombreCompleto &&
  correo
) {
  sinDatos.hidden = true;
  conDatos.hidden = false;

  saludo.textContent = "Hola, " + usuario.nombre + "!";
  nombreCompleto.textContent =
    usuario.nombre + " " + (usuario.apellido || "");
  correo.textContent = usuario.email;

  let visible = false;

  if (clave && btnVer) {
    const password = usuario.password;

    const pintarClave = (): void => {
      clave.textContent = visible
        ? password
        : "•".repeat(password.length);

      btnVer.textContent = visible ? "Ocultar" : "Mostrar";
    };

    btnVer.addEventListener("click", () => {
      visible = !visible;
      pintarClave();
    });

    pintarClave();
  }
}
