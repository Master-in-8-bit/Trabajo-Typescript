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

    // Acá iría tu llamada real al servidor, por ejemplo:
    // const res = await fetch('/api/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: email.value.trim(), password: password.value })
    // });
    await new Promise(r => setTimeout(r, 900)); // simulación

    // Credenciales de prueba
    if (email.value.trim() === 'demo@correo.com' && password.value === '123456') {
      mensaje.className = 'ok';
      mensaje.textContent = '¡Sesión iniciada correctamente!';
    } else {
      mensaje.className = 'fail';
      mensaje.textContent = 'Correo o contraseña incorrectos.';
    }

    if (email.value.trim() === 'demo@correo.com' && password.value === '123456') {
  mensaje.className = 'ok';
  mensaje.textContent = '¡Sesión iniciada! Redirigiendo...';

  // Espera un momento para que se vea el mensaje y redirige
  setTimeout(() => {
    window.location.href = '../index.html'; // Cambia esto a la página de inicio real
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