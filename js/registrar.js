// Conecta los campos del formulario con sus mensajes de error.
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
  const USUARIOS_KEY = 'usuarios';

  // Lee todas las cuentas guardadas. Si solo existe el formato anterior,
  // lo convierte en una lista para mantener compatibilidad.
  function cargarUsuarios() {
    const guardados = localStorage.getItem(USUARIOS_KEY);
    if (guardados !== null) {
      const usuarios = JSON.parse(guardados);
      if (!Array.isArray(usuarios)) throw new Error('La lista de usuarios guardada no es válida.');
      return usuarios;
    }

    const usuarioAnterior = localStorage.getItem('usuario');
    return usuarioAnterior ? [JSON.parse(usuarioAnterior)] : [];
  }

  // Permite alternar entre contraseña oculta y visible.
  toggle.addEventListener('click', () => {
    const oculto = campos.password.type === 'password';
    campos.password.type = oculto ? 'text' : 'password';
    toggle.textContent = oculto ? 'Ocultar' : 'Mostrar';
  });

  // Muestra un mensaje de error y resalta visualmente el campo indicado.
  function setError(campo, texto) {
    errores[campo].textContent = texto;
    campos[campo].classList.add('invalid');
  }

  // Revisa que nombre, apellido, correo y contraseña tengan valores válidos.
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

    // Preparamos la cuenta; el correo se guarda en minúsculas para comparar
    // de forma consistente aunque se escriba con mayúsculas.
    const datos = {
      nombre: campos.nombre.value.trim(),
      apellido: campos.apellido.value.trim(),
      email: campos.email.value.trim().toLowerCase(),
      password: campos.password.value
    };

    try {
      const usuarios = cargarUsuarios();
      // No permitimos registrar dos cuentas con el mismo correo.
      if (usuarios.some(usuario => usuario.email.toLowerCase() === datos.email)) {
        setError('email', 'Ya existe una cuenta con ese correo.');
        btn.disabled = false;
        btn.textContent = 'Crear cuenta';
        return;
      }
      // Agregamos la nueva cuenta a la lista y la guardamos como texto JSON.
      usuarios.push(datos);
      localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    } catch (error) {
      console.error('No se pudo guardar la cuenta.', error);
      mensaje.className = 'fail';
      mensaje.textContent = 'No se pudo guardar la cuenta en este navegador.';
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
      return;
    }

    mensaje.className = 'ok';
    mensaje.textContent = '¡Cuenta creada! Redirigiendo al inicio de sesión...';
    // Damos tiempo para que se vea el mensaje antes de ir al login.
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
  });

  // Mientras se corrige un campo, quitamos su mensaje de error.
  for (const c in campos) {
    campos[c].addEventListener('input', () => {
      errores[c].textContent = '';
      campos[c].classList.remove('invalid');
    });
  }