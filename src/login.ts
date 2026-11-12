(() => {
  const form = document.getElementById('loginForm') as HTMLFormElement | null;
  const email = document.getElementById('email') as HTMLInputElement | null;
  const password = document.getElementById('password') as HTMLInputElement | null;
  const emailError = document.getElementById('emailError') as HTMLElement | null;
  const passError = document.getElementById('passError') as HTMLElement | null;
  const mensaje = document.getElementById('mensaje') as HTMLElement | null;
  const btn = document.getElementById('btn') as HTMLButtonElement | null;
  const toggle = document.getElementById('toggle') as HTMLButtonElement | null;
  const entrarSinSesion = document.getElementById('entrarSinSesion') as HTMLButtonElement | null;

  if (!form || !email || !password || !emailError || !passError || !mensaje || !btn || !toggle || !entrarSinSesion) return;

  const emailInput = email;
  const passwordInput = password;
  const emailErrorEl = emailError;
  const passErrorEl = passError;

  entrarSinSesion.addEventListener('click', () => {
    window.location.href = '../index.html';
  });

  toggle.addEventListener('click', () => {
    const oculto = passwordInput.type === 'password';
    passwordInput.type = oculto ? 'text' : 'password';
    toggle.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });

  function validarEmail(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  function validar() {
    let ok = true;
    emailErrorEl.textContent = '';
    passErrorEl.textContent = '';
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');

    if (!emailInput.value.trim()) {
      emailErrorEl.textContent = 'Ingresá tu correo electrónico.';
      emailInput.classList.add('invalid');
      ok = false;
    } else if (!validarEmail(emailInput.value.trim())) {
      emailErrorEl.textContent = 'El correo no es válido. Ejemplo: nombre@dominio.com';
      emailInput.classList.add('invalid');
      ok = false;
    }

    if (!passwordInput.value) {
      passErrorEl.textContent = 'Ingresá tu contraseña.';
      passwordInput.classList.add('invalid');
      ok = false;
    } else if (passwordInput.value.length < 6) {
      passErrorEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      passwordInput.classList.add('invalid');
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

    try {
      const respuesta = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value.trim().toLowerCase(),
          password: passwordInput.value
        })
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        throw new Error(data.mensaje || 'Correo o contraseña incorrectos.');
      }

      const usuario = data.usuario || {};
      const emailUsuario = String(usuario.email || emailInput.value.trim().toLowerCase()).toLowerCase();
      const rol = String(usuario.role || 'cliente');

      const sesion = {
        email: emailUsuario,
        role: rol,
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || ''
      };
      localStorage.setItem('usuarioSesion', JSON.stringify(sesion));

      if (rol === 'administrador') {
        const destino = `../html/adminIni.html?email=${encodeURIComponent(emailUsuario)}&role=${encodeURIComponent(rol)}`;
        localStorage.setItem('usuarioSesion', JSON.stringify(sesion));
        setTimeout(() => {
          window.location.href = destino;
        }, 800);
        return;
      }

      mensaje.className = 'ok';
      mensaje.textContent = '¡Sesión iniciada! Redirigiendo...';

      const destino = `../index.html?email=${encodeURIComponent(emailUsuario)}&role=${encodeURIComponent(rol)}`;
      setTimeout(() => {
        window.location.href = destino;
      }, 800);
    } catch (error) {
      console.error('No se pudo iniciar sesión.', error);
      mensaje.className = 'fail';
      mensaje.textContent = error instanceof Error ? error.message : 'Correo o contraseña incorrectos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  emailInput.addEventListener('input', () => { emailErrorEl.textContent = ''; emailInput.classList.remove('invalid'); });
  passwordInput.addEventListener('input', () => { passErrorEl.textContent = ''; passwordInput.classList.remove('invalid'); });
})();