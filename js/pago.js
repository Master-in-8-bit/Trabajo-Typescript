  const fmt = n => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const precioFinal = p => p.regular * (1 - p.dto / 100);
 
  // Leer el carrito guardado
  let carrito = {};
  try {
    const guardado = JSON.parse(localStorage.getItem("carrito")) || {};
    for (const id in guardado) {
      if (guardado[id] && typeof guardado[id] === "object") carrito[id] = guardado[id];
    }
  } catch (e) {}
 
  const items = Object.values(carrito);
  const subtotal = items.reduce((s, p) => s + p.cantidad * p.regular, 0);
  const total = items.reduce((s, p) => s + p.cantidad * precioFinal(p), 0);
  const descuentos = subtotal - total;
 
  const seccionPago = document.getElementById("seccionPago");
 
  if (!items.length) {
    // Carrito vacío: no se puede pagar
    seccionPago.innerHTML = '<p class="vacio">Tu carrito está vacío.<br><a href="../index.html">Ir a ver productos</a></p>';
    document.getElementById("seccionResumen").hidden = true;
  } else {
    document.getElementById("items").innerHTML = items.map(p => `
      <div class="linea">
        <span>${p.nombre}<br><small>${p.cantidad} × ${fmt(precioFinal(p))}</small></span>
        <strong>${fmt(p.cantidad * precioFinal(p))}</strong>
      </div>`).join("");
    document.getElementById("subtotal").textContent = fmt(subtotal);
    document.getElementById("descuentos").textContent = "-" + fmt(descuentos);
    document.getElementById("total").textContent = fmt(total);
 
    // Autocompletar el titular con el nombre del usuario registrado (si existe)
    try {
      const u = JSON.parse(localStorage.getItem("usuario"));
      if (u && u.nombre) document.getElementById("titular").value = (u.nombre + " " + (u.apellido || "")).trim();
    } catch (e) {}
 
    const titular = document.getElementById("titular");
    const numero = document.getElementById("numero");
    const venc = document.getElementById("venc");
    const cvv = document.getElementById("cvv");
    const campos = { titular, numero, venc, cvv };
    const errores = {
      titular: document.getElementById("errTitular"),
      numero: document.getElementById("errNumero"),
      venc: document.getElementById("errVenc"),
      cvv: document.getElementById("errCvv")
    };
 
    // Formato automático: número en grupos de 4 y vencimiento MM/AA
    numero.addEventListener("input", () => {
      const d = numero.value.replace(/\D/g, "").slice(0, 16);
      numero.value = d.replace(/(.{4})/g, "$1 ").trim();
    });
    venc.addEventListener("input", () => {
      const d = venc.value.replace(/\D/g, "").slice(0, 4);
      venc.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });
    cvv.addEventListener("input", () => { cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4); });
 
    function setError(c, texto) {
      errores[c].textContent = texto;
      campos[c].classList.add("invalid");
    }
 
    function validar() {
      let ok = true;
      for (const c in campos) { errores[c].textContent = ""; campos[c].classList.remove("invalid"); }
 
      if (titular.value.trim().length < 3) { setError("titular", "Ingresá el nombre del titular."); ok = false; }
 
      if (numero.value.replace(/\s/g, "").length !== 16) {
        setError("numero", "El número debe tener 16 dígitos."); ok = false;
      }
 
      const m = venc.value.match(/^(\d{2})\/(\d{2})$/);
      if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
        setError("venc", "Usá el formato MM/AA."); ok = false;
      } else {
        const hoy = new Date();
        const finMes = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
        if (finMes < hoy) { setError("venc", "La tarjeta está vencida."); ok = false; }
      }
 
      if (cvv.value.length < 3) { setError("cvv", "Ingresá 3 o 4 dígitos."); ok = false; }
      return ok;
    }
 
    for (const c in campos) {
      campos[c].addEventListener("input", () => {
        errores[c].textContent = "";
        campos[c].classList.remove("invalid");
      });
    }
 
    document.getElementById("formPago").addEventListener("submit", async e => {
      e.preventDefault();
      if (!validar()) return;
 
      const btn = document.getElementById("btnConfirmar");
      btn.disabled = true;
      btn.textContent = "Procesando pago...";
      await new Promise(r => setTimeout(r, 1800));   // simulación
 
      // Pago "aprobado": se vacía el carrito y se muestra la confirmación
      const nroPedido = "#" + Math.floor(100000 + Math.random() * 900000);
      try { localStorage.removeItem("carrito"); } catch (err) {}
 
      document.getElementById("textoPedido").textContent = "Número de pedido: " + nroPedido;
      document.getElementById("textoTotal").textContent = "Total pagado: " + fmt(total);
      seccionPago.hidden = true;
      document.getElementById("seccionResumen").hidden = true;
      document.getElementById("exito").hidden = false;
    });
  }

