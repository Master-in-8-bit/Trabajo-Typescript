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


    // Leer el usuario que guardó la página de registro
  var usuario = null;
  try { usuario = JSON.parse(localStorage.getItem("usuario")); } catch (e) {}
  console.log("Mi cuenta - usuario guardado:", usuario);
 
  if (usuario && usuario.nombre) {
    document.getElementById("sinDatos").hidden = true;
    document.getElementById("conDatos").hidden = false;
 
    document.getElementById("saludo").textContent = "Hola, " + usuario.nombre + "!";
    document.getElementById("nombreCompleto").textContent = usuario.nombre + " " + (usuario.apellido || "");
    document.getElementById("correo").textContent = usuario.email;
 
    // Contraseña oculta con puntitos, con botón para mostrarla
    var clave = document.getElementById("clave");
    var btnVer = document.getElementById("btnVer");
    var visible = false;
 
    function pintarClave() {
      clave.textContent = visible ? usuario.password : "•".repeat(usuario.password.length);
      btnVer.textContent = visible ? "Ocultar" : "Mostrar";
    }
    btnVer.addEventListener("click", function () {
      visible = !visible;
      pintarClave();
    });
    pintarClave();
  }
