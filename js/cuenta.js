  // Controla el menú desplegable y el botón para iniciar o cerrar sesión.
  const menuBtn = document.getElementById("menuBtn");
  const menuLista = document.getElementById("menuLista");

  // Deja el menú cerrado y marca ese estado para tecnologías de asistencia.
  function cerrarMenu() {
    menuLista.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  // Abre o cierra el menú cuando se toca el botón.
  menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    const abierto = menuLista.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });
  // Permite cerrar el menú con un clic afuera o con la tecla Escape.
  document.addEventListener("click", cerrarMenu);               // clic afuera
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });

  // El texto del botón cambia según haya un correo guardado en la sesión.
  const botonSesion = document.getElementById("cerrarSesion");
  let sesionActiva = false;
  try {
    sesionActiva = Boolean(sessionStorage.getItem("usuarioSesion"));
  } catch (error) {
    console.error("No se pudo verificar la sesión.", error);
  }
  botonSesion.textContent = sesionActiva ? "Cerrar sesión" : "Iniciar sesión";

  // Al salir, se borra el correo activo y se abre la pantalla de login.
  botonSesion.addEventListener("click", () => {
    if (sesionActiva) {
      try { sessionStorage.removeItem("usuarioSesion"); } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
      }
    }
    window.location.href = "../html/login.html";
  });


  // Se busca la cuenta cuyo correo coincide con la sesión actual.
  // Así no se muestran por error los datos de otra persona que usó este navegador.
  var usuario = null;
    try {
      const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
      usuario = usuarios.find(item => item.email.toLowerCase() === correoSesion) || null;
      if (!usuario && correoSesion) {
        const usuarioAnterior = JSON.parse(localStorage.getItem("usuario") || "null");
        if (usuarioAnterior && usuarioAnterior.email.toLowerCase() === correoSesion) usuario = usuarioAnterior;
      }
    } catch (error) {
      console.error("No se pudieron cargar los datos de la cuenta activa.", error);
    }
 
  // Si encontramos una cuenta, mostramos su información en la página.
  if (usuario && usuario.nombre) {
    document.getElementById("sinDatos").hidden = true;
    document.getElementById("conDatos").hidden = false;
 
    document.getElementById("saludo").textContent = "Hola, " + usuario.nombre + "!";
    document.getElementById("nombreCompleto").textContent = usuario.nombre + " " + (usuario.apellido || "");
    document.getElementById("correo").textContent = usuario.email;
 
    // Por defecto ocultamos la contraseña y dejamos que el usuario elija mostrarla.
    var clave = document.getElementById("clave");
    var btnVer = document.getElementById("btnVer");
    var visible = false;
 
    function pintarClave() {
      // Repite un punto por cada carácter para ocultar el valor original.
      clave.textContent = visible ? usuario.password : "•".repeat(usuario.password.length);
      btnVer.textContent = visible ? "Ocultar" : "Mostrar";
    }
    btnVer.addEventListener("click", function () {
      // Cambia entre visible y oculta y actualiza la pantalla.
      visible = !visible;
      pintarClave();
    });
    pintarClave();
  }
