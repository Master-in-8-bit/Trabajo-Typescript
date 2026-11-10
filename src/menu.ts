(() => {
  const enlaceAdmin = document.getElementById("enlaceAdmin");

  if (!enlaceAdmin) return;

  try {
    const correoSesion = (sessionStorage.getItem("usuarioSesion") || "").toLowerCase();
    enlaceAdmin.hidden = !correoSesion.endsWith("@admin.com");
  } catch (error) {
    console.error("No se pudo verificar el acceso de administración.", error);
    enlaceAdmin.hidden = true;
  }
})();