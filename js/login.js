const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passError = document.getElementById('passError');
  const mensaje = document.getElementById('mensaje');
  const btn = document.getElementById('btn');
  const toggle = document.getElementById('toggle');

  // Mostrar / ocultar contraseña
  toggle.addEventListener('click', () => {
    const oculto = password.type === 'password';
    password.type = oculto ? 'text' : 'password';
    toggle.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

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

  btn.disabled = true;
  btn.textContent = 'Verificando...';
  await new Promise(r => setTimeout(r, 900));

  // Leer el usuario que guardó el registro
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem('usuario')); } catch (err) {}

  if (usuario &&
      usuario.email === email.value.trim().toLowerCase() &&
      usuario.password === password.value) {
    mensaje.className = 'ok';
    mensaje.textContent = '¡Sesión iniciada! Redirigiendo...';
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

  // Limpiar el error al escribir
  email.addEventListener('input', () => { emailError.textContent = ''; email.classList.remove('invalid'); });
  password.addEventListener('input', () => { passError.textContent = ''; password.classList.remove('invalid'); });