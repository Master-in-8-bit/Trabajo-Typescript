// Busca en el HTML los campos, mensajes y botones del formulario de login.
const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passError = document.getElementById('passError');
  const mensaje = document.getElementById('mensaje');
  const btn = document.getElementById('btn');
  const toggle = document.getElementById('toggle');
  const entrarSinSesion = document.getElementById('entrarSinSesion');

  // El modo invitado limpia una sesión anterior y vuelve a la tienda.
  entrarSinSesion.addEventListener('click', () => {
    try {
      sessionStorage.removeItem('usuarioSesion');
    } catch (error) {
      console.error('No se pudo limpiar la sesión.', error);
    }
    window.location.href = '../index.html';
  });

  // Cambia el campo de contraseña entre texto visible y puntos ocultos.
  toggle.addEventListener('click', () => {
    const oculto = password.type === 'password';
    password.type = oculto ? 'text' : 'password';
    toggle.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });

  // Comprueba que el correo tenga una estructura básica válida.
  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  // Busca la cuenta por correo. Primero usa la lista nueva de cuentas y,
  // si todavía no existe, revisa el formato antiguo de una sola cuenta.
  function buscarUsuario(emailIngresado) {
    const usuariosGuardados = localStorage.getItem('usuarios');
    if (usuariosGuardados !== null) {
      const usuarios = JSON.parse(usuariosGuardados);
      if (!Array.isArray(usuarios)) throw new Error('La lista de usuarios guardada no es válida.');
      return usuarios.find(usuario =>
        usuario && typeof usuario.email === 'string' &&
        usuario.email.toLowerCase() === emailIngresado
      );
    }

    const usuarioAnterior = localStorage.getItem('usuario');
    if (!usuarioAnterior) return null;
    const usuario = JSON.parse(usuarioAnterior);
    return usuario && usuario.email.toLowerCase() === emailIngresado ? usuario : null;
  }

  // Valida los campos y muestra los errores junto al campo correspondiente.
  function validar() {
    let ok = true;
    emailError.textContent = '';
    passError.textContent = '';
    email.classList.remove('invalid');
    password.classList.remove('invalid');

    if (!email.value.trim()) {
      emailError.textContent = 'Ingresá tu correo electrónico.';
      email.classList.add('invalid');
      ok = false;
    } else if (!validarEmail(email.value.trim())) {
      emailError.textContent = 'El correo no es válido. Ejemplo: nombre@dominio.com';
      email.classList.add('invalid');
      ok = false;
    }

    if (!password.value) {
      passError.textContent = 'Ingresá tu contraseña.';
      password.classList.add('invalid');
      ok = false;
    } else if (password.value.length < 6) {
      passError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      password.classList.add('invalid');
      ok = false;
    }
    return ok;
  }

  form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensaje.className = '';
  mensaje.textContent = '';
  if (!validar()) return;

  // Mientras verificamos, desactivamos el botón para evitar envíos repetidos.
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  await new Promise(r => setTimeout(r, 900));

  // Leer el usuario que guardó el registro y comparar correo y contraseña.
  let usuario = null;
  try {
    usuario = buscarUsuario(email.value.trim().toLowerCase());
  } catch (error) {
    console.error('No se pudieron leer las cuentas guardadas.', error);
    mensaje.className = 'fail';
    mensaje.textContent = 'No se pudieron verificar las cuentas guardadas.';
    btn.disabled = false;
    btn.textContent = 'Entrar';
    return;
  }

  if (usuario &&
      usuario.email.toLowerCase() === email.value.trim().toLowerCase() &&
      usuario.password === password.value) {
    // Guardamos solo el correo de la cuenta activa para usarlo en otras páginas.
    try {
      sessionStorage.setItem('usuarioSesion', usuario.email.toLowerCase());
    } catch (err) {
      console.error('No se pudo guardar la sesión.', err);
      mensaje.className = 'fail';
      mensaje.textContent = 'No se pudo iniciar la sesión en este navegador.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }
    mensaje.className = 'ok';
    mensaje.textContent = '¡Sesión iniciada! Redirigiendo...';
    // Espera brevemente para que se alcance a leer el mensaje de éxito.
    setTimeout(() => {
      window.location.href = '../index.html';   // poné la ruta de tu inicio
    }, 800);
  } else {
    mensaje.className = 'fail';
    mensaje.textContent = 'Correo o contraseña incorrectos.';
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

  // Al volver a escribir en un campo, quitamos el error de ese campo.
  email.addEventListener('input', () => { emailError.textContent = ''; email.classList.remove('invalid'); });
  password.addEventListener('input', () => { passError.textContent = ''; password.classList.remove('invalid'); });