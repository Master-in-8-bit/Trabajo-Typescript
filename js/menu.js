(() => {
  // Este script se comparte entre páginas que tienen un enlace de administración.
  const enlaceAdmin = document.getElementById("enlaceAdmin");
  // Algunas páginas no tienen ese enlace; en ese caso no hay nada que cambiar.
  if (!enlaceAdmin) return;

  try {
    // Solo los correos terminados en @admin.com pueden ver el enlace.
    const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
    enlaceAdmin.hidden = !correoSesion.endsWith("@admin.com");
  } catch (error) {
    // Ante un error al leer la sesión, ocultamos el enlace por seguridad.
    console.error("No se pudo verificar el acceso de administración.", error);
    enlaceAdmin.hidden = true;
  }
})();
