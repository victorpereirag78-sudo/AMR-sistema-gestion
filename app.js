// =======================================================
// --- Datos Centralizados y Estado de la Aplicación ---
// =======================================================
const appData = {
    regiones: {
        "14": { nombre: "Región de Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos","Máfil", "La Unión", "Futrono", "Lago Ranco","Río Bueno", "Mariquina", "Paillaco", "Panguipulli"] },
        "10": { nombre: "Provincia de Llanquihue", comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Maullín", "Puerto Varas", "Frutillar", "Los Muermos", "Llanquihue"] },
        "10.1": { nombre: "Provincia de Osorno", comunas: ["Osorno", "Puerto Octay", "Puyehue", "Río Negro", "Purranque", "San Juan de la Costa", "San Pablo"] },
        "10.2": { nombre: "Provincia de Chiloé", comunas: ["Castro", "Ancud", "Quellón", "Dalcahue", "Chonchi", "Curaco de Vélez", "Queilén", "Quinchao", "Puqueldón"] },
        "10.3": { nombre: "Provincia de Palena", comunas: ["Chaitén", "Futaleufú", "Palena", "Hualaihué"] },
        "1": { nombre: "Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
        "13": { nombre: "Metropolitana", comunas: ["Santiago", "Puente Alto", "La Florida", "Maipú", "Providencia", "Las Condes", "Ñuñoa"] },
        "8": { nombre: "Biobío", comunas: ["Concepción", "Talcahuano", "Chillán", "Los Ángeles", "Coronel", "Hualpén", "San Pedro de la Paz"] }
    },
    servicios: {
        Instalacion: ["1 Deco", "2 Decos", "3 Decos", "4 Decos"],
        VT: ["Visita Técnica", "Garantía"],
        Upgrade: ["Up 1 Deco", "Up 2 Decos", "Up 3 Decos"],
        Traslado: ["Traslado 1 Deco", "Traslado 2 Decos"],
        Regularizacion: ["Cambio Deco", "Agregar Otros"]
    },
    personal: {
        despacho: [],
        tecnicos: []
    },
    cargos: [],
    departamentos: [],
    empleados: []
};
let motivoSeleccionado = null; // { ordenId, motivo }
let ordenes = [];
let paginaActual = 1;
const filasPorPagina = 10;
const TIPOS_RECHAZO = ["Cliente rechaza", "Sin moradores", "Direccion erronea", "Orden mal generada", "Servicio operativo"];
let datosReporteActual = []; // Guardará los datos filtrados para exportar

// =======================================================
// --- Funciones de UI (Interfaz de Usuario) ---
// =======================================================
function mostrarToast(mensaje, tipo = 'success') {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

// ==================================
// --- Lógica de Login y Navegación ---
// ==================================
function login() {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    mostrarPanel('panel-bienvenida');
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    const btnDth = document.querySelector('#main-nav button[data-module="dth"]');
    if (btnDth) btnDth.classList.add('active');
    
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    const submenuDth = document.getElementById('submenu-dth');
    if (submenuDth) submenuDth.classList.add('active');
}

function seleccionarModulo(moduloId) {
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    const botonActivo = document.querySelector(`#main-nav button[data-module="${moduloId}"]`);
    if(botonActivo) botonActivo.classList.add('active');
    
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    const submenuActivo = document.getElementById(`submenu-${moduloId}`);
    if(submenuActivo) submenuActivo.classList.add('active');
    
    // Mostrar el primer panel del submenú o bienvenida si no hay paneles
    const primerBotonDelSubmenu = submenuActivo?.querySelector('button[data-panel]');
    if (primerBotonDelSubmenu) {
        mostrarPanel(primerBotonDelSubmenu.dataset.panel);
    } else {
        mostrarPanel('panel-bienvenida');
    }
}

function mostrarPanel(panelId) {
    document.querySelectorAll('#main-content .content-panel').forEach(p => p.classList.remove('active'));
    const panelActivo = document.getElementById(panelId);
    if (!panelActivo) {
        console.error(`Panel no encontrado: ${panelId}`);
        return;
    }
    panelActivo.classList.add('active');

    switch (panelId) {
        case 'panel-agendadas':
            paginaActual = 1;
            if (appData.personal.tecnicos.length > 0) {
                populateSelect(document.getElementById('filtro-tecnico'), appData.personal.tecnicos.map(t => ({ value: t, text: t })), "Todos los Técnicos");
            }
            if (Object.keys(appData.servicios).length > 0) {
                populateSelect(document.getElementById('filtro-servicio'), Object.keys(appData.servicios).map(s => ({ value: s, text: s })), "Todos los Servicios");
            }
            const regionFiltro = document.getElementById("filtro-region");
            if (regionFiltro) {
                populateSelect(regionFiltro, Object.keys(appData.regiones).map(num => ({ value: num, text: appData.regiones[num].nombre })), "Todas las Regiones");
                regionFiltro.addEventListener('change', () => {
                    cargarComunas(document.getElementById('filtro-comuna'), regionFiltro);
                    aplicarFiltros();
                });
                cargarComunas(document.getElementById('filtro-comuna'), regionFiltro);
            }
            const filtrosContainer = document.querySelector('#panel-agendadas .filtros-container');
            if (filtrosContainer) filtrosContainer.style.display = 'flex';
            aplicarFiltros();
            break;
        case 'panel-gestion-cargos': renderGestionCargos(); break;
        case 'panel-gestion-departamentos': renderGestionDepartamentos(); break;
        case 'panel-lista-personal': renderTablaPersonal(); break;
        case 'panel-nuevo-ingreso': setupFormularioNuevoIngreso(); break;
        case 'panel-liquidadas': renderTablaLiquidadas(); break;
        case 'panel-rechazadas': renderTablaRechazadas(); break;
        case 'reportes-produccion': 
            populateSelect(document.getElementById('filtro-reporte-tecnico'), appData.personal.tecnicos.map(t => ({ value: t, text: t })), "Todos");
            populateSelect(document.getElementById('filtro-reporte-region'), Object.values(appData.regiones).map(r => ({ value: r.nombre, text: r.nombre })), "Todas");
            populateSelect(document.getElementById('filtro-reporte-servicio'), Object.keys(appData.servicios).map(s => ({ value: s, text: s })), "Todos");
            document.getElementById('filtro-reporte-region').addEventListener('change', (e) => {
                 const regionSeleccionada = Object.entries(appData.regiones).find(([key, val]) => val.nombre === e.target.value);
                 if (regionSeleccionada) {
                    const comunas = appData.regiones[regionSeleccionada[0]].comunas;
                    populateSelect(document.getElementById('filtro-reporte-comuna'), comunas.map(c => ({value: c, text: c})), "Todas");
                 } else {
                    document.getElementById('filtro-reporte-comuna').innerHTML = '<option value="">Todas</option>';
                 }
            });
            aplicarFiltrosReporte(); 
            break;
    }
}

// ============================================
// --- Lógica del Formulario de Ingreso DTH ---
// ============================================
function validarNumeroOrden() {
    const numeroInput = document.getElementById('orden-numero');
    if (!numeroInput) return;
    const numero = numeroInput.value;
    if (!numero) return mostrarToast("Por favor, ingrese un número de orden.", "error");
    if (ordenes.some(o => o.numero === numero)) return mostrarToast(`La orden N° ${numero} ya existe.`, "error");
    const formIngreso = document.getElementById('form-ingreso-orden');
    const paso1 = document.getElementById('ingreso-paso-1');
    if (formIngreso) formIngreso.style.display = 'block';
    if (paso1) paso1.style.display = 'none';
    const rutInput = document.getElementById('orden-rut');
    if (rutInput) rutInput.focus();
}

function validarRutChileno(rut) {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
    let [cuerpo, dv] = rut.split('-');
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * cuerpo.charAt(i);
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    dv = (dv.toLowerCase() === 'k') ? 10 : parseInt(dv, 10);
    return dvEsperado === 11 ? dv === 0 : dvEsperado === 10 ? dv === 10 : dv === dvEsperado;
}

function validarRutInput(inputElement) {
    inputElement.classList.remove('valid', 'invalid');
    if (inputElement.value) {
        const esValido = validarRutChileno(inputElement.value);
        inputElement.classList.add(esValido ? 'valid' : 'invalid');
    }
}

function cargarComunas(selectComuna, selectRegion) {
    if (!selectComuna || !selectRegion) return;
    const regionNum = selectRegion.value;
    const comunas = appData.regiones[regionNum]?.comunas || [];
    populateSelect(selectComuna, comunas.map(c => ({ value: c, text: c })), "Seleccione Comuna");
}

function cargarSubServicio(selectSub, selectServicio) {
    if (!selectSub || !selectServicio) return;
    const servicio = selectServicio.value;
    const subServicios = appData.servicios[servicio] || [];
    populateSelect(selectSub, subServicios.map(s => ({ value: s, text: s })), "Seleccione Sub Servicio");
}

function resetFormularioOrden() {
    const form = document.getElementById('form-ingreso-orden');
    if (form) form.reset();
    if (form) form.style.display = 'none';
    const paso1 = document.getElementById('ingreso-paso-1');
    if (paso1) paso1.style.display = 'block';
    const numInput = document.getElementById('orden-numero');
    if (numInput) numInput.value = '';
    const rutInput = document.getElementById('orden-rut');
    if (rutInput) rutInput.classList.remove('valid', 'invalid');
    cargarComunas(document.getElementById('orden-comuna'), document.getElementById('orden-region'));
    cargarSubServicio(document.getElementById('orden-sub'), document.getElementById('orden-servicio'));
}

function guardarOrden(event) {
    event.preventDefault();
    const numero = document.getElementById('orden-numero')?.value.trim();
    const rut = document.getElementById('orden-rut')?.value.trim();
    const nombre = document.getElementById('orden-nombre')?.value.trim();
    const direccion = document.getElementById('orden-direccion')?.value.trim();
    const numeroContacto = document.getElementById('numeroContacto')?.value.trim();
    const regionSelect = document.getElementById('orden-region');
    const regionId = regionSelect?.value;
    const regionNombre = regionId ? regionSelect.options[regionSelect.selectedIndex].text : '';
    const comuna = document.getElementById('orden-comuna')?.value;
    const servicio = document.getElementById('orden-servicio')?.value;
    const subServicio = document.getElementById('orden-sub')?.value;
    const fecha = document.getElementById('orden-fecha')?.value;
    const tecnico = document.getElementById('orden-tecnico')?.value;
    const despacho = document.getElementById('orden-despacho')?.value;
    const observacion = document.getElementById('orden-observacion')?.value.trim();

    if (!numero || !rut || !nombre || !direccion || !regionId || !comuna || !servicio || !subServicio || !fecha || !tecnico || !despacho) {
        return mostrarToast("Todos los campos marcados son obligatorios.", "error");
    }
    if (!validarRutChileno(rut)) return mostrarToast("RUT inválido.", "error");

    const nuevaOrden = {
        id: `orden-${Date.now()}`, numero, rut, nombre, direccion, numeroContacto, 
        region: regionNombre, comuna, servicio, subServicio, fecha, tecnico, despacho, observacion,
        estado: 'Agendada'
    };
    ordenes.unshift(nuevaOrden);
    function guardarOrdenesFirebase() {
    db.ref('ordenes').set(ordenes);
    }
    mostrarToast(`Orden N° ${numero} guardada con éxito.`, "success");
    resetFormularioOrden();
    mostrarPanel('panel-agendadas');
}

// ============================================
// --- Lógica del Panel "Agendadas" y Filtros ---
// ============================================
function renderTablaAgendadas(datos) {
    const tbody = document.querySelector("#tabla-agendadas tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const datosParaMostrar = datos || ordenes.filter(o => o.estado === 'Agendada');
    if (datosParaMostrar.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No se encontraron órdenes agendadas.</td></tr>`;
        const paginacion = document.getElementById("paginacion");
        if (paginacion) paginacion.innerHTML = "";
        return;
    }
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const datosPaginados = datosParaMostrar.slice(inicio, fin);
    datosPaginados.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${o.numero}</td>
            <td>${o.fecha}</td>
            <td>${o.subServicio}</td>
            <td>${o.nombre}</td>
            <td>${o.rut}</td>
            <td>${o.direccion}</td>
            <td>${o.comuna}</td>
            <td>${o.tecnico}</td>
            <td>
                <div class="dropdown">
                    <button class="btn-estado">🔄 Estado</button>
                    <div class="dropdown-content">
                        <button class="btn-liquidar" data-id="${o.id}">✅ Liquidadas</button>
                        <button class="btn-rechazar" data-id="${o.id}">❌ Rechazadas</button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-liquidar').forEach(btn => {
        btn.addEventListener('click', () => cambiarEstadoOrden(btn.dataset.id, 'Liquidadas'));
    });
    tbody.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', () => abrirMotivoRechazo(btn.dataset.id));
    });
    renderPaginacion(datosParaMostrar.length);
}

function renderPaginacion(totalFilas) {
    const cont = document.getElementById("paginacion");
    if (!cont) return;
    cont.innerHTML = "";
    const totalPaginas = Math.ceil(totalFilas / filasPorPagina);
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === paginaActual) btn.classList.add("active");
        btn.onclick = () => {
            paginaActual = i;
            aplicarFiltros(); 
        };
        cont.appendChild(btn);
    }
}

function aplicarFiltros() {
    const terminoEl = document.getElementById('filtro-buscador');
    const tecnicoEl = document.getElementById('filtro-tecnico');
    const regionEl = document.getElementById('filtro-region');
    const comunaEl = document.getElementById('filtro-comuna');
    const servicioEl = document.getElementById('filtro-servicio');
    const fechaEl = document.getElementById('filtro-fecha');

    const termino = terminoEl?.value.toLowerCase() || '';
    const tecnico = tecnicoEl?.value || '';
    const regionNum = regionEl?.value || '';
    const regionNombre = regionNum ? appData.regiones[regionNum]?.nombre : '';
    const comuna = comunaEl?.value || '';
    const servicio = servicioEl?.value || '';
    const fecha = fechaEl?.value || '';

    let resultados = ordenes.filter(o => 
        o.estado === 'Agendada' &&
        (termino === '' || o.numero.toLowerCase().includes(termino) || o.rut.toLowerCase().includes(termino) || o.nombre.toLowerCase().includes(termino)) &&
        (tecnico === '' || o.tecnico === tecnico) &&
        (regionNombre === '' || o.region === regionNombre) &&
        (comuna === '' || o.comuna === comuna) &&
        (servicio === '' || o.servicio === servicio) &&
        (fecha === '' || o.fecha === fecha)
    );
    renderTablaAgendadas(resultados);
}

function resetFiltros() {
    const inputs = ['filtro-buscador', 'filtro-tecnico', 'filtro-region', 'filtro-servicio', 'filtro-fecha'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        }
    });
    cargarComunas(document.getElementById('filtro-comuna'), document.getElementById('filtro-region'));
    aplicarFiltros();
}

function exportarExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(ordenes.filter(o => o.estado === 'Agendada'));
    XLSX.utils.book_append_sheet(wb, ws, "Agendadas");
    XLSX.writeFile(wb, "Reporte_Agendadas.xlsx");
}

function enviarPorCorreo() {
    const tecnicoFiltrado = document.getElementById('filtro-tecnico')?.value;
    if (!tecnicoFiltrado) return mostrarToast("Seleccione un técnico en los filtros.", "error");
    const tecnico = appData.empleados.find(emp => `${emp.nombre1} ${emp.apepaterno}` === tecnicoFiltrado && emp.activo);
    if (!tecnico || !tecnico.email) return mostrarToast(`No se encontró email para el técnico ${tecnicoFiltrado}.`, "error");
    const filas = document.querySelectorAll("#tabla-agendadas tbody tr");
    if (filas.length === 0 || filas[0].children.length < 2) return mostrarToast("No hay órdenes para enviar.", "error");
    let cuerpo = `Hola ${tecnico.nombre1},\nTienes las siguientes órdenes asignadas:\n`;
    filas.forEach((fila, index) => {
        const numero = fila.children[0].textContent;
        const fecha = fila.children[1].textContent;
        const cliente = fila.children[3].textContent;
        const direccion = fila.children[5].textContent;
        cuerpo += `${index + 1}. Orden #${numero} - ${fecha}\n   Cliente: ${cliente}\n   Dirección: ${direccion}\n`;
    });
    cuerpo += "Saludos.";
    const asunto = encodeURIComponent("Tus Órdenes de Trabajo – Sistema de Gestión");
    const body = encodeURIComponent(cuerpo);
    window.location.href = `mailto:${tecnico.email}?subject=${asunto}&body=${body}`;
}

function enviarPorWhatsapp() {
    const tecnicoFiltrado = document.getElementById('filtro-tecnico')?.value;
    if (!tecnicoFiltrado) return mostrarToast("Seleccione un técnico en los filtros.", "error");
    const tecnico = appData.empleados.find(emp => `${emp.nombre1} ${emp.apepaterno}` === tecnicoFiltrado && emp.activo);
    if (!tecnico || !tecnico.telefono) return mostrarToast(`No se encontró teléfono para el técnico ${tecnicoFiltrado}.`, "error");
    let numero = tecnico.telefono.replace(/\D/g, '');
    if (numero.length === 9 && numero.startsWith('9')) {
        numero = '56' + numero;
    }
    const filas = document.querySelectorAll("#tabla-agendadas tbody tr");
    if (filas.length === 0 || filas[0].children.length < 2) return mostrarToast("No hay órdenes para enviar.", "error");
    let mensaje = `Hola ${tecnico.nombre1}, tienes ${filas.length} órdenes:\n`;
    filas.forEach(fila => {
        const num = fila.children[0].textContent;
        const fecha = fila.children[1].textContent;
        const cliente = fila.children[3].textContent;
        mensaje += `• #${num} | ${fecha} | ${cliente}\n`;
    });
    mensaje += `\n¡Éxito en el terreno!`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ============================================
// --- Lógica de Búsqueda ---
// ============================================
function buscarPorOrden() {
    const input = document.getElementById('buscar-orden-input');
    const resultadoDiv = document.getElementById('resultado-orden');
    if (!input || !resultadoDiv) return;
    const numeroOrden = input.value.trim();
    if (!numeroOrden) return mostrarToast("Ingrese un número de orden.", "error");
    const orden = ordenes.find(o => o.numero === numeroOrden);
    resultadoDiv.innerHTML = orden ?
        `<p><strong>N° Orden:</strong> ${orden.numero}</p><p><strong>Cliente:</strong> ${orden.nombre}</p><p><strong>Estado:</strong> ${orden.estado}</p>` : `<p>Orden no encontrada.</p>`;
}

function buscarPorRut() {
    const input = document.getElementById('buscar-rut-input');
    const resultadoDiv = document.getElementById('resultado-rut');
    if (!input || !resultadoDiv) return;
    const rut = input.value.trim();
    if (!rut) return mostrarToast("Ingrese un RUT.", "error");
    const encontradas = ordenes.filter(o => o.rut.includes(rut));
    resultadoDiv.innerHTML = encontradas.length > 0 ?
        '<h3>Órdenes Encontradas</h3>' + encontradas.map(o => `<div class="resultado-busqueda-item"><p><strong>N° Orden:</strong> ${o.numero}</p><p><strong>Estado:</strong> ${o.estado}</p></div>`).join('') :
        `<p>No se encontraron órdenes para el RUT.</p>`;
}

// ============================================
// --- Lógica del Módulo RRHH ---
// ============================================
function renderGestionCargos() {
    const lista = document.getElementById('lista-cargos');
    if (!lista) return;
    lista.innerHTML = "";
    if (appData.cargos.length === 0) {
        lista.innerHTML = `<li style="text-align: center; color: #666;">No hay cargos definidos.</li>`;
        return;
    }
    appData.cargos.forEach(cargo => {
        const li = document.createElement('li');
        li.className = 'lista-gestion-item';
        li.innerHTML = `<span>${cargo.nombre}</span><button class="btn-eliminar" data-id="${cargo.id}">Eliminar</button>`;
        lista.appendChild(li);
    });
    lista.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarCargo(btn.dataset.id));
    });
}

function renderGestionDepartamentos() {
    const lista = document.getElementById('lista-departamentos');
    if (!lista) return;
    lista.innerHTML = "";
    if (appData.departamentos.length === 0) {
        lista.innerHTML = `<li style="text-align: center; color: #666;">No hay departamentos definidos.</li>`;
        return;
    }
    appData.departamentos.forEach(dpto => {
        const li = document.createElement('li');
        li.className = 'lista-gestion-item';
        li.innerHTML = `<span>${dpto.nombre}</span><button class="btn-eliminar" data-id="${dpto.id}">Eliminar</button>`;
        lista.appendChild(li);
    });
    lista.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarDepartamento(btn.dataset.id));
    });
}

function renderTablaPersonal() {
    const tbody = document.querySelector("#tabla-personal tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (appData.empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay personal registrado.</td></tr>`;
        return;
    }
    appData.empleados.forEach(emp => {
        const cargo = appData.cargos.find(c => c.id === emp.cargoId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${emp.nombre1} ${emp.nombre2 || ''} ${emp.apepaterno} ${emp.apematerno}</td>
            <td>${emp.rut}</td>
            <td>${cargo ? cargo.nombre : 'No asignado'}</td>
            <td>${emp.fechaIngreso}</td>
            <td><button class="btn-editar" data-id="${emp.id}">✏️ Editar</button></td>
        `;
        tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicionEmpleado(btn.dataset.id));
    });
}

function agregarCargo() {
    const input = document.getElementById('nuevo-cargo-nombre');
    if (!input) return;
    const nombre = input.value.trim();
    if (!nombre) return mostrarToast("Debe ingresar un nombre para el cargo.", "error");
    if (appData.cargos.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) {
        return mostrarToast("Ese cargo ya existe.", "error");
    }
    appData.cargos.push({ id: `cargo-${Date.now()}`, nombre });
    guardarDatosRRHH();
    renderGestionCargos();
    input.value = "";
    mostrarToast("Cargo agregado con éxito.");
}

function eliminarCargo(cargoId) {
    if (appData.empleados.some(emp => emp.cargoId === cargoId)) {
        return mostrarToast("No se puede eliminar, el cargo está en uso.", "error");
    }
    if (confirm("¿Está seguro de que desea eliminar este cargo?")) {
        appData.cargos = appData.cargos.filter(c => c.id !== cargoId);
        guardarDatosRRHH();
        renderGestionCargos();
        mostrarToast("Cargo eliminado.");
    }
}

function agregarDepartamento() {
    const input = document.getElementById('nuevo-dpto-nombre');
    if (!input) return;
    const nombre = input.value.trim();
    if (!nombre) return mostrarToast("Debe ingresar un nombre.", "error");
    if (appData.departamentos.some(d => d.nombre.toLowerCase() === nombre.toLowerCase())) {
        return mostrarToast("Ese departamento ya existe.", "error");
    }
    appData.departamentos.push({ id: `dpto-${Date.now()}`, nombre });
    guardarDatosRRHH();
    renderGestionDepartamentos();
    input.value = "";
    mostrarToast("Departamento agregado con éxito.");
}

function eliminarDepartamento(dptoId) {
    if (appData.empleados.some(emp => emp.dptoId === dptoId)) {
        return mostrarToast("No se puede eliminar, el departamento está en uso.", "error");
    }
    if (confirm("¿Está seguro de que desea eliminar este departamento?")) {
        appData.departamentos = appData.departamentos.filter(d => d.id !== dptoId);
        guardarDatosRRHH();
        renderGestionDepartamentos();
        mostrarToast("Departamento eliminado.");
    }
}

function setupFormularioNuevoIngreso() {
    const empCargo = document.getElementById('emp-cargo');
    const empDpto = document.getElementById('emp-dpto');
    const empRegion = document.getElementById('emp-region');
    const empComuna = document.getElementById('emp-comuna');

    if (empCargo) populateSelect(empCargo, appData.cargos.map(c => ({ value: c.id, text: c.nombre })), "Seleccione Cargo");
    if (empDpto) populateSelect(empDpto, appData.departamentos.map(d => ({ value: d.id, text: d.nombre })), "Seleccione Depto.");
    if (empRegion) {
        populateSelect(empRegion, Object.keys(appData.regiones).map(num => ({ value: num, text: appData.regiones[num].nombre })), "Seleccione Región");
        empRegion.onchange = () => cargarComunas(empComuna, empRegion);
    }
    if (empComuna) empComuna.innerHTML = "<option value=''>-- Seleccione Comuna --</option>";
}

function guardarNuevoEmpleado(event) {
    event.preventDefault();
    const rut = document.getElementById('emp-rut')?.value.trim();
    const cargoId = document.getElementById('emp-cargo')?.value;
    const dptoId = document.getElementById('emp-dpto')?.value;
    if (!rut || !validarRutChileno(rut)) return mostrarToast("El RUT es obligatorio y debe ser válido.", "error");
    if (appData.empleados.some(e => e.rut === rut)) return mostrarToast("El RUT ya está registrado.", "error");
    if (!cargoId || !dptoId) return mostrarToast("Debe seleccionar un cargo y un departamento.", "error");

    const nuevoEmpleado = {
        id: `emp-${Date.now()}`,
        nombre1: document.getElementById('emp-nombre1')?.value || '',
        nombre2: document.getElementById('emp-nombre2')?.value || '',
        apepaterno: document.getElementById('emp-apepaterno')?.value || '',
        apematerno: document.getElementById('emp-apematerno')?.value || '',
        rut,
        telefono: document.getElementById('emp-telefono')?.value || '',
        direccion: document.getElementById('emp-direccion')?.value || '',
        region: document.getElementById('emp-region')?.options[document.getElementById('emp-region')?.selectedIndex]?.text || '',
        comuna: document.getElementById('emp-comuna')?.value || '',
        fechaNacimiento: document.getElementById('emp-fecha-nac')?.value || '',
        email: document.getElementById('emp-email')?.value || '',
        cargoId,
        dptoId,
        fechaIngreso: document.getElementById('emp-fecha-ingreso')?.value || '',
        observacion: document.getElementById('emp-observacion')?.value || '',
        activo: document.getElementById('emp-activo')?.checked ?? false
    };
    appData.empleados.push(nuevoEmpleado);
    guardarDatosRRHH();
    actualizarPersonalDTH();
    mostrarToast("Empleado guardado con éxito.");
    const form = document.getElementById('form-nuevo-ingreso');
    if (form) form.reset();
    mostrarPanel('panel-lista-personal');
}

// ============================================
// --- Edición de Empleados ---
// ============================================
function abrirEdicionEmpleado(empleadoId) {
    const empleado = appData.empleados.find(e => e.id === empleadoId);
    if (!empleado) return mostrarToast("Empleado no encontrado.", "error");

    document.getElementById('editar-empleado-id').value = empleado.id;
    document.getElementById('editar-nombre1').value = empleado.nombre1;
    document.getElementById('editar-nombre2').value = empleado.nombre2 || '';
    document.getElementById('editar-apepaterno').value = empleado.apepaterno;
    document.getElementById('editar-apematerno').value = empleado.apematerno;
    document.getElementById('editar-rut').value = empleado.rut;
    document.getElementById('editar-telefono').value = empleado.telefono || '';
    document.getElementById('editar-direccion').value = empleado.direccion || '';
    document.getElementById('editar-fecha-nac').value = empleado.fechaNacimiento;
    document.getElementById('editar-email').value = empleado.email || '';
    document.getElementById('editar-fecha-ingreso').value = empleado.fechaIngreso;
    document.getElementById('editar-observacion').value = empleado.observacion || '';
    document.getElementById('editar-activo').checked = empleado.activo;

    populateSelect(document.getElementById('editar-cargo'), appData.cargos.map(c => ({ value: c.id, text: c.nombre })), "Seleccione Cargo");
    populateSelect(document.getElementById('editar-dpto'), appData.departamentos.map(d => ({ value: d.id, text: d.nombre })), "Seleccione Depto.");
    populateSelect(document.getElementById('editar-region'), Object.keys(appData.regiones).map(num => ({ value: num, text: appData.regiones[num].nombre })), "Seleccione Región");

    document.getElementById('editar-cargo').value = empleado.cargoId;
    document.getElementById('editar-dpto').value = empleado.dptoId;
    const regionKey = Object.keys(appData.regiones).find(num => appData.regiones[num].nombre === empleado.region) || '';
    document.getElementById('editar-region').value = regionKey;

    const regionSelect = document.getElementById('editar-region');
    const comunaSelect = document.getElementById('editar-comuna');
    cargarComunas(comunaSelect, regionSelect);
    setTimeout(() => { comunaSelect.value = empleado.comuna || ''; }, 10);

    mostrarPanel('panel-editar-empleado');
}

function guardarEdicionEmpleado(event) {
    event.preventDefault();
    const id = document.getElementById('editar-empleado-id')?.value;
    const rut = document.getElementById('editar-rut')?.value.trim();
    if (!id) return mostrarToast("Error: ID no válido.", "error");
    if (!rut || !validarRutChileno(rut)) return mostrarToast("RUT inválido.", "error");
    if (appData.empleados.some(e => e.rut === rut && e.id !== id)) return mostrarToast("El RUT ya está registrado en otro empleado.", "error");

    const index = appData.empleados.findIndex(e => e.id === id);
    if (index === -1) return mostrarToast("Empleado no encontrado.", "error");

    appData.empleados[index] = {
        ...appData.empleados[index],
        nombre1: document.getElementById('editar-nombre1')?.value || '',
        nombre2: document.getElementById('editar-nombre2')?.value || '',
        apepaterno: document.getElementById('editar-apepaterno')?.value || '',
        apematerno: document.getElementById('editar-apematerno')?.value || '',
        rut,
        telefono: document.getElementById('editar-telefono')?.value || '',
        direccion: document.getElementById('editar-direccion')?.value || '',
        region: document.getElementById('editar-region')?.options[document.getElementById('editar-region')?.selectedIndex]?.text || '',
        comuna: document.getElementById('editar-comuna')?.value || '',
        fechaNacimiento: document.getElementById('editar-fecha-nac')?.value || '',
        email: document.getElementById('editar-email')?.value || '',
        cargoId: document.getElementById('editar-cargo')?.value || '',
        dptoId: document.getElementById('editar-dpto')?.value || '',
        fechaIngreso: document.getElementById('editar-fecha-ingreso')?.value || '',
        observacion: document.getElementById('editar-observacion')?.value || '',
        activo: document.getElementById('editar-activo')?.checked ?? false
    };
    guardarDatosRRHH();
    actualizarPersonalDTH();
    mostrarToast("Empleado actualizado con éxito.");
    mostrarPanel('panel-lista-personal');
}

// ============================================
// --- Lógica de Cambio de Estado de Órdenes ---
// ============================================
function cambiarEstadoOrden(ordenId, nuevoEstado) {
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) return;
    orden.estado = nuevoEstado;
    function guardarOrdenesFirebase() {
    db.ref('ordenes').set(ordenes);
    }
    mostrarToast(`Orden ${orden.numero} marcada como ${nuevoEstado}.`);
    if (document.getElementById('panel-agendadas')?.classList.contains('active')) {
        aplicarFiltros();
    }
    renderTablaLiquidadas();
    renderTablaRechazadas();
}

function abrirMotivoRechazo(ordenId) {
    const modal = document.createElement('div');
    modal.id = 'modal-rechazo';
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;`;
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 350px; width: 90%;">
            <h3 style="margin-top: 0; text-align: center;">Motivo de Rechazo</h3>
            <div id="motivos-container" style="display: flex; flex-direction: column; gap: 8px; margin: 15px 0;">
                ${TIPOS_RECHAZO.map(motivo => `<button type="button" data-motivo="${motivo}" style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 6px; text-align: left; cursor: pointer; font-size: 14px; transition: all 0.2s;">${motivo}</button>`).join('')}
            </div>
            <div>
                <label for="observacion-rechazo" style="display: block; margin-bottom: 6px; font-weight: 600;">Observación (mínimo 5 caracteres):</label>
                <textarea id="observacion-rechazo" placeholder="Ej: Cliente no estaba en casa..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 5px; min-height: 60px;"></textarea>
                <div id="error-observacion" style="color: #dc3545; font-size: 0.85em; margin-top: 5px; display: none;">La observación es obligatoria.</div>
            </div>
            <div style="text-align: right; margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" id="btnCancelarRechazo" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Cancelar</button>
                <button type="button" id="btnAceptarRechazo" disabled style="background: #ccc; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: not-allowed;">Aceptar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const btnCancelar = document.getElementById('btnCancelarRechazo');
    const btnAceptar = document.getElementById('btnAceptarRechazo');
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalRechazo);
    if (btnAceptar) btnAceptar.addEventListener('click', () => guardarRechazo(ordenId));

    const motivosContainer = document.getElementById('motivos-container');
    if (motivosContainer) {
        motivosContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                seleccionarMotivoRechazo(ordenId, e.target.dataset.motivo);
                document.querySelectorAll('#motivos-container button').forEach(btn => {
                    btn.style.background = btn === e.target ? '#007bff' : '#f8f9fa';
                    btn.style.color = btn === e.target ? 'white' : 'black';
                });
            }
        });
    }

    const obsTextarea = document.getElementById('observacion-rechazo');
    if (obsTextarea) obsTextarea.addEventListener('input', validarObservacionRechazo);
}

function seleccionarMotivoRechazo(ordenId, motivo) {
    motivoSeleccionado = { ordenId, motivo };
    validarObservacionRechazo();
}

function validarObservacionRechazo() {
    const observacion = document.getElementById('observacion-rechazo')?.value.trim();
    const btnAceptar = document.getElementById('btnAceptarRechazo');
    if (!btnAceptar) return;
    if (observacion && observacion.length >= 5 && motivoSeleccionado) {
        btnAceptar.disabled = false;
        btnAceptar.style.cursor = 'pointer';
        btnAceptar.style.background = '#007bff';
    } else {
        btnAceptar.disabled = true;
        btnAceptar.style.cursor = 'not-allowed';
        btnAceptar.style.background = '#ccc';
    }
}

function guardarRechazo(ordenId) {
    if (!motivoSeleccionado || motivoSeleccionado.ordenId !== ordenId) {
        return mostrarToast("Seleccione un motivo de rechazo.", "error");
    }
    const observacion = document.getElementById('observacion-rechazo')?.value.trim();
    if (observacion.length < 5) {
        const errorEl = document.getElementById('error-observacion');
        if (errorEl) errorEl.style.display = 'block';
        return;
    }
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) return;
    orden.estado = "Rechazada";
    orden.motivoRechazo = motivoSeleccionado.motivo;
    orden.observacionRechazo = observacion;
    function guardarOrdenesFirebase() {
    db.ref('ordenes').set(ordenes);
    }
    mostrarToast(`Orden ${orden.numero} rechazada: ${motivoSeleccionado.motivo}`);
    cerrarModalRechazo();
    aplicarFiltros();
}

function cerrarModalRechazo() {
    const modal = document.getElementById('modal-rechazo');
    if (modal) modal.remove();
    motivoSeleccionado = null;
}

// ==============================
// --- Paneles Liquidadas y Rechazadas ---
// ==============================
function renderTablaLiquidadas(datos) {
    const tbody = document.querySelector("#tabla-liquidadas tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const liquidadas = datos || ordenes.filter(o => o.estado === "Liquidadas");
    if (liquidadas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay órdenes liquidadas.</td></tr>`;
        return;
    }
    liquidadas.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${o.numero}</td><td>${o.fecha}</td><td>${o.nombre}</td><td>${o.rut}</td><td>${o.direccion}</td><td>${o.tecnico}</td><td>Liquidadas</td>`;
        tbody.appendChild(tr);
    });
}

function renderTablaRechazadas(datos) {
    const tbody = document.querySelector("#tabla-rechazadas tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const rechazadas = datos || ordenes.filter(o => o.estado === "Rechazada");
    if (rechazadas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay órdenes rechazadas.</td></tr>`;
        return;
    }
    rechazadas.forEach(o => {
        const tr = document.createElement("tr");
        const motivoCompleto = o.observacionRechazo ? `${o.motivoRechazo} — ${o.observacionRechazo}` : o.motivoRechazo;
        tr.innerHTML = `<td>${o.numero}</td><td>${o.fecha}</td><td>${o.nombre}</td><td>${o.rut}</td><td>${o.direccion}</td><td>${o.tecnico}</td><td>${motivoCompleto}</td>`;
        tbody.appendChild(tr);
    });
}

function aplicarFiltroPorFecha(estado, renderFn) {
    const inicio = document.getElementById(`filtro-${estado.toLowerCase()}-inicio`)?.value;
    const fin = document.getElementById(`filtro-${estado.toLowerCase()}-fin`)?.value;
    let filtradas = ordenes.filter(o => o.estado === estado);
    if (inicio) filtradas = filtradas.filter(o => o.fecha >= inicio);
    if (fin) filtradas = filtradas.filter(o => o.fecha <= fin);
    renderFn(filtradas);
}

function limpiarFiltroPorFecha(estado, renderFn) {
    const inicioEl = document.getElementById(`filtro-${estado.toLowerCase()}-inicio`);
    const finEl = document.getElementById(`filtro-${estado.toLowerCase()}-fin`);
    if (inicioEl) inicioEl.value = '';
    if (finEl) finEl.value = '';
    renderFn();
}

function exportarExcelPorEstado(estado) {
    const datos = ordenes.filter(o => o.estado === estado);
    if (datos.length === 0) return mostrarToast(`No hay órdenes ${estado.toLowerCase()} para exportar.`, "error");
    const wb = XLSX.utils.book_new();
    const ws_data = datos.map(o => ({
        "N° Orden": o.numero, "Fecha": o.fecha, "Cliente": o.nombre, "RUT": o.rut,
        "Dirección": o.direccion, "Técnico": o.tecnico, "Estado": o.estado,
        "Motivo": o.motivoRechazo || "", "Observación": o.observacionRechazo || ""
    }));
    const ws = XLSX.utils.json_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, estado);
    XLSX.writeFile(wb, `Reporte_${estado}.xlsx`);
}

// ==============================
// --- REPORTES DE RRHH ---
// ==============================
function exportarExcelRRHH(tipo) {
    let empleadosFiltrados = appData.empleados;
    if (tipo === 'activo') empleadosFiltrados = appData.empleados.filter(e => e.activo);
    if (tipo === 'inactivo') empleadosFiltrados = appData.empleados.filter(e => !e.activo);
    if (empleadosFiltrados.length === 0) return mostrarToast("No hay empleados para exportar.", "error");
    const wb = XLSX.utils.book_new();
    const ws_data = empleadosFiltrados.map(e => {
        const cargo = appData.cargos.find(c => c.id === e.cargoId);
        const dpto = appData.departamentos.find(d => d.id === e.dptoId);
        return {
            "RUT": e.rut, "Nombre": `${e.nombre1} ${e.nombre2 || ''} ${e.apepaterno} ${e.apematerno}`.trim(),
            "Cargo": cargo ? cargo.nombre : '', "Departamento": dpto ? dpto.nombre : '',
            "Fecha Ingreso": e.fechaIngreso, "Teléfono": e.telefono || '', "Email": e.email || '',
            "Estado": e.activo ? "Activo" : "Inactivo"
        };
    });
    const ws = XLSX.utils.json_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "RRHH");
    XLSX.writeFile(wb, `Reporte_RRHH_${tipo}.xlsx`);
}

// =================================================================
// --- SECCIÓN DE REPORTES DE PRODUCCIÓN (CORREGIDA) ---
// =================================================================

let graficoTecnicos = null;

function aplicarFiltrosReporte() {
    const tecnico = document.getElementById('filtro-reporte-tecnico')?.value || '';
    const region = document.getElementById('filtro-reporte-region')?.value || '';
    const comuna = document.getElementById('filtro-reporte-comuna')?.value || '';
    const estado = document.getElementById('filtro-reporte-estado')?.value || '';
    const servicio = document.getElementById('filtro-reporte-servicio')?.value || '';
    const fechaInicio = document.getElementById('filtro-reporte-fecha-inicio')?.value || '';
    const fechaFin = document.getElementById('filtro-reporte-fecha-fin')?.value || '';

    datosReporteActual = ordenes.filter(d => 
        (!tecnico || d.tecnico === tecnico) && 
        (!region || d.region === region) &&
        (!comuna || d.comuna === comuna) && 
        (!estado || d.estado === estado) &&
        (!servicio || d.servicio === servicio) && 
        (!fechaInicio || d.fecha >= fechaInicio) &&
        (!fechaFin || d.fecha <= fechaFin)
    );
    
    renderizarPivotTable(datosReporteActual);
}

function renderizarPivotTable(datos) {
    const container = $("#pivot-table-container");

    // ===== CAMBIO CLAVE: MANEJO DE DATOS VACÍOS =====
    if (!datos || datos.length === 0) {
        // Limpia el contenedor y muestra un mensaje
        container.empty().append("<p style='text-align: center; color: #666; margin-top: 50px;'>No hay datos para mostrar con los filtros seleccionados.</p>");
        
        // Limpia también el gráfico
        if (graficoTecnicos) {
            graficoTecnicos.destroy();
            graficoTecnicos = null;
        }
        const canvas = document.getElementById('grafico-tecnicos');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return; // Detiene la ejecución para no llamar a pivotUI
    }
    // =================================================

    container.pivotUI(
        datos,
        {
            rows: ["tecnico"],
            cols: ["servicio", "estado"],
            aggregatorName: "Count",
            rendererName: "Table",
            onRefresh: function(config) {
                actualizarGraficoDesdePivot(config);
            }
        },
        true // sobreescribir
    );
}

function actualizarGraficoDesdePivot(pivotConfig) {
    const canvas = document.getElementById('grafico-tecnicos');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (graficoTecnicos) {
        graficoTecnicos.destroy();
        graficoTecnicos = null;
    }
    
    const pivotData = pivotConfig.data;
    const rowKeys = pivotData.getRowKeys();
    
    // Si no hay filas en la tabla pivote, no hay nada que graficar
    if (rowKeys.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const colKeys = pivotData.getColKeys();
    const labels = rowKeys.map(key => key.join('-') || 'Total');

    const datasets = colKeys.map((colKey) => {
        const label = colKey.join('-') || 'Total';
        const color = getColorForLabel(label);
        return {
            label: label,
            data: rowKeys.map(rowKey => pivotData.getAggregator(rowKey, colKey).value() || 0),
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`
        };
    });

    graficoTecnicos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                y: { beginAtZero: true, stacked: true, ticks: { stepSize: 1 } },
                x: { stacked: true }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

function getColorForLabel(label) {
    if (label.toLowerCase().includes('liquidada')) return { r: 40, g: 167, b: 69 };
    if (label.toLowerCase().includes('rechazada')) return { r: 220, g: 53, b: 69 };
    if (label.toLowerCase().includes('agendada')) return { r: 0, g: 123, b: 255 };
    
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return {
        r: (hash & 0xFF0000) >> 16,
        g: (hash & 0x00FF00) >> 8,
        b: hash & 0x0000FF
    };
}


function limpiarFiltrosReporte() {
    document.getElementById('filtro-reporte-tecnico').selectedIndex = 0;
    document.getElementById('filtro-reporte-region').selectedIndex = 0;
    document.getElementById('filtro-reporte-estado').selectedIndex = 0;
    document.getElementById('filtro-reporte-servicio').selectedIndex = 0;
    document.getElementById('filtro-reporte-fecha-inicio').value = '';
    document.getElementById('filtro-reporte-fecha-fin').value = '';
    document.getElementById('filtro-reporte-comuna').innerHTML = '<option value="">Todas</option>';
    aplicarFiltrosReporte();
    mostrarToast("Filtros limpiados.", "success");
}

function exportarReporteProduccion() {
    if (datosReporteActual.length === 0) {
        return mostrarToast("No hay datos para exportar.", "error");
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosReporteActual);
    XLSX.utils.book_append_sheet(wb, ws, "Produccion");
    XLSX.writeFile(wb, "Reporte_Produccion_Filtrado.xlsx");
    mostrarToast("Exportación generada.", "success");
}

// ============================================
// --- Persistencia y Carga de Datos ---
// ============================================
function actualizarPersonalDTH() {
    appData.personal.tecnicos = [];
    appData.personal.despacho = [];
    appData.empleados.forEach(emp => {
        if (emp.activo) {
            const cargo = appData.cargos.find(c => c.id === emp.cargoId);
            if (cargo) {
                const nombreCompleto = `${emp.nombre1} ${emp.apepaterno}`;
                if (cargo.nombre.toLowerCase().includes('tecnico') || cargo.nombre.toLowerCase().includes('técnico')) {
                    appData.personal.tecnicos.push(nombreCompleto);
                }
                if (cargo.nombre.toLowerCase().includes('despacho')) {
                    appData.personal.despacho.push(nombreCompleto);
                }
            }
        }
    });
    const despachoSelect = document.getElementById("orden-despacho");
    const tecnicoSelect = document.getElementById("orden-tecnico");
    if(despachoSelect) populateSelect(despachoSelect, appData.personal.despacho.map(d => ({ value: d, text: d })), "Seleccione Despacho");
    if(tecnicoSelect) populateSelect(tecnicoSelect, appData.personal.tecnicos.map(t => ({ value: t, text: t })), "Seleccione Técnico");
}

function guardarDatosRRHH() {
    localStorage.setItem("rrhhData", JSON.stringify({
        cargos: appData.cargos, departamentos: appData.departamentos, empleados: appData.empleados
    }));
}

function cargarDatos() {
    // 1. Cargar datos de RRHH desde localStorage
    const rrhhData = localStorage.getItem("rrhhData");
    if (rrhhData) {
        const datos = JSON.parse(rrhhData);
        appData.cargos = datos.cargos || [];
        appData.departamentos = datos.departamentos || [];
        appData.empleados = datos.empleados || [];
    } else {
        appData.cargos = [{ id: 'cargo-1', nombre: 'Técnico' }, { id: 'cargo-2', nombre: 'Despacho' }];
        appData.departamentos = [{ id: 'dpto-1', nombre: 'Operaciones' }];
    }

    // 2. Cargar órdenes desde localStorage (para pruebas locales)
    const ordenesGuardadas = localStorage.getItem("ordenes"); // ✅ Ahora SÍ está definida
    if (ordenesGuardadas) {
        ordenes = JSON.parse(ordenesGuardadas);
    }

    // 3. (Opcional) Si usas Firebase, descomenta esto:
    /*
    db.ref('ordenes').once('value', (snapshot) => {
        ordenes = snapshot.val() || [];
        // Aquí podrías refrescar las tablas si es necesario
    });
    */
}

// ============================================
// --- Funciones Auxiliares y Arranque ---
// ============================================
function populateSelect(selectElement, optionsArray, placeholder) {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">-- ${placeholder} --</option>`;
    optionsArray.forEach(item => {
        let opt = document.createElement("option");
        opt.value = typeof item === 'object' ? item.value : item;
        opt.textContent = typeof item === 'object' ? item.text : item;
        selectElement.appendChild(opt);
    });
}

// ============================================
// --- INICIALIZACIÓN DE LA APLICACIÓN ---
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    actualizarPersonalDTH();

    const safeAddListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    document.querySelectorAll('#main-nav button[data-module]').forEach(button => {
        button.addEventListener('click', () => seleccionarModulo(button.dataset.module));
    });
    document.querySelectorAll('#sidebar button[data-panel]').forEach(button => {
        button.addEventListener('click', () => mostrarPanel(button.dataset.panel));
    });

    safeAddListener('btnLogin', 'click', login);
    safeAddListener('btnValidarOrden', 'click', validarNumeroOrden);
    safeAddListener('btnBuscarPorOrden', 'click', buscarPorOrden);
    safeAddListener('btnBuscarPorRut', 'click', buscarPorRut);
    safeAddListener('btnAgregarCargo', 'click', agregarCargo);
    safeAddListener('btnAgregarDpto', 'click', agregarDepartamento);
    safeAddListener('btnCancelarEdicion', 'click', () => mostrarPanel('panel-lista-personal'));
    safeAddListener('btnResetFiltros', 'click', resetFiltros);
    safeAddListener('btnEnviarCorreo', 'click', enviarPorCorreo);
    safeAddListener('btnEnviarWhatsapp', 'click', enviarPorWhatsapp);
    safeAddListener('btnExportarExcel', 'click', exportarExcel);
    safeAddListener('btnFiltrarLiquidadas', 'click', () => aplicarFiltroPorFecha('Liquidadas', renderTablaLiquidadas));
    safeAddListener('btnLimpiarFiltroLiquidadas', 'click', () => limpiarFiltroPorFecha('Liquidadas', renderTablaLiquidadas));
    safeAddListener('btnExportarExcelLiquidadas', 'click', () => exportarExcelPorEstado('Liquidadas'));
    safeAddListener('btnFiltrarRechazadas', 'click', () => aplicarFiltroPorFecha('Rechazada', renderTablaRechazadas));
    safeAddListener('btnLimpiarFiltroRechazadas', 'click', () => limpiarFiltroPorFecha('Rechazada', renderTablaRechazadas));
    safeAddListener('btnExportarExcelRechazadas', 'click', () => exportarExcelPorEstado('Rechazada'));
    safeAddListener('btnAplicarFiltrosReporte', 'click', aplicarFiltrosReporte);
    safeAddListener('btnLimpiarFiltrosReporte', 'click', limpiarFiltrosReporte);
    safeAddListener('btnExportarReporteProduccion', 'click', exportarReporteProduccion);

    const formNuevoIngreso = document.getElementById('form-nuevo-ingreso');
    const formIngresoOrden = document.getElementById('form-ingreso-orden');
    const formEditarEmpleado = document.getElementById('form-editar-empleado');
    if (formNuevoIngreso) formNuevoIngreso.addEventListener('submit', guardarNuevoEmpleado);
    if (formIngresoOrden) formIngresoOrden.addEventListener('submit', guardarOrden);
    if (formEditarEmpleado) formEditarEmpleado.addEventListener('submit', guardarEdicionEmpleado);

    const reportesRRHH = document.querySelector('#reportes-rrhh .report-buttons');
    if (reportesRRHH) {
        reportesRRHH.addEventListener('click', (e) => {
            if (e.target.dataset.reportType) exportarExcelRRHH(e.target.dataset.reportType);
        });
    }
    // Formularios de Logística (evitar recarga)
    ['form-ingreso-seriados', 'form-ingreso-no-seriados', 'form-asignacion', 'form-transferencia', 'form-devolucion'].forEach(id => {
        const form = document.getElementById(id);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                mostrarToast("Funcionalidad en desarrollo.", "info");
            });
        }
    });

    // Botón de Guía de Salida
    const btnGuia = document.getElementById('btn-generar-guia');
    if (btnGuia) {
        btnGuia.addEventListener('click', () => {
            mostrarToast("Generando guía de salida...", "info");
        });
    }
    ['orden-rut', 'emp-rut', 'editar-rut'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', (e) => validarRutInput(e.target));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && document.getElementById('login-container').style.display !== 'none') {
            event.preventDefault();
            login();
        }
    });
});
