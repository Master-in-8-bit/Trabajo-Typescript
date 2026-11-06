const form = document.getElementById('registroForm');
  const campos = {
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    email: document.getElementById('email'),
    password: document.getElementById('password')
  };
  const errores = {
    nombre: document.getElementById('nombreError'),
    apellido: document.getElementById('apellidoError'),
    email: document.getElementById('emailError'),
    password: document.getElementById('passError')
  };
  const mensaje = document.getElementById('mensaje');
  const btn = document.getElementById('btn');
  const toggle = document.getElementById('toggle');

  // Mostrar / ocultar contraseña
  toggle.addEventListener('click', () => {
    const oculto = campos.password.type === 'password';
    campos.password.type = oculto ? 'text' : 'password';
    toggle.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });

  function setError(campo, texto) {
    errores[campo].textContent = texto;
    campos[campo].classList.add('invalid');
  }

  function validar() {
    let ok = true;
    for (const c in campos) {
      errores[c].textContent = '';
      campos[c].classList.remove('invalid');
    }

    if (campos.nombre.value.trim().length < 2) {
      setError('nombre', 'Ingresá tu nombre.');
      ok = false;
    }
    if (campos.apellido.value.trim().length < 2) {
      setError('apellido', 'Ingresá tu apellido.');
      ok = false;
    }

    const mail = campos.email.value.trim();
    if (!mail) {
      setError('email', 'Ingresá tu correo electrónico.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      setError('email', 'El correo no es válido. Ejemplo: nombre@dominio.com');
      ok = false;
    }

    if (!campos.password.value) {
      setError('password', 'Creá una contraseña.');
      ok = false;
    } else if (campos.password.value.length < 6) {
      setError('password', 'La contraseña debe tener al menos 6 caracteres.');
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
    btn.textContent = 'Creando cuenta...';

    const datos = {
      nombre: campos.nombre.value.trim(),
      apellido: campos.apellido.value.trim(),
      email: campos.email.value.trim(),
      password: campos.password.value
    };

    // Acá iría tu llamada real al servidor, por ejemplo:
    // const res = await fetch('/api/registro', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(datos)
    // });
    await new Promise(r => setTimeout(r, 900)); // simulación

    mensaje.className = 'ok';
    mensaje.textContent = '¡Cuenta creada! Redirigiendo al inicio de sesión...';
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
  });

  // Limpiar el error al escribir
  for (const c in campos) {
    campos[c].addEventListener('input', () => {
      errores[c].textContent = '';
      campos[c].classList.remove('invalid');
    });
  }