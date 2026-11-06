interface producto {
    nombre: string;
    categoria: string;
    precio: number;
    stock: number;
}

const Listaproductos = new Set<producto>();

const Pancho: producto = {
    nombre: "Pancho",
    categoria: "Comida",
    precio: 1500,
    stock: 15,
};

Listaproductos.add(Pancho);

function actualizarLista() {
    const tablaProductos = document.getElementById("tablaProductos");

    if (!tablaProductos) {
        console.error("No se encontró el elemento #tablaProductos");
        return;
    }

    const filas = [...Listaproductos]
        .map(
            (element) => `
                <tr>
                    <td>${element.nombre}</td>
                    <td>${element.categoria}</td>
                    <td>$${element.precio}</td>
                    <td>${element.stock}</td>
                </tr>
            `
        )
        .join("");

    tablaProductos.innerHTML = filas;
}

actualizarLista();