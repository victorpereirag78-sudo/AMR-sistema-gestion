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
    empleados: [],
    articulos: {
        seriados: [],
        ferreteria: []
    },
    ingresosSeriados: [],
    ingresosTarjetas: []    
};
let motivoSeleccionado = null;
let ordenes = [];
let paginaActual = 1;
const filasPorPagina = 10;
const TIPOS_RECHAZO = ["Cliente rechaza", "Sin moradores", "Direccion erronea", "Orden mal generada", "Servicio operativo"];
let datosReporteActual = [];
let timeoutBienvenida = null;
function esFechaFutura(fechaStr) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fechaIngreso = new Date(anio, mes - 1, dia);
    fechaIngreso.setHours(0, 0, 0, 0);
    return fechaIngreso >= hoy;
}

function generarSufijoPorRegion(regionId) {
    return regionId === "14" ? "-R" : "-L";
}

function esCargoTecnico(nombre) {
    if (!nombre) return false;
    const normalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalizado.includes('tecnico');
}

function normalizarSerie(serie) {
    if (!serie) return '';
    return serie.toString().trim().replace(/\s+/g, '');
}

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
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    mostrarPanel('modulo-bienvenida');
    const imagenModulo = document.getElementById('imagen-modulo');
    const tituloModulo = document.getElementById('titulo-modulo');
    if (imagenModulo) {
        imagenModulo.src = 'Volcan.jpg';
        imagenModulo.style.opacity = '1';
    }
    if (tituloModulo) {
        tituloModulo.textContent = 'Bienvenido al modulo de servicios ARM';
        tituloModulo.style.opacity = '1';
    }
}

function seleccionarModulo(moduloId) {
    if (timeoutBienvenida) {
        clearTimeout(timeoutBienvenida);
        timeoutBienvenida = null;
    }
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    const botonActivo = document.querySelector(`#main-nav button[data-module="${moduloId}"]`);
    if (botonActivo) botonActivo.classList.add('active');
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    const submenuActivo = document.getElementById(`submenu-${moduloId}`);
    if (submenuActivo) submenuActivo.classList.add('active');
    mostrarPanel('modulo-bienvenida');
}

function mostrarPanel(panelId) {
    document.querySelectorAll('#main-content .content-panel').forEach(p => p.classList.remove('active'));
    const panelActivo = document.getElementById(panelId);
    if (!panelActivo) {
        console.error(`Panel no encontrado: ${panelId}`);
        return;
    }
    panelActivo.classList.add('active');
    document.querySelectorAll('#main-content .content-panel').forEach(p => {
        p.style.display = (p.id === panelId) ? 'block' : 'none';
    });
    if (panelId === 'modulo-bienvenida') {
        const moduloActivo = document.querySelector('#main-nav button.active')?.dataset.module;
        if (moduloActivo) {
            const imagenModulo = document.getElementById('imagen-modulo');
            const tituloModulo = document.getElementById('titulo-modulo');
            let imgSrc = '';
            let titulo = '';
            switch (moduloActivo) {
                case 'dth':
                    imgSrc = 'img AMR/Parque-Chuyaca.jpg';
                    titulo = 'Operaciones de Terreno (DTH)';
                    break;
                case 'rrhh':
                    imgSrc = 'img AMR/Iluminada.jpg';
                    titulo = 'Recursos Humanos';
                    break;
                case 'avance':
                    imgSrc = 'img AMR/Toro.jpg';
                    titulo = 'Reportes y Análisis';
                    break;
                case 'logistica':
                    imgSrc = 'img AMR/Plaza-Osorno.jpg';
                    titulo = 'Gestión Logística';
                    break;
                default:
                    imgSrc = 'img AMR/Osorno1.jpg';
                    titulo = 'Bienvenido a Tu Empresa';
            }
            if (imagenModulo) {
                imagenModulo.src = imgSrc;
                imagenModulo.style.opacity = imgSrc ? '1' : '0';
            }
            if (tituloModulo) {
                tituloModulo.textContent = titulo;
                tituloModulo.style.opacity = '1';
            }
        }
        return;
    }
    switch (panelId) {
        case 'panel-ingreso-cliente':
            resetFormularioOrden();
            break;
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
        case 'panel-ingreso-cliente':resetFormularioOrden(); break;
        case 'panel-gestion-cargos': renderGestionCargos(); break;
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
        case 'panel-buscar-colaborador':
            const inputBusqueda = document.getElementById('buscar-colab-input');
            const resultadoBusqueda = document.getElementById('resultado-busqueda-colab');
            if (inputBusqueda) inputBusqueda.value = '';
            if (resultadoBusqueda) resultadoBusqueda.innerHTML = '';
            break;
        case 'panel-creacion-articulos':
            const formCrear = document.getElementById('form-crear-articulo');
            if (formCrear) {
                formCrear.style.display = 'none';
                formCrear.reset();
            }
            break;
        case 'panel-saldo-tecnico':
            setupSaldoTecnico();
            break;
    }
}
// ============================================
// --- Lógica del Formulario de Ingreso DTH ---
// ============================================
function validarNumeroOrden() {
    const numeroInput = document.getElementById('orden-numero');
    const numero = numeroInput?.value.trim();
    if (!numero) return mostrarToast("Por favor, ingrese un número de orden.", "error");
    document.getElementById('paso-1').style.display = 'none';
    document.getElementById('paso-2').style.display = 'block';
    const regionSelect = document.getElementById('orden-region');
    if (!regionSelect) {
        console.error("❌ No se encontró el select 'orden-region'");
        return;
    }
    regionSelect.disabled = false;
    populateSelect(regionSelect, Object.keys(appData.regiones).map(num => ({
        value: num,
        text: appData.regiones[num].nombre
    })), "Seleccione Región");
    regionSelect.value = '';
    console.log("✅ Regiones recargadas:", regionSelect.options.length, "opciones");
}

function validarCombinacion() {
    const numero = document.getElementById('orden-numero')?.value.trim();
    const regionId = document.getElementById('orden-region')?.value;
    if (!regionId) return mostrarToast("Seleccione una región.", "error");
    const sufijo = generarSufijoPorRegion(regionId);
    const numeroConSufijo = numero + sufijo;
    if (ordenes.some(o => o.numero === numeroConSufijo)) {
        return mostrarToast(`La orden ${numeroConSufijo} ya existe.`, "error");
    }
    document.getElementById('paso-2').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'block';
    document.getElementById('orden-numero').value = numeroConSufijo;
    document.getElementById('orden-region').value = regionId;
    document.getElementById('orden-numero').disabled = true;
    document.getElementById('orden-region').disabled = true;
    const tituloIngreso = document.getElementById('titulo-ingreso-orden');
    if (tituloIngreso) {
        tituloIngreso.textContent = `Ingreso Orden: ${numeroConSufijo}`;
    }
    const comunaSelect = document.getElementById('orden-comuna');
    if (comunaSelect) {
        cargarComunas(comunaSelect, document.getElementById('orden-region'));
    }
    const servicioSelect = document.getElementById('orden-servicio');
    const subServicioSelect = document.getElementById('orden-sub');
    if (servicioSelect) {
        populateSelect(servicioSelect, Object.keys(appData.servicios).map(s => ({
            value: s,
            text: s
        })), "Seleccione Servicio");
        if (subServicioSelect) {
            subServicioSelect.innerHTML = '<option value="">-- Seleccione Subservicio --</option>';
        }
        servicioSelect.onchange = () => cargarSubServicio(subServicioSelect, servicioSelect);
    }
    actualizarPersonalDTH();
    document.getElementById('orden-rut')?.focus();
}

function validarRutChileno(rutCompleto) {
    const rutLimpio = rutCompleto.replace(/\./g, '');
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rutLimpio)) return false;
    let [cuerpo, dv] = rutLimpio.split('-');
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * cuerpo.charAt(i);
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    dv = (dv.toLowerCase() === 'k') ?
    10 : parseInt(dv, 10);
    return dvEsperado === 11 ? dv === 0 : dvEsperado === 10 ?
    dv === 10 : dv === dvEsperado;
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
    const tituloIngreso = document.getElementById('titulo-ingreso-orden');
    if (tituloIngreso) {
        tituloIngreso.textContent = 'Ingreso Orden';
    }
    const form = document.getElementById('form-ingreso-orden');
    if (form) {
        form.reset();
        form.style.display = 'none';
    }
    document.getElementById('paso-1').style.display = 'block';
    document.getElementById('paso-2').style.display = 'none';
    const numInput = document.getElementById('orden-numero');
    if (numInput) {
        numInput.value = '';
        numInput.disabled = false;
    }
    const regionSelect = document.getElementById('orden-region');
    if (regionSelect) {
        regionSelect.value = '';
        regionSelect.disabled = false;
    }
    const comunaSelect = document.getElementById('orden-comuna');
    const subServicioSelect = document.getElementById('orden-sub');
    if (comunaSelect) comunaSelect.innerHTML = '<option value="">-- Seleccione Comuna --</option>';
    if (subServicioSelect) subServicioSelect.innerHTML = '<option value="">-- Seleccione Subservicio --</option>';
    const rutInput = document.getElementById('orden-rut');
    if (rutInput) rutInput.classList.remove('valid', 'invalid');
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
    const regionNombre = regionId ? appData.regiones[regionId]?.nombre : '';
    const comuna = document.getElementById('orden-comuna')?.value;
    const servicio = document.getElementById('orden-servicio')?.value;
    const subServicio = document.getElementById('orden-sub')?.value;
    const fecha = document.getElementById('orden-fecha')?.value;
    const tecnico = document.getElementById('orden-tecnico')?.value;
    const despacho = document.getElementById('orden-despacho')?.value;
    const observacion = document.getElementById('orden-observacion')?.value.trim();
    if (!numero || !rut || !nombre || !direccion || !regionId || !comuna || !servicio || !subServicio || !fecha || !despacho) {
    return mostrarToast("Todos los campos marcados son obligatorios (excepto Técnico).", "error");
    }
    if (!validarRutChileno(rut)) return mostrarToast("RUT inválido.", "error");
    if (!esFechaFutura(fecha)) {
        return mostrarToast("La fecha de ingreso debe ser hoy o futura.", "error");
    }
    const nuevaOrden = {
        id: `orden-${Date.now()}`,
        numero,
        rut,
        nombre,
        direccion,
        numeroContacto,
        region: regionNombre,
        comuna,
        servicio,
        subServicio,
        fecha,
        tecnico,
        despacho,
        observacion,
        estado: 'Agendada'
    };
    ordenes.unshift(nuevaOrden);
    localStorage.setItem('ordenes', JSON.stringify(ordenes));
    mostrarToast(`Orden N° ${numero} guardada con éxito.`, "success");
    resetFormularioOrden();
    mostrarPanel('panel-agendadas');
}
function abrirEdicionOrden(ordenId) {
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) {
        mostrarToast("Error: No se encontró la orden.", "error");
        return;
    }
    document.getElementById('titulo-editar-orden').textContent = `Editar Orden`;
    document.getElementById('editar-orden-numero-display').textContent = orden.numero;
    document.getElementById('editar-orden-id').value = orden.id;
    document.getElementById('editar-orden-rut').value = orden.rut;
    document.getElementById('editar-orden-nombre').value = orden.nombre;
    document.getElementById('editar-orden-direccion').value = orden.direccion;
    document.getElementById('editar-numeroContacto').value = orden.numeroContacto || '';
    document.getElementById('editar-orden-fecha').value = orden.fecha;
    document.getElementById('editar-orden-observacion').value = orden.observacion;
    const regionSelect = document.getElementById('editar-orden-region');
    populateSelect(regionSelect, Object.keys(appData.regiones).map(num => ({
        value: num,
        text: appData.regiones[num].nombre
    })), "Seleccione Región");
    
    const servicioSelect = document.getElementById('editar-orden-servicio');
    populateSelect(servicioSelect, Object.keys(appData.servicios).map(s => ({
        value: s,
        text: s
    })), "Seleccione Servicio");
    populateSelect(document.getElementById('editar-orden-tecnico'), appData.personal.tecnicos.map(t => ({ value: t, text: t })), "Seleccione Técnico");
    populateSelect(document.getElementById('editar-orden-despacho'), appData.personal.despacho.map(d => ({ value: d, text: d })), "Seleccione Despacho");
    const regionKey = Object.keys(appData.regiones).find(key => appData.regiones[key].nombre === orden.region);
    regionSelect.value = regionKey || "";
    servicioSelect.value = orden.servicio;
    document.getElementById('editar-orden-tecnico').value = orden.tecnico;
    document.getElementById('editar-orden-despacho').value = orden.despacho;
    const comunaSelect = document.getElementById('editar-orden-comuna');
    cargarComunas(comunaSelect, regionSelect);
    comunaSelect.value = orden.comuna;
    const subServicioSelect = document.getElementById('editar-orden-sub');
    cargarSubServicio(subServicioSelect, servicioSelect);
    subServicioSelect.value = orden.subServicio;
    regionSelect.onchange = () => cargarComunas(comunaSelect, regionSelect);
    servicioSelect.onchange = () => cargarSubServicio(subServicioSelect, servicioSelect);
    mostrarPanel('panel-editar-orden');
}

function guardarEdicionOrden(event) {
    event.preventDefault();
    const id = document.getElementById('editar-orden-id').value;
    const ordenIndex = ordenes.findIndex(o => o.id === id);
    if (ordenIndex === -1) {
        mostrarToast("Error: No se pudo encontrar la orden para guardar.", "error");
        return;
    }
    const rut = document.getElementById('editar-orden-rut').value.trim();
    const fecha = document.getElementById('editar-orden-fecha').value;
    const regionSelect = document.getElementById('editar-orden-region');
    const regionId = regionSelect.value;
    const regionNombre = regionId ? regionSelect.options[regionSelect.selectedIndex].text : '';
    if (!validarRutChileno(rut)) {
        return mostrarToast("El RUT ingresado no es válido.", "error");
    }
    if (!esFechaFutura(fecha)) {
        return mostrarToast("La fecha de instalación no puede ser anterior a hoy.", "error");
    }
    ordenes[ordenIndex] = {
        ...ordenes[ordenIndex],
        rut: rut,
        nombre: document.getElementById('editar-orden-nombre').value.trim(),
        direccion: document.getElementById('editar-orden-direccion').value.trim(),
        numeroContacto: document.getElementById('editar-numeroContacto').value.trim(),
        region: regionNombre,
        comuna: document.getElementById('editar-orden-comuna').value,
        servicio: document.getElementById('editar-orden-servicio').value,
        subServicio: document.getElementById('editar-orden-sub').value,
        fecha: fecha,
        tecnico: document.getElementById('editar-orden-tecnico').value,
        despacho: document.getElementById('editar-orden-despacho').value,
        observacion: document.getElementById('editar-orden-observacion').value.trim()
    };
    localStorage.setItem('ordenes', JSON.stringify(ordenes));
    mostrarToast("Orden actualizada con éxito.", "success");
    mostrarPanel('panel-agendadas');
}

// ============================================
// --- Lógica del Panel "Agendadas" y Filtros ---
// ============================================
function renderTablaAgendadas(datos) {
    const tbody = document.querySelector("#tabla-agendadas tbody");
    if (!tbody) return;
    const datosParaMostrar = datos || ordenes.filter(o => o.estado === 'Agendada');
    tbody.innerHTML = "";
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
            <td><button class="btn-link-orden" data-id="${o.id}">${o.numero}</button></td>
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
    tbody.querySelectorAll('.btn-link-orden').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirEdicionOrden(btn.dataset.id);
        });
    });
    tbody.querySelectorAll('.btn-liquidar').forEach(btn => {
        btn.addEventListener('click', () => cambiarEstadoOrden(btn.dataset.id, "Liquidadas"));
    });
    tbody.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', () => abrirMotivoRechazo(btn.dataset.id));
    });
    const totalPaginas = Math.ceil(datosParaMostrar.length / filasPorPagina);
    const cont = document.getElementById("paginacion");
    if (cont) {
        cont.innerHTML = "";
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
    if (filas.length === 0 || filas[0].children.length < 2)
        return mostrarToast("No hay órdenes para enviar.", "error");

    let cuerpo = `Hola ${tecnico.nombre1},Tienes las siguientes órdenes asignadas:`;

    filas.forEach((fila, index) => {
        const numero = fila.children[0].textContent;
        const fecha = fila.children[1].textContent;
        const subservicio = fila.children[2].textContent;
        const cliente = fila.children[3].textContent;
        const direccion = fila.children[5].textContent;
        const comuna = fila.children[6].textContent;
        const servicio = ordenes.find(o => o.numero === numero)?.servicio || '—';
        cuerpo += `${index + 1}. Orden #${numero}
    Fecha: ${fecha}
    Servicio: ${servicio}
    Subservicio: ${subservicio}
    Cliente: ${cliente}
    Dirección: ${direccion}
    Comuna: ${comuna}
    `;
    });
    cuerpo += "Saludos.";
    const templateParams = {
        to_email: tecnico.email,
        to_name: tecnico.nombre1,
        subject: "Tus Órdenes de Trabajo – Sistema de Gestión",
        message: cuerpo
    };
    emailjs.send('service_8p2y4a6', 'template_m8313jl', templateParams)
        .then(() => {
            mostrarToast(`Correo enviado correctamente a ${tecnico.email}.`, "success");
        })
        .catch((error) => {
            console.error("Error al enviar correo:", error);
            mostrarToast("No se pudo enviar el correo. Revisar consola.", "error");
        });
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

    let mensaje = `Hola ${tecnico.nombre1}, tienes las siguientes órdenes:\n\n`;

    filas.forEach(fila => {
        const numeroOrden = fila.children[0].textContent;
        const fecha = fila.children[1].textContent;
        const subservicio = fila.children[2].textContent;
        const cliente = fila.children[3].textContent;
        const direccion = fila.children[5].textContent;
        const comuna = fila.children[6].textContent;
        const servicio = ordenes.find(o => o.numero === numeroOrden)?.servicio || '—';

        mensaje += `• Orden #${numeroOrden}
    Fecha: ${fecha}
    Servicio: ${servicio}
    Subservicio: ${subservicio}
    Cliente: ${cliente}
    Dirección: ${direccion}
    Comuna: ${comuna}

`;
    });
    mensaje += "¡Éxito en el terreno!";
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

function buscarColaborador() {
    const input = document.getElementById('buscar-colab-input');
    const resultadoDiv = document.getElementById('resultado-busqueda-colab');
    if (!input || !resultadoDiv) return;
    const termino = input.value.trim();
    if (!termino) return mostrarToast("Ingrese un RUT o nombre para buscar.", "error");
    const resultados = appData.empleados.filter(emp => {
        const nombreCompleto = `${emp.nombre1} ${emp.nombre2 || ''} ${emp.apepaterno} ${emp.apematerno}`.toLowerCase();
        return emp.rut.includes(termino) || nombreCompleto.includes(termino.toLowerCase());
    });
    if (resultados.length === 0) {
        resultadoDiv.innerHTML = `<p style="color:#dc3545;">No se encontraron colaboradores con ese criterio.</p>`;
        return;
    }

    let html = `<h3>Resultados (${resultados.length})</h3>`;
    resultados.forEach(emp => {
        const cargo = appData.cargos.find(c => c.id === emp.cargoId)?.nombre || 'Sin cargo';
        
        html += `
            <div style="background:#f8f9fa; padding:16px; border-radius:10px; margin:12px 0; border-left:4px solid #007bff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4 style="margin-top:0; color:#333;">${emp.nombre1} ${emp.nombre2 || ''} ${emp.apepaterno} ${emp.apematerno}</h4>
            <p><strong>RUT:</strong> ${emp.rut}</p>
                <p><strong>Teléfono:</strong> ${emp.telefono || '—'}</p>
                <p><strong>Email:</strong> ${emp.email || '—'}</p>
                <p><strong>Dirección:</strong> ${emp.direccion || '—'}</p>
                <p><strong>Región:</strong> ${emp.region || '—'}</p>
                <p><strong>Comuna:</strong> ${emp.comuna || '—'}</p>
                <p><strong>Fecha de Nacimiento:</strong> ${emp.fechaNacimiento || '—'}</p>
                <p><strong>Cargo:</strong> ${cargo}</p>
                <p><strong>Fecha de Ingreso:</strong> ${emp.fechaIngreso ||'—'}</p>
                <p><strong>Estado:</strong> ${emp.activo ?'✅ Activo' : '❌ Inactivo'}</p>${emp.observacion ?`
                <p><strong>Observaciones:</strong> ${emp.observacion}</p>` : ''}
                <button class="btn-editar-colab" data-id="${emp.id}" style="margin-top:12px; background:#007bff; color:white; border:none; padding:8px 16px; border-radius:5px; cursor:pointer;">
                    ✏️ Editar
                </button>
            </div>
        `;
    });
    resultadoDiv.innerHTML = html;
    resultadoDiv.querySelectorAll('.btn-editar-colab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            abrirEdicionEmpleado(e.target.dataset.id);
        });
    });
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
            <td>
                <div class="acciones-celda">
                    <button class="btn-editar" data-id="${emp.id}">✏️ Editar</button>
                    <label class="switch">
                        <input type="checkbox"class="toggle-activo" data-id="${emp.id}" ${emp.activo ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span class="estado-texto">${emp.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
});
    tbody.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicionEmpleado(btn.dataset.id));
    });
    document.querySelectorAll('.toggle-activo').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const id = this.dataset.id;
            const empleado = appData.empleados.find(e => e.id === id);
            if (empleado) {
                empleado.activo = this.checked;
                guardarDatosRRHH();
                actualizarPersonalDTH();
                mostrarToast(`Colaborador ${empleado.activo ? 'activado' : 'desactivado'} con éxito.`);
            }
        });
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
    const cargosEsenciales = [
        'cargo-tecnico', 'cargo-despacho', 'cargo-supervisor',
        'cargo-enc-bodega', 'cargo-enc-rrhh', 'cargo-jefatura', 'cargo-admin'
    ];
    if (cargosEsenciales.includes(cargoId)) {
        return mostrarToast("No se puede eliminar este cargo esencial.", "error");
    }
    if (appData.empleados.some(emp => emp.cargoId === cargoId)) {
        return mostrarToast("No se puede eliminar, el cargo está en uso por un colaborador.", "error");
    }
    if (confirm("¿Está seguro de que desea eliminar este cargo?")) {
        appData.cargos = appData.cargos.filter(c => c.id !== cargoId);
        guardarDatosRRHH();
        renderGestionCargos();
        mostrarToast("Cargo eliminado.");
    }
}

function setupFormularioNuevoIngreso() {
    const empCargo = document.getElementById('emp-cargo');
    const grupoLicencia = document.getElementById('grupo-licencia-tecnico');
    const fechaLicencia = document.getElementById('emp-fecha-vencimiento-licencia');

    if (empCargo) {
        populateSelect(empCargo, appData.cargos.map(c => ({ value: c.id, text: c.nombre })), "Seleccione Cargo");
        empCargo.addEventListener('change', () => {
            const cargoSeleccionado = appData.cargos.find(c => c.id === empCargo.value);
            const esTecnico = cargoSeleccionado && esCargoTecnico(cargoSeleccionado.nombre);
            if (esTecnico) {
                grupoLicencia.style.display = 'block';
                fechaLicencia.setAttribute('required', 'required');
            
            } else {
                grupoLicencia.style.display = 'none';
                fechaLicencia.removeAttribute('required');
                fechaLicencia.value = '';
            }
        });
    }
}

function guardarNuevoEmpleado(event) {
    event.preventDefault();
    const rut = document.getElementById('emp-rut')?.value.trim();
    if (!rut || !validarRutChileno(rut)) return mostrarToast("El RUT es obligatorio y debe ser válido.", "error");
    if (appData.empleados.some(e => e.rut === rut)) return mostrarToast("El RUT ya está registrado.", "error");
    const cargoId = document.getElementById('emp-cargo')?.value;
    if (!cargoId) return mostrarToast("Debe seleccionar un cargo.", "error");
    const fechaNac = document.getElementById('emp-fecha-nac')?.value;
    if (!fechaNac) return mostrarToast("La fecha de nacimiento es obligatoria.", "error");
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    if (edad < 18) return mostrarToast("La persona debe tener al menos 18 años.", "error");
    const cargoSeleccionado = appData.cargos.find(c => c.id === cargoId);
    const esTecnico = cargoSeleccionado && esCargoTecnico(cargoSeleccionado.nombre);
    if (esTecnico) {
        const fechaLicencia = document.getElementById('emp-fecha-vencimiento-licencia')?.value;
        if (!fechaLicencia) return mostrarToast("Debe ingresar la fecha de vencimiento de la licencia de conducir.", "error");
    }

    const nuevoEmpleado = {
        id: `emp-${Date.now()}`,
        nombre1: document.getElementById('emp-nombre1')?.value ||'',
        nombre2: document.getElementById('emp-nombre2')?.value ||'',
        apepaterno: document.getElementById('emp-apepaterno')?.value ||'',
        apematerno: document.getElementById('emp-apematerno')?.value ||'',
        rut,
        telefono: document.getElementById('emp-telefono')?.value ||'',
        direccion: document.getElementById('emp-direccion')?.value ||'',
        region: document.getElementById('emp-region')?.value ||'',
        comuna: document.getElementById('emp-comuna')?.value ||'',
        fechaNacimiento: fechaNac,
        email: document.getElementById('emp-email')?.value ||'',
        cargoId,
        fechaIngreso: document.getElementById('emp-fecha-ingreso')?.value ||'',
        observacion: document.getElementById('emp-observacion')?.value ||'',
        activo: true,
        fechaVencimientoLicencia: esTecnico ?
        document.getElementById('emp-fecha-vencimiento-licencia')?.value : null,
        stock: { equipos: [], tarjetas: [] }
    };
    appData.empleados.push(nuevoEmpleado);
    guardarDatosRRHH();
    mostrarToast("Colaborador guardado con éxito.");
    if (esTecnico) cargarTecnicosAsignacion();
    document.getElementById('form-nuevo-ingreso').reset();
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
    populateSelect(document.getElementById('editar-cargo'), appData.cargos.map(c => ({ value: c.id, text: c.nombre })), "Seleccione Cargo");
    populateSelect(document.getElementById('editar-region'), Object.keys(appData.regiones).map(num => ({ value: num, text: appData.regiones[num].nombre })), "Seleccione Región");
    document.getElementById('editar-cargo').value = empleado.cargoId;
    const regionKey = Object.keys(appData.regiones).find(num => appData.regiones[num].nombre === empleado.region) || '';
    document.getElementById('editar-region').value = regionKey;
    const regionSelect = document.getElementById('editar-region');
    const comunaSelect = document.getElementById('editar-comuna');
    regionSelect.onchange = () => {
        cargarComunas(comunaSelect, regionSelect);
        comunaSelect.value = '';
    };
    cargarComunas(comunaSelect, regionSelect);
    setTimeout(() => {
        comunaSelect.value = empleado.comuna || '';
    }, 10);
    const grupoLicenciaEdit = document.getElementById('grupo-licencia-tecnico-edit');
    const fechaLicenciaEdit = document.getElementById('editar-fecha-vencimiento-licencia');
    const esTecnico = appData.cargos.some(c => c.id === empleado.cargoId && c.nombre.toLowerCase().includes('tecnico'));
    if (esTecnico && empleado.fechaVencimientoLicencia) {
        grupoLicenciaEdit.style.display = 'block';
        fechaLicenciaEdit.value = empleado.fechaVencimientoLicencia;
    } else {
        grupoLicenciaEdit.style.display = 'none';
        fechaLicenciaEdit.value = '';
    }
    mostrarPanel('panel-editar-empleado');
}

function guardarEdicionEmpleado(event) {
    event.preventDefault();
    const id = document.getElementById('editar-empleado-id')?.value;
    const rut = document.getElementById('editar-rut')?.value.trim();
    if (!id) return mostrarToast("Error: ID no válido.", "error");
    if (!rut || !validarRutChileno(rut)) return mostrarToast("RUT inválido.", "error");
    if (appData.empleados.some(e => e.rut === rut && e.id !== id)) {
        return mostrarToast("El RUT ya está registrado en otro colaborador.", "error");
    }
    const index = appData.empleados.findIndex(e => e.id === id);
    if (index === -1) return mostrarToast("Colaborador no encontrado.", "error");

    const fechaNac = document.getElementById('editar-fecha-nac')?.value;
    if (fechaNac) {
        const hoy = new Date();
        const nacimiento = new Date(fechaNac);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        if (edad < 18) {
            return mostrarToast("La persona debe tener al menos 18 años.", "error");
        }
    }

    const cargoId = document.getElementById('editar-cargo')?.value;
    const cargoSeleccionado = appData.cargos.find(c => c.id === cargoId);
    const esTecnico = cargoSeleccionado && esCargoTecnico(cargoSeleccionado.nombre);
    let fechaVencimientoLicencia = null;
    if (esTecnico) {
        fechaVencimientoLicencia = document.getElementById('editar-fecha-vencimiento-licencia')?.value;
        if (!fechaVencimientoLicencia) {
            return mostrarToast("Debe ingresar la fecha de vencimiento de la licencia de conducir.", "error");
        }
    }

    appData.empleados[index] = {
        ...appData.empleados[index],
        nombre1: document.getElementById('editar-nombre1')?.value ||'',
        nombre2: document.getElementById('editar-nombre2')?.value || '',
        apepaterno: document.getElementById('editar-apepaterno')?.value ||'',
        apematerno: document.getElementById('editar-apematerno')?.value || '',
        rut,
        telefono: document.getElementById('editar-telefono')?.value ||'',
        direccion: document.getElementById('editar-direccion')?.value || '',
        region: document.getElementById('editar-region')?.options[document.getElementById('editar-region')?.selectedIndex]?.text ||'',
        comuna: document.getElementById('editar-comuna')?.value || '',
        fechaNacimiento: fechaNac ||
        appData.empleados[index].fechaNacimiento,
        email: document.getElementById('editar-email')?.value || '',
        cargoId,
        fechaIngreso: document.getElementById('editar-fecha-ingreso')?.value || '',
        observacion: document.getElementById('editar-observacion')?.value || '',
        fechaVencimientoLicencia
    };

    guardarDatosRRHH();
    actualizarPersonalDTH();
    mostrarToast("Colaborador actualizado con éxito.");
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
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
z-index: 2000;`;
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 350px; width: 90%;">
            <h3 style="margin-top: 0; text-align: center;">Motivo de Rechazo</h3>
            <div id="motivos-container" style="display: flex; flex-direction: column; gap: 8px; margin: 15px 0;">
                ${TIPOS_RECHAZO.map(motivo => `<button type="button" data-motivo="${motivo}" style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 6px; text-align: left; cursor: pointer; font-size: 14px; transition: 
                all 0.2s;">${motivo}</button>`).join('')}
            </div>
            <div>
                <label for="observacion-rechazo" style="display: block; margin-bottom: 6px; font-weight: 600;">Observación (mínimo 5 caracteres):</label>
                <textarea id="observacion-rechazo" placeholder="Ej: Cliente no estaba en casa..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 5px; min-height: 60px;"></textarea>
                <div id="error-observacion"style="color: #dc3545; font-size: 0.85em; margin-top: 5px; display: none;">La observación es obligatoria.</div>
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
                    btn.style.color = btn === e.target ? 'white' 
 : 
 'black';
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
function renderTablaLiquidadas() {
    const tbody = document.querySelector("#tabla-liquidadas tbody");
    if (!tbody) return;

    const inicio = document.getElementById('filtro-liquida-inicio')?.value;
    const fin = document.getElementById('filtro-liquida-fin')?.value;

    let liquidadas = ordenes.filter(o => o.estado === "Liquidadas");
    if (inicio) liquidadas = liquidadas.filter(o => o.fecha >= inicio);
    if (fin) liquidadas = liquidadas.filter(o => o.fecha <= fin);

    tbody.innerHTML = "";
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

function renderTablaRechazadas() {
    const tbody = document.querySelector("#tabla-rechazadas tbody");
    if (!tbody) return;

    const inicio = document.getElementById('filtro-rechazo-inicio')?.value;
    const fin = document.getElementById('filtro-rechazo-fin')?.value;

    let rechazadas = ordenes.filter(o => o.estado === "Rechazada");
    if (inicio) rechazadas = rechazadas.filter(o => o.fecha >= inicio);
    if (fin) rechazadas = rechazadas.filter(o => o.fecha <= fin);

    tbody.innerHTML = "";
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
        return {
            "RUT": e.rut, "Nombre": `${e.nombre1} ${e.nombre2 || ''} ${e.apepaterno} ${e.apematerno}`.trim(),
            "Cargo": cargo ? cargo.nombre : '', "Fecha Ingreso": e.fechaIngreso, "Teléfono": e.telefono || '', "Email": e.email || '',
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
    if (!datos || datos.length === 0) {
        container.empty().append("<p style='text-align: center; color: #666; margin-top: 50px;'>No hay datos para mostrar con los filtros seleccionados.</p>");
        if (graficoTecnicos) {
            graficoTecnicos.destroy();
            graficoTecnicos = null;
        }
        const canvas = document.getElementById('grafico-tecnicos');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
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
        true
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
                legend: { position: 'top' 
    },
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
        cargos: appData.cargos,
        empleados: appData.empleados
    }));
}

function cargarDatos() {
    const ordenesGuardadas = localStorage.getItem('ordenes');
    if (ordenesGuardadas) {
        try {
            ordenes = JSON.parse(ordenesGuardadas);
        } catch (e) {
            console.error("Error al cargar órdenes desde localStorage:", e);
            ordenes = [];
        }
    } else {
        ordenes = [];
    }
    const rrhhData = localStorage.getItem("rrhhData");
    if (rrhhData) {
        const datos = JSON.parse(rrhhData);
        appData.cargos = datos.cargos || [];
        appData.empleados = datos.empleados || [];
    } else {
        appData.empleados = [];
    }
    const cargosRequeridos = [
        { id: 'cargo-tecnico', nombre: 'Técnico' },
        { id: 'cargo-despacho', nombre: 'Despacho' },
        { id: 'cargo-supervisor', nombre: 'Supervisor' },
        { id: 'cargo-enc-bodega', nombre: 'Encargado bodega' },
        { id: 'cargo-enc-rrhh', nombre: 'Encargado RRHH' },
        { id: 'cargo-jefatura', nombre: 'Jefatura' },
        { id: 'cargo-admin', nombre: 'Administrativo' }
    ];
    cargosRequeridos.forEach(c => {
        if (!appData.cargos.some(x => x.id === c.id)) {
            appData.cargos.push(c);
        }
    });
    appData.empleados.forEach(emp => {
        if (!emp.stock) emp.stock = { equipos: [], tarjetas: [] };
    });
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
// --- Funciones Ingreso articulo ---
// ============================================
function mostrarFormularioCreacion(tipo) {
    document.getElementById('tipo-articulo').value = tipo;
    document.getElementById('form-crear-articulo').style.display = 'block';
}

function guardarArticulo(event) {
    event.preventDefault();
    const tipo = document.getElementById('tipo-articulo').value;
    const nombre = document.getElementById('articulo-nombre').value.trim();
    const codigo = document.getElementById('articulo-codigo').value.trim();
    if (!nombre || !codigo) return mostrarToast("Nombre y código son obligatorios.", "error");

    const lista = tipo === 'seriado' ?
    appData.articulos.seriados : appData.articulos.ferreteria;
    if (lista.some(a => a.codigo === codigo)) {
        return mostrarToast("El código ya existe. Debe ser único.", "error");
    }

    lista.push({ nombre, codigo });
    guardarDatosLogistica();
    mostrarToast(`Artículo ${tipo} guardado con éxito.`);
    document.getElementById('form-crear-articulo').reset();
    document.getElementById('form-crear-articulo').style.display = 'none';
}

function cargarTecnicosAsignacion() {
    const select = document.getElementById('tecnico-asignacion');
    if (!select) return;
    const tecnicosConId = appData.empleados
        .filter(emp => emp.activo && emp.cargoId === 'cargo-tecnico')
        .map(emp => ({
            value: emp.id,
            text: `${emp.nombre1} ${emp.apepaterno}`
        }));
    populateSelect(select, tecnicosConId, "Seleccione Técnico");
    console.log("Técnicos cargados para asignación:", tecnicosConId.length);
}


function cancelarCreacion() {
    document.getElementById('form-crear-articulo').style.display = 'none';
    document.getElementById('form-crear-articulo').reset();
}

function cargarArticulosEnSelects() {
    const selectSeriado = document.getElementById('articulo-seriado');
    const selectFerreteria = document.getElementById('articulo-no-seriado');
    if (selectSeriado) {
        populateSelect(selectSeriado, appData.articulos.seriados.map(a => ({ value: a.codigo, text: `${a.nombre} (${a.codigo})` })), "Seleccione Artículo");
    }
    if (selectFerreteria) {
        populateSelect(selectFerreteria, appData.articulos.ferreteria.map(a => ({ value: a.codigo, text: `${a.nombre} (${a.codigo})` })), "Seleccione Artículo");
    }
}

function procesarExcelEquipos(file, articuloCodigo) { 
        return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const articulo = appData.articulos.seriados.find(a => a.codigo === articuloCodigo);
                if (!articulo) {
                    return reject(`[Error PEX] Código de artículo no encontrado: ${articuloCodigo}`);
                }
                if (json.length < 2) return reject("Archivo vacío o sin datos.");
                const headers = json[0].map(h => h?.toString().trim().toLowerCase());
                let equipos = [];
                if (headers.includes('serie1') && headers.includes('serie2')) {
                    const idxSerie1 = headers.findIndex(h => h === 'serie1');
                    const idxSerie2 = headers.findIndex(h => h === 'serie2');
                    
                    equipos = json.slice(1).map(row => ({
                        codigo: articuloCodigo,
                        nombreArticulo: articulo.nombre,
                        serie1: row[idxSerie1]?.toString().trim() || '',
                        serie2: row[idxSerie2]?.toString().trim() || ''
                    })).filter(eq => eq.serie1 || eq.serie2);
                } else {
                    equipos = json.slice(1).map(row => ({
                        codigo: articuloCodigo,
                        nombreArticulo: articulo.nombre,
                        serie1: row[0]?.toString().trim() || '', 
                        serie2: row[1]?.toString().trim() || ''
                    })).filter(eq => eq.serie1 || eq.serie2);
                }
                if (equipos.length === 0) return reject("No se encontraron series válidas en el archivo.");
                resolve(equipos);
            } catch (err) {
                reject(err.message || "Error al leer el archivo Excel.");
            }
        };
        reader.onerror = () => reject("Error al cargar el archivo.");
        reader.readAsArrayBuffer(file);
    });
}
function procesarExcelTarjetas(file, articuloCodigo) { 
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
         
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const articulo = appData.articulos.ferreteria.find(a => a.codigo === articuloCodigo);
                if (!articulo) {
                    return reject(`[Error PTJ] Código de artículo no encontrado: ${articuloCodigo}`);
                }
                if (json.length < 2) return reject("Archivo vacío o sin datos.");
                const headers = json[0].map(h => h?.toString().trim().toLowerCase());
                let tarjetas = [];
                if (headers.includes('serie') || headers.includes('codigo')) {
                    const idxSerie = headers.findIndex(h => h === 'serie' || h === 'codigo');
                    
                    tarjetas = json.slice(1).map(row => ({
                        codigo: articuloCodigo,
                        nombreArticulo: articulo.nombre,
                        serie: row[idxSerie]?.toString().trim() || ''
                    })).filter(t => t.serie);
                } else {
                    tarjetas = json.slice(1).map(row => ({
                        codigo: articuloCodigo, 
                        nombreArticulo: articulo.nombre,
                        serie: row[0]?.toString().trim() || ''
                    })).filter(t => t.serie);
                }

                if (tarjetas.length === 0) return reject("No se encontraron series válidas.");

                resolve(tarjetas);
            } catch (err) {
                reject(err.message || "Error al leer el archivo Excel.");
            }
        };
        reader.onerror = () => reject("Error al cargar el archivo.");
        reader.readAsArrayBuffer(file);
    });
}

async function guardarIngresoSeriados(event) {
    event.preventDefault();
    const fileInput = document.getElementById('archivo-excel-seriados');
    const guia = document.getElementById('guia-seriados').value.trim();
    const fecha = document.getElementById('fecha-ingreso-seriados').value;
    const articuloCodigo = document.getElementById('articulo-seriado').value;
    if (!guia || !fecha || !articuloCodigo || !fileInput.files[0]) {
        return mostrarToast("Complete todos los campos.", "error");
    }
    if (!esFechaFutura(fecha)) {
        return mostrarToast("La fecha de ingreso debe ser hoy o futura.", "error");
    }
    try {
        const equipos = await procesarExcelEquipos(fileInput.files[0], articuloCodigo);
        const todosValidos = equipos.every(eq => eq.codigo === articuloCodigo);
        if (!todosValidos) {
            return mostrarToast(`Algunos códigos no coinciden con el artículo seleccionado (${articuloCodigo}).`, "error");
        }

        const ingreso = {
            tipo: 'equipo',
            guia,
            fecha,
            articuloCodigo,
            equipos,
            timestamp: Date.now()
        };

        if (!Array.isArray(appData.ingresosSeriados)) appData.ingresosSeriados = [];

        const guiaExistenteIndex = appData.ingresosSeriados.findIndex(ing => ing.guia === guia);
        if (guiaExistenteIndex > -1) {

            mostrarConfirmacion(
                `La guía N° ${guia} ya fue ingresada. ¿Desea sobrescribirla?`,
                () => {
                    appData.ingresosSeriados[guiaExistenteIndex] = ingreso;
                    localStorage.setItem('ingresosSeriados', JSON.stringify(appData.ingresosSeriados));
                    mostrarModalConfirmacion(equipos.length, 'equipo', articuloCodigo, () => {
                        document.getElementById('form-ingreso-seriados').reset();
                    });
                },
                () => mostrarToast("Ingreso cancelado.", "info")
            );
        } else {
            appData.ingresosSeriados.push(ingreso);
            localStorage.setItem('ingresosSeriados', JSON.stringify(appData.ingresosSeriados));
            mostrarModalConfirmacion(equipos.length, 'equipo', articuloCodigo, () => {
                document.getElementById('form-ingreso-seriados').reset();
            });
        }
    } catch (err) {
        mostrarToast(err, "error");
    }
}

async function guardarIngresoTarjetas(event) {
    event.preventDefault();
    const fileInput = document.getElementById('archivo-excel-tarjetas');
    const guia = document.getElementById('guia-no-seriados').value.trim();
    const fecha = document.getElementById('fecha-ingreso-no-seriados').value;
    const articuloCodigo = document.getElementById('articulo-no-seriado').value;
    if (!guia || !fecha || !articuloCodigo || !fileInput.files[0]) {
        return mostrarToast("Complete todos los campos.", "error");
    }
    if (!esFechaFutura(fecha)) {
        return mostrarToast("La fecha de ingreso debe ser hoy o futura.", "error");
    }

    try {
        const tarjetas = await procesarExcelTarjetas(fileInput.files[0], articuloCodigo);
        const todosValidos = tarjetas.every(t => t.codigo === articuloCodigo);
        if (!todosValidos) {
            return mostrarToast(`Algunos códigos no coinciden con el artículo seleccionado (${articuloCodigo}).`, "error");
        }

        const ingreso = {
            tipo: 'tarjeta',
            guia,
            fecha,
            articuloCodigo,
            tarjetas,
            timestamp: Date.now()
        };
        if (!appData.ingresosTarjetas) appData.ingresosTarjetas = [];
        appData.ingresosTarjetas.push(ingreso);
        localStorage.setItem('ingresosTarjetas', JSON.stringify(appData.ingresosTarjetas));

        mostrarModalConfirmacion(tarjetas.length, 'tarjeta', articuloCodigo, () => {
            document.getElementById('form-ingreso-no-seriados').reset();
        });
    } catch (err) {
        mostrarToast(err, "error");
    }
}

function guardarDatosLogistica() {
    localStorage.setItem('logisticaData', JSON.stringify(appData.articulos));
}

function cargarDatosLogistica() {
    const data = localStorage.getItem('logisticaData');
    if (data) {
        const parsed = JSON.parse(data);
        appData.articulos.seriados = parsed.seriados || [];
        appData.articulos.ferreteria = parsed.ferreteria || [];
    }
}

function mostrarModalConfirmacion(cantidad, tipo, codigoArticulo, onOtraGuia) {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacion';
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex;
align-items: center; justify-content: center; z-index: 3000;`;
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; max-width: 450px; width: 90%; text-align: center;">
            <h3 style="margin-top: 0; color: #007bff;">✅ Ingreso registrado</h3>
            <p>Se han ingresado <strong>${cantidad}</strong> ${tipo}(s) con código <strong>${codigoArticulo}</strong>.</p>
            <button id="btnAceptarIngreso" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px;">Aceptar</button>
        </div>
 
 
    `;
    document.body.appendChild(modal);

    document.getElementById('btnAceptarIngreso').addEventListener('click', () => {
        modal.remove();
        if (confirm("¿Desea ingresar otra guía?")) {
            onOtraGuia();
        } else {
            mostrarResumenStock(tipo, codigoArticulo);
        }
    });
}

function mostrarResumenStock(tipo, codigoArticulo) {
    let stockBodega = 0;
    if (tipo === 'equipo') {
        appData.ingresosSeriados?.forEach(ing => {
            if (ing.articuloCodigo === codigoArticulo) {
                stockBodega += ing.equipos.length;
            }
        });
        appData.empleados.forEach(emp => {
            if (emp.stock?.equipos) {
                emp.stock.equipos.forEach(eq => {
                    if (eq.articuloCodigo === codigoArticulo) stockBodega--;
                });
            }
        });
    } else {
        appData.ingresosTarjetas?.forEach(ing => {
            if (ing.articuloCodigo === codigoArticulo) {
                stockBodega += ing.tarjetas.length;
            }
        });
        appData.empleados.forEach(emp => {
            if (emp.stock?.tarjetas) {
                emp.stock.tarjetas.forEach(t => {
                    if (t.articuloCodigo === codigoArticulo) stockBodega -= t.cantidad;
                });
            }
        });
    }

    let stockTecnicos = 0;
    appData.empleados.forEach(emp => {
        if (emp.activo && emp.stock) {
            if (tipo === 'equipo') {
                stockTecnicos += emp.stock.equipos.filter(eq => eq.articuloCodigo === codigoArticulo).length;
            } else {
                emp.stock.tarjetas.forEach(t => {
        
 
             if (t.articuloCodigo === codigoArticulo) stockTecnicos += t.cantidad;
                });
            }
        }
    });
    const total = stockBodega + stockTecnicos;

    alert(`
Resumen de stock para ${tipo} "${codigoArticulo}":

• En bodega: ${stockBodega}
• En técnicos: ${stockTecnicos}
• Total general: ${total}
    `.trim());
}

// ============================================
// --- BÚSQUEDA DE SERIE (GLOBAL) ---
// ============================================
function buscarSerie() {
    const input = document.getElementById('input-buscar-serie');
    const resultadoDiv = document.getElementById('resultado-busqueda-serie');
    if (!input || !resultadoDiv) return;
    const termino = input.value.trim().toLowerCase();
    if (!termino) return mostrarToast("Ingrese un número de serie o código.", "error");
    let resultados = [];
    appData.ingresosSeriados?.forEach(ingreso => {
        ingreso.equipos?.forEach(eq => {
            if (eq.serie1.toLowerCase().includes(termino) || eq.serie2.toLowerCase().includes(termino)) {
                const articulo = appData.articulos.seriados.find(a => a.codigo === eq.codigo);
                let estado = 'En bodega';
                let detalle = '';
                let asignadoATecnico = null;
                appData.empleados.forEach(emp => {
                    if (emp.activo && emp.stock?.equipos) {
                        const equipoAsignado = emp.stock.equipos.find(e => 
                        e.serie1 === eq.serie1 && e.serie2 === eq.serie2 && e.articuloCodigo === eq.codigo
                        );                       
                        if (equipoAsignado) {
                            asignadoATecnico = `${emp.nombre1} ${emp.apepaterno}`;
                        }
                    }
                });
                if (asignadoATecnico) {
                    estado = 'Asignado a técnico';
                    detalle = asignadoATecnico;
                } else {
                    const ordenUsada = ordenes.find(o => 
                        o.estado === 'Liquidadas' && 
                        (o.subServicio?.includes(eq.codigo) || o.servicio?.includes(eq.codigo))
                    );
                    if (ordenUsada) {
                        estado = 'Instalado en cliente';
                        detalle = `Orden #${ordenUsada.numero}`;
                    }
                }
                resultados.push({
                    tipo: 'Equipo',
                    guia: ingreso.guia,
                    fecha: ingreso.fecha,
                    codigoArticulo: eq.codigo,
                    nombreArticulo: articulo ? articulo.nombre : eq.codigo,
                    serie1: eq.serie1,
                    serie2: eq.serie2,
                    estado,
                    detalle
                });
            }
        });
    });
    appData.ingresosTarjetas?.forEach(ingreso => {
        ingreso.tarjetas?.forEach(t => {
            if (t.serie.toLowerCase().includes(termino)) {
                const articulo = appData.articulos.ferreteria.find(a => a.codigo === t.codigo);
                let estado = 'En bodega';
                let detalle = '';
                let asignadoATecnico = null;
                appData.empleados.forEach(emp => {
                    if (emp.activo && emp.stock?.tarjetas) {
                        const tarjetaAsignada = emp.stock.tarjetas.find(tt => 
                        tt.articuloCodigo === t.codigo && tt.cantidad > 0
                        );
                        if (tarjetaAsignada) {
                            
                            asignadoATecnico = 
                            `${emp.nombre1} ${emp.apepaterno}`;
                        }
                    }
                });
                if (asignadoATecnico) {
                    estado = 'Asignado a técnico';
                    detalle = asignadoATecnico;
                } else {
                    const ordenUsada = ordenes.find(o => 
                        o.estado === 'Liquidadas' && 
                        (o.subServicio?.includes(t.codigo) || o.servicio?.includes(t.codigo))
                    );
                    if (ordenUsada) {
                        estado = 'Instalado en cliente';
                        detalle = `Orden #${ordenUsada.numero}`;
                    }
                }
                resultados.push({
                    tipo: 'Tarjeta',
                    guia: ingreso.guia,
                    fecha: ingreso.fecha,
                    codigoArticulo: t.codigo,
                    nombreArticulo: articulo ? articulo.nombre : t.codigo,
                    serie: t.serie,
                    estado,
                    detalle
                });
            }
        });
    });
    if (resultados.length === 0) {
        resultadoDiv.innerHTML = `<p style="color:#dc3545;">No se encontró ninguna serie o código con ese término.</p>`;
        return;
    }
    let html = `<h3>Resultados (${resultados.length})</h3>`;
    resultados.forEach(r => {
        const colorEstado = 
            r.estado === 'En bodega' ? '#17a2b8' :
            r.estado === 'Asignado a técnico' ? '#ffc107' :
            r.estado === 'Instalado en cliente' ? '#28a745' : '#6c757d';
        if (r.tipo === 'Equipo') {
            html += `<div style="background:#f8f9fa; padding:14px; border-radius:8px; margin:12px 0; border-left:4px solid ${colorEstado}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <p><strong>Tipo:</strong> ${r.tipo}</p>
                    <p><strong>Nombre del artículo:</strong> ${r.nombreArticulo}</p>
                    <p><strong>Código:</strong> ${r.codigoArticulo}</p>
                    <p><strong>N° de Guía:</strong> ${r.guia}</p>
                    <p><strong>Fecha de ingreso:</strong> ${r.fecha}</p>
                    <p><strong>Serie 1:</strong> ${r.serie1}</p>
                    <p><strong>Serie 2:</strong> ${r.serie2}</p>
                    <p><strong>Estado actual:</strong> <span style="color:${colorEstado}; font-weight:bold;">${r.estado}</span></p>
                    ${r.detalle ? `<p><strong>Detalles:</strong> ${r.detalle}</p>` : ''}
                </div>
            `;
        } else {
            html += `
                <div style="background:#f8f9fa;
                    padding:14px; border-radius:8px; margin:12px 0; border-left:4px solid ${colorEstado}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <p><strong>Tipo:</strong> ${r.tipo}</p>
                    <p><strong>Nombre del artículo:</strong> ${r.nombreArticulo}</p>
                    <p><strong>Código:</strong> ${r.codigoArticulo}</p>
                    <p><strong>N° de 
                    Guía:</strong> ${r.guia}</p>
                    <p><strong>Fecha de ingreso:</strong> ${r.fecha}</p>
                    <p><strong>Código/Serie:</strong> ${r.serie}</p>
                    <p><strong>Estado actual:</strong> <span style="color:${colorEstado};
                    font-weight:bold;">${r.estado}</span></p>
                    ${r.detalle ? `<p><strong>Detalles:</strong> ${r.detalle}</p>` : ''}
                </div>
            `;
        }
    });
    resultadoDiv.innerHTML = html;
}

// =======================================================
// --- FUNCIÓN CON DEPURACIÓN
// =======================================================
function cargarMaterialesAsignacion(tipo) {
    const select = document.getElementById('material-asignacion');
    if (!select) {
        console.error("Debug: No se encontró el select 'material-asignacion'");
        return;
    }
    const ingresosSeriados = appData.ingresosSeriados || [];
    const ingresosTarjetas = appData.ingresosTarjetas || [];
    const empleados = appData.empleados || [];
    const articulosSeriados = appData.articulos.seriados || [];
    const articulosFerreteria = appData.articulos.ferreteria || [];
    console.log(`- Debug: Iniciando cargarMaterialesAsignacion(${tipo}) -`);
    if (tipo === 'equipo') {
        console.log("Debug: Filtrando equipos. Artículos en 'seriados':", articulosSeriados.length);
        const materialesConStock = articulosSeriados.filter(articulo => {
            console.log(`Debug: Chequeando artículo: ${articulo.nombre} (${articulo.codigo})`);
            const enBodega = ingresosSeriados
                .filter(ing => ing.articuloCodigo === articulo.codigo)
                .reduce((total, ing) => total + (ing.equipos?.length || 0), 0);
            const asignados = empleados.reduce((total, emp) => {
                const stock = emp.stock?.equipos || [];
                return total + stock.filter(eq => eq.articuloCodigo === articulo.codigo).length;
            }, 0);
            const disponible = enBodega - asignados;
            console.log(`Debug: -> enBodega: ${enBodega} | asignados: ${asignados} | Disponible: ${disponible}`);
            return disponible > 0;
        });
        populateSelect(select, materialesConStock.map(a => ({ value: a.codigo, text: a.nombre })), "Seleccione Equipo");
        } else if (tipo === 'tarjeta') {
        console.log("Debug: Filtrando tarjetas. Artículos en 'ferreteria':", articulosFerreteria.length);
        const materialesConStock = articulosFerreteria.filter(articulo => {
            console.log(`Debug: Chequeando tarjeta: ${articulo.nombre} (${articulo.codigo})`);
            const enBodega = ingresosTarjetas
                .filter(ing => ing.articuloCodigo === articulo.codigo)
                .reduce((total, ing) => total + (ing.tarjetas?.length || 0), 0);
            const asignadas = empleados.reduce((total, emp) => {
                const stock = emp.stock?.tarjetas || [];
                return total + stock.filter(t => t.articuloCodigo === articulo.codigo).reduce((sum, t) => sum + t.cantidad, 0);
            }, 0);
            const disponible = enBodega - asignadas;
            console.log(`Debug: -> enBodega: ${enBodega} | asignadas: ${asignadas} | Disponible: ${disponible}`);
            return disponible > 0;
        });
        populateSelect(select, materialesConStock.map(a => ({ value: a.codigo, text: a.nombre })), "Seleccione Tarjeta");
    }
}

document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "btnAsignarMaterial") {
        const materialesSeleccionados = document.querySelectorAll(".chk-material:checked");
        if (materialesSeleccionados.length === 0) {
            mostrarToast("Seleccione al menos un material para asignar.", "error");
            return;
        }
        materialesSeleccionados.forEach(chk => {
            const id = chk.dataset.id;
            const material = appData.articulos.seriados.find(a => a.id == id);
            if (material) {
                material.asignado = true;
                material.fechaAsignacion = new Date().toISOString().split("T")[0];
            }
        });
        guardarDatosLogistica?.();
        mostrarToast("✅ Materiales asignados con éxito.");
        if (typeof renderTablaSeriados === "function") renderTablaSeriados();
    }
});

// =======================================================
// --- LÓGICA DEL NUEVO PANEL: SALDO TÉCNICO ---
// =======================================================

function setupSaldoTecnico() {
    const select = document.getElementById('filtro-tecnico-saldo');
    if (!select) return;
    const tecnicosActivos = appData.empleados
        .filter(emp => emp.activo && appData.cargos.find(c => c.id === emp.cargoId)?.nombre.toLowerCase().includes('tecnico'))
        .map(emp => ({ value: emp.id, text: `${emp.nombre1} ${emp.apepaterno}` }));
    populateSelect(select, tecnicosActivos, "Todos los Técnicos");
    const defaultOption = select.querySelector('option[value=""]');
    if (defaultOption) defaultOption.value = 'todos'; 
    select.onchange = renderSaldoTecnico;
    renderSaldoTecnico();
}

function renderSaldoTecnico() {
    const tecnicoId = document.getElementById('filtro-tecnico-saldo')?.value;
    const detalleDiv = document.getElementById('detalle-stock');
    const totalSpan = document.getElementById('total-asignado');
    if (!detalleDiv || !totalSpan) return;
    detalleDiv.innerHTML = '';
    let empleadosAfectados = [];
    let totalStockGlobal = 0;
    if (tecnicoId === 'todos') {
        empleadosAfectados = appData.empleados.filter(emp => 
            emp.activo && 
            appData.cargos.find(c => c.id === emp.cargoId)?.nombre.toLowerCase().includes('tecnico')
        );
    } else if (tecnicoId) {
        const tecnico = appData.empleados.find(emp => emp.id === tecnicoId);
        if (tecnico) {
            empleadosAfectados.push(tecnico);
        }
    } else {
        totalSpan.textContent = '0';
        detalleDiv.innerHTML = '<p style="text-align: center; color: #6c757d; margin-top: 40px;">Seleccione un técnico o "Todos" para ver el detalle del stock.</p>';
        return;
    }
    if (empleadosAfectados.length === 0) {
        totalSpan.textContent = '0';
        detalleDiv.innerHTML = '<p style="text-align: center; color: #6c757d; margin-top: 40px;">No se encontraron técnicos activos o no tienen stock asignado.</p>';
        return;
    }
    let htmlDetalle = '';
    empleadosAfectados.forEach(emp => {
        const nombreCompleto = `${emp.nombre1} ${emp.apepaterno}`;
        const stockEquipos = emp.stock?.equipos || [];
        const stockTarjetas = emp.stock?.tarjetas || [];
        const totalTecnico = stockEquipos.length + stockTarjetas.reduce((sum, t) => sum + t.cantidad, 0);
        totalStockGlobal += totalTecnico;
        
        if (totalTecnico > 0) {
            htmlDetalle += `
                <div class="saldo-tecnico-card" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #fff;">
                    <h4 style="margin-top: 0; color: #007bff;">${nombreCompleto} (${totalTecnico} ítems)</h4>
                    <h5 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 15px; color:#333;">Equipos Asignados (${stockEquipos.length})</h5>
                    <div style="overflow-x: auto;">
                    <table style="width: 100%; min-width: 600px;
                    border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="background-color: #f1f1f1;">
                                <th style="padding: 8px;
                                text-align: left;">Artículo</th>
                                <th style="padding: 8px;
                                text-align: left;">Código</th>
                                <th style="padding: 8px;
                                text-align: left;">Serie 1</th>
                                <th style="padding: 8px;
                                text-align: left;">Serie 2</th>
                                <th style="padding: 8px;
                                text-align: left;">Fecha Asign.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stockEquipos.length > 0 ? stockEquipos.map(eq => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${appData.articulos.seriados.find(a => a.codigo === eq.articuloCodigo)?.nombre || 'Desconocido'}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${eq.articuloCodigo}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${eq.serie1}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${eq.serie2}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${eq.fechaAsignacion}</td>
                                </tr>
                        `).join('') : `<tr><td colspan="5" style="text-align: center; color: #6c757d; padding: 8px;">No tiene equipos seriados asignados.</td></tr>`}
                        </tbody>
                    </table>
                    </div>
                    <h5 style="border-bottom: 1px solid #eee;
                    padding-bottom: 5px; margin-top: 25px; color:#333;">Tarjetas/Otros (${stockTarjetas.reduce((sum, t) => sum + t.cantidad, 0)})</h5>
                    <div style="overflow-x: auto;">
                    <table style="width: 100%;
                    min-width: 400px; border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="background-color: #f1f1f1;">
                                <th style="padding: 8px;
                                text-align: left;">Artículo</th>
                                <th style="padding: 8px;
                                text-align: left;">Código</th>
                                <th style="padding: 8px;
                                text-align: left;">Cantidad</th>
                                <th style="padding: 8px;
                                text-align: left;">Fecha Asign.</th>
                            </tr>
                        </thead>
                        <tbody>                     
                            ${stockTarjetas.length > 0 ? stockTarjetas.map(t => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${appData.articulos.ferreteria.find(a => a.codigo === t.articuloCodigo)?.nombre || 'Desconocido'}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.articuloCodigo}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.cantidad}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.fechaAsignacion}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="4" style="text-align: center;
                            color: #6c757d; padding: 8px;">No tiene tarjetas/otros asignados.</td></tr>`}
                        </tbody>
                    </table>
                    </div>
                </div>
            `;
        }
    });
    totalSpan.textContent = totalStockGlobal;    
    if (htmlDetalle === '' && empleadosAfectados.length > 0) {
        detalleDiv.innerHTML = '<p style="text-align: center; margin-top: 50px;">El técnico o los técnicos seleccionados no tienen stock asignado.</p>';
    } else {
        detalleDiv.innerHTML = htmlDetalle;
    }
}
// ============================================
// --- GUIA DE ASIGNACION ---
// ============================================
function generarGuiaAsignacion() {
    const hoy = new Date();
    const fechaStr = hoy.toISOString().slice(0, 10).replace(/-/g, ''); // 20251106
    const clave = `ultimaGuia_${fechaStr}`;
    let contador = parseInt(localStorage.getItem(clave)) || 0;
    contador++;
    localStorage.setItem(clave, contador.toString());
    const numStr = String(contador).padStart(4, '0');
    return `ASIG-${fechaStr}-${numStr}`;
}
// ============================================
// --- CORREOS ---
// ============================================
async function enviarCorreoAsignacion(tecnico, tipo, codigo, detalle, guia) {
    const articulo = tipo === 'equipo' ?
        appData.articulos.seriados.find(a => a.codigo === codigo) :
        appData.articulos.ferreteria.find(a => a.codigo === codigo);
    const nombreArticulo = articulo?.nombre || codigo;
    let cuerpo = `Hola ${tecnico.nombre1},\n\n`;
    cuerpo += `Se han asignado los siguientes equipos: **${guia}**\n\n`;
    cuerpo += `Muy buen día: ${nombreArticulo} (${codigo})\n\n`;
    if (tipo === 'equipo') {
        cuerpo += `Series asignadas (${detalle.length}):\n`;
        detalle.forEach(eq => {
            cuerpo += `- ${eq.serie1} / ${eq.serie2}\n`;
        });
    } else {
        cuerpo += `Cantidad asignada: ${detalle.length}\n`;
    }
    cuerpo += `\nSaludos,\nSistema de Gestión Logística`;
    const asunto = `Asignación de Material - Guía ${guia}`;
    const templateParams = {
        to_name: tecnico.nombre1,
        subject: asunto,
        message: cuerpo
    };
    if (tecnico.email) {
        templateParams.to_email = tecnico.email;
        try {
            await emailjs.send('service_8p2y4a6', 'template_m8313jl', templateParams);
            console.log("✅ Correo enviado al técnico:", tecnico.email);
        } catch (error) {
            console.error("❌ Error al enviar al técnico:", error);
            mostrarToast(`Error al enviar correo a ${tecnico.nombre1}.`, "error");
        }
    }
    templateParams.to_email = "bodegapoolosorno@gmail.com";
    templateParams.subject = "[COPIA BODEGA] " + asunto;
    templateParams.message = cuerpo + "\n\n--- COPIA DE RESPALDO PARA BODEGA ---";
    try {
        await emailjs.send('service_8p2y4a6', 'template_m8313jl', templateParams);
        console.log("✅ Copia enviada a bodega: bodegapoolosorno@gmail.com");
        mostrarToast(`✅ Asignación enviada a ${tecnico.nombre1} y copia a bodega.`, "success");
    } catch (error) {
        console.error("❌ Error al enviar copia a bodega:", error);
        mostrarToast("Asignación guardada, pero error al enviar correos.", "warning");
    }
}
// ============================================
// --- INICIALIZACIÓN DE LA APLICACIÓN ---
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    cargarDatosLogistica();
    try {
        const ingresosSeriadosData = localStorage.getItem('ingresosSeriados');
        if (ingresosSeriadosData && ingresosSeriadosData !== 'null') {
            appData.ingresosSeriados = JSON.parse(ingresosSeriadosData) || [];
        } else {
            appData.ingresosSeriados = [];
        }
    } catch (e) {
        console.error("Error al cargar ingresosSeriados:", e);
        appData.ingresosSeriados = [];
    }
    try {
        const ingresosTarjetasData = localStorage.getItem('ingresosTarjetas');
        if (ingresosTarjetasData && ingresosTarjetasData !== 'null') {
            appData.ingresosTarjetas = JSON.parse(ingresosTarjetasData) || [];
        } else {
            appData.ingresosTarjetas = [];
        }
    } catch (e) {
        console.error("Error al cargar ingresosTarjetas:", e);
        appData.ingresosTarjetas = [];
    }
    document.getElementById('btnSiguientePaso1')?.addEventListener('click', validarNumeroOrden);
    document.getElementById('btnValidarCombinacion')?.addEventListener('click', validarCombinacion);
    document.getElementById('btnVolverPaso1')?.addEventListener('click', () => {
    document.getElementById('paso-2').style.display = 'none';
    document.getElementById('paso-1').style.display = 'block';
    });
    // =======================================================
    // --- FIN DEL BLOQUE ---
    // =======================================================
    actualizarPersonalDTH();
    const safeAddListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };
    document.querySelectorAll('#main-nav button[data-module]').forEach(button => {
        button.addEventListener('click', () => seleccionarModulo(button.dataset.module));
    });
    document.querySelectorAll('#sidebar button[data-panel]').forEach(button => {
        button.addEventListener('click', () => {
            const panelId = button.dataset.panel;
            mostrarPanel(panelId);
            if (panelId === 'panel-ingreso-seriados' ||
            panelId === 'panel-ingreso-no-seriados') {
                cargarArticulosEnSelects();
            }
            
            if (panelId === 'panel-asignacion-materiales') {
                document.getElementById('tecnico-asignacion').innerHTML = '<option value="">-- Cargando --</option>';
                document.getElementById('tipo-asignacion').value = '';
                document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione tipo --</option>';
                document.getElementById('contenedor-cantidad').style.display = 'none';
                document.getElementById('contenedor-ingreso-series').style.display = 'none';
                document.getElementById('contenedor-asignar-final').style.display = 'none';
            setTimeout(() => {
                try {
                    inicializarAsignacion();
                } catch (err) {
                    console.error("❌ Error al inicializar asignación:", err);
                    mostrarToast("Error al cargar el panel de asignación.", "error");
                }
            }, 150);
            }
        });
    });
    // === LISTENERS DE BOTONES Y FORMULARIOS ===
    safeAddListener('btnLogin', 'click', login);
    safeAddListener('btnBuscarPorOrden', 'click', buscarPorOrden);
    safeAddListener('btnBuscarPorRut', 'click', buscarPorRut);
    safeAddListener('btnAgregarCargo', 'click', agregarCargo);
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
    safeAddListener('btnBuscarColaborador', 'click', buscarColaborador);
    safeAddListener('btn-crear-seriado', 'click', () => mostrarFormularioCreacion('seriado'));
    safeAddListener('btn-crear-ferreteria', 'click', () => mostrarFormularioCreacion('ferreteria'));
    safeAddListener('btn-cancelar-crear', 'click', cancelarCreacion);
    safeAddListener('btn-buscar-serie', 'click', buscarSerie);
    safeAddListener('btn-generar-guia', 'click', () => mostrarToast("Generando guía de salida...", "info"));

    const formEditarOrden = document.getElementById('form-editar-orden');
    if (formEditarOrden) formEditarOrden.addEventListener('submit', guardarEdicionOrden);
    safeAddListener('btnCancelarEdicionOrden', 'click', () => mostrarPanel('panel-agendadas'));

    const formEditarEmpleado = document.getElementById('form-editar-empleado');
    if (formEditarEmpleado) formEditarEmpleado.addEventListener('submit', guardarEdicionEmpleado);

    const formCrear = document.getElementById('form-crear-articulo');
    if (formCrear) formCrear.addEventListener('submit', guardarArticulo);

    const formSeriados = document.getElementById('form-ingreso-seriados');
    if (formSeriados) formSeriados.addEventListener('submit', guardarIngresoSeriados);

    const formFerreteria = document.getElementById('form-ingreso-no-seriados');
    if (formFerreteria) formFerreteria.addEventListener('submit', guardarIngresoTarjetas);
    const formNuevoIngreso = document.getElementById('form-nuevo-ingreso');
    if (formNuevoIngreso) formNuevoIngreso.addEventListener('submit', guardarNuevoEmpleado);

    const formIngresoOrden = document.getElementById('form-ingreso-orden');
    if (formIngresoOrden) formIngresoOrden.addEventListener('submit', guardarOrden);

    const inputSerie = document.getElementById('input-buscar-serie');
    if (inputSerie) {
        inputSerie.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarSerie();
        });
    }

    const buscarColabInput = document.getElementById('buscar-colab-input');
    if (buscarColabInput) {
        buscarColabInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarColaborador();
        });
    }

    const reportesRRHH = document.querySelector('#reportes-rrhh .report-buttons');
    if (reportesRRHH) {
        reportesRRHH.addEventListener('click', (e) => {
            if (e.target.dataset.reportType) exportarExcelRRHH(e.target.dataset.reportType);
        });
    }

    ['orden-rut', 'emp-rut', 'editar-rut'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => formatearRut(e.target));
            el.addEventListener('blur', (e) => validarRutInput(e.target));
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && document.getElementById('login-container').style.display !== 'none') {
            event.preventDefault();
            login();
        }
    });

    function formatearRut(inputElement) {
        let valor = inputElement.value.replace(/[^0-9kK]/g, '').toLowerCase();
        if (!valor) return;
        let cuerpo = valor.slice(0, -1);
        let dv = valor.slice(-1);
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        inputElement.value = cuerpo + '-' + dv;
    }
    
    
    // =======================================================
    // --- LÓGICA CORREGIDA: ASIGNACIÓN DE MATERIALES ---
    // =======================================================

    const formAsignacion = document.getElementById('form-asignacion');
    if (formAsignacion) {
        
        formAsignacion.addEventListener('submit', guardarAsignacion);
    }
    });
let asignacionActiva = {
    tipo: null,
    materialCodigo: null,
    cantidad: 0,
    seriesIngresadas: [],
    tecnicoNombre: null,
    tecnicoId: null
};

function generarGuiaAsignacion() {
    const hoy = new Date();
    const fechaStr = hoy.toISOString().slice(0, 10).replace(/-/g, '');
    const clave = `ultimaGuia_${fechaStr}`;
    let contador = parseInt(localStorage.getItem(clave)) || 0;
    contador++;
    localStorage.setItem(clave, contador.toString());
    return `ASIG-${fechaStr}-${String(contador).padStart(4, '0')}`;
}

async function procesarAsignacionFinal() {
    if (!asignacionActiva.tecnicoId) {
        return mostrarToast("Debe seleccionar un técnico válido.", "error");
    }
    const tecnico = appData.empleados.find(e => e.id === asignacionActiva.tecnicoId);
    if (!tecnico) {
        console.error("Técnico no encontrado con ID:", asignacionActiva.tecnicoId);
        return mostrarToast("Técnico no válido.", "error");
    }
    
    if (!asignacionActiva.materialCodigo) {
        return mostrarToast("Seleccione un material.", "error");
    }
    
    if (asignacionActiva.seriesIngresadas.length === 0) {
        return mostrarToast("No se han ingresado series.", "error");
    }
    const materialCodigo = asignacionActiva.materialCodigo;
    const tipo = asignacionActiva.tipo;
    const seriesIngresadas = asignacionActiva.seriesIngresadas;
    const seriesValidas = [];
    for (const serie of seriesIngresadas) {
        let encontrado = false;
        if (tipo === 'equipo') {
            for (const ingreso of (appData.ingresosSeriados || [])) {
                if (ingreso.articuloCodigo !== materialCodigo) continue;
                for (const eq of (ingreso.equipos || [])) {
                    if (eq.serie1 === serie || eq.serie2 === serie) {
                        const yaAsignado = appData.empleados.some(emp =>
                            emp?.stock?.equipos?.some(e =>
                                e.articuloCodigo === materialCodigo &&
                                (e.serie1 === serie || e.serie2 === serie)
                            )
                        );
                        if (!yaAsignado) {
                            seriesValidas.push({ serie1: eq.serie1, serie2: eq.serie2 });
                            encontrado = true;
                            break;
                        }
                    }
                }
                if (encontrado) break;
            }
        }
        else if (tipo === 'tarjeta') {
            for (const ingreso of (appData.ingresosTarjetas || [])) {
                if (ingreso.articuloCodigo !== materialCodigo) continue;
                for (const t of (ingreso.tarjetas || [])) {
                    if (normalizarSerie(t.serie) === normalizarSerie(serie)) {
                        const yaAsignado = appData.empleados.some(emp =>
                            emp?.stock?.tarjetas?.some(tt =>
                                tt.articuloCodigo === materialCodigo &&
                                normalizarSerie(tt.serie) === normalizarSerie(serie)
                            )
                        );
                        if (!yaAsignado) {
                            seriesValidas.push({ serie1: serie, serie2: '' });
                            encontrado = true;
                            break;
                        }
                    }
                }
                if (encontrado) break;
            }
        }
        if (!encontrado) {
            return mostrarToast(`La serie "${serie}" no existe o ya está asignada.`, "error");
        }
    }
    const guia = generarGuiaAsignacion();
    if (tipo === 'equipo') {
    seriesValidas.forEach(eq => {
        tecnico.stock.equipos.push({
            articuloCodigo: materialCodigo,
            serie1: eq.serie1,
            serie2: eq.serie2,
            fechaAsignacion: new Date().toISOString().split('T')[0],
            guiaAsignacion: guia
        });
    });
    } else if (tipo === 'tarjeta') {
        seriesValidas.forEach(eq => {
            tecnico.stock.tarjetas.push({
                articuloCodigo: materialCodigo,
                serie: eq.serie1,
                fechaAsignacion: new Date().toISOString().split('T')[0],
                guiaAsignacion: guia
            });
        });
    }
    guardarDatosRRHH();
    mostrarToast(`✅ Asignadas ${seriesValidas.length} series. Guía: ${guia}`, "success");
    await enviarCorreoAsignacion(tecnico, tipo, materialCodigo, seriesValidas, guia);
    if (confirm("¿Desea asignar material a otro técnico?")) {
        asignacionActiva.tipo = null;
        asignacionActiva.materialCodigo = null;
        asignacionActiva.seriesIngresadas = [];
        document.getElementById('tipo-asignacion').value = '';
        document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione tipo --</option>';
        document.getElementById('contenedor-cantidad').style.display = 'none';
        document.getElementById('contenedor-ingreso-series').style.display = 'none';
        document.getElementById('contenedor-asignar-final').style.display = 'none';
        document.getElementById('input-serie').value = '';
        document.getElementById('lista-series-ingresadas').innerHTML = '';
        mostrarToast("Listo para asignar nuevo material al mismo técnico.", "info");
    } else {
        asignacionActiva = {
            tipo: null,
            materialCodigo: null,
            cantidad: 0,
            seriesIngresadas: [],
            tecnicoNombre: null,
            tecnicoId: null
        };
        document.getElementById('tecnico-asignacion').selectedIndex = 0;
        document.getElementById('tipo-asignacion').value = '';
        document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione --</option>';
        document.getElementById('contenedor-cantidad').style.display = 'none';
        document.getElementById('contenedor-ingreso-series').style.display = 'none';
        document.getElementById('contenedor-asignar-final').style.display = 'none';
        document.getElementById('input-serie').value = '';
        document.getElementById('lista-series-ingresadas').innerHTML = '';
        mostrarPanel('modulo-bienvenida');
    }
}
function resetMaterialAsignacion() {
    asignacionActiva.tipo = null;
    asignacionActiva.materialCodigo = null;
    asignacionActiva.cantidad = 0;
    asignacionActiva.seriesIngresadas = [];
    document.getElementById('cantidad-asignar').value = '';
    document.getElementById('input-serie').value = '';
    document.getElementById('lista-series-ingresadas').innerHTML = '';
    document.getElementById('contenedor-cantidad').style.display = 'none';
    document.getElementById('contenedor-ingreso-series').style.display = 'none';
    document.getElementById('contenedor-asignar-final').style.display = 'none';
}
function resetAsignacionCompleta() {
    asignacionActiva = {
        tipo: null,
        materialCodigo: null,
        cantidad: 0,
        seriesIngresadas: [],
        tecnicoNombre: null,
        tecnicoId: null
    };
    document.getElementById('tecnico-asignacion').selectedIndex = 0;
    document.getElementById('tipo-asignacion').value = '';
    document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione --</option>';
    resetMaterialAsignacion();
}
// ================================
// INICIALIZAR ASIGNACIÓN (al mostrar el panel)
// ================================
function inicializarAsignacion() {
    resetAsignacionCompleta();
    cargarTecnicosAsignacion();
    document.getElementById('tecnico-asignacion').addEventListener('change', function() {
    const tecnicoId = this.value;
    asignacionActiva.tecnicoId = tecnicoId;
    const emp = appData.empleados.find(e => e.id === tecnicoId);
    asignacionActiva.tecnicoNombre = emp ? `${emp.nombre1} ${emp.apepaterno}` : null;
    console.log("✔ Técnico asignado:", asignacionActiva.tecnicoId, asignacionActiva.tecnicoNombre);
});
    document.getElementById('tipo-asignacion').onchange = function () {
        const tipo = this.value;
        resetMaterialAsignacion();
        asignacionActiva.tipo = tipo;
        const materialSelect = document.getElementById('material-asignacion');
        if (tipo) {
            cargarMaterialesAsignacion(tipo);
        } else {
            materialSelect.innerHTML = '<option value="">-- Seleccione tipo primero --</option>';
        }
    };
    document.getElementById('material-asignacion').onchange = function () {
        const codigo = this.value;
        asignacionActiva.materialCodigo = codigo;
        document.getElementById('contenedor-cantidad').style.display = 'none';
        document.getElementById('contenedor-ingreso-series').style.display = 'none';
        document.getElementById('contenedor-asignar-final').style.display = 'none';
        document.getElementById('cantidad-asignar').value = '';
        if (codigo) {
        document.getElementById('contenedor-cantidad').style.display = 'block';
        }
    };
        document.getElementById('btn-confirmar-cantidad').onclick = function () {
        document.getElementById('contenedor-ingreso-series').style.display = 'block';
        document.getElementById('input-serie').focus();
    };
    document.getElementById('btn-agregar-serie').onclick = function () {
        const input = document.getElementById('input-serie');
        const serie = input.value.trim();
        if (!serie) return mostrarToast("Ingrese una serie.", "error");
        if (asignacionActiva.seriesIngresadas.includes(serie)) {
        return mostrarToast("Serie ya ingresada.", "error");
        }
        asignacionActiva.seriesIngresadas.push(serie);
        input.value = '';
        const lista = document.getElementById('lista-series-ingresadas');
        lista.innerHTML = `<p><strong>Series (${asignacionActiva.seriesIngresadas.length}/${asignacionActiva.cantidad}):</strong></p>
            <ul>${asignacionActiva.seriesIngresadas.map(s => `<li>${s}</li>`).join('')}</ul>`;
        if (asignacionActiva.seriesIngresadas.length >= asignacionActiva.cantidad) {
            mostrarToast("✅ Series OK", "success");
            setTimeout(() => {
                document.getElementById('contenedor-asignar-final').style.display = 'block';
            }, 800);
        }
    };
    document.getElementById('btn-asignar-material').onclick = function() {
    try {
        procesarAsignacionFinal();
    } catch (err) {
        console.error("❌ Error en asignación:", err);
        mostrarToast("Error al procesar la asignación. Revisar consola.", "error");
    }
};
}
function mostrarConfirmacion(mensaje, callbackSi, callbackNo = () => {}) {
    const modalExistente = document.getElementById('modal-confirmacion');
    if (modalExistente) modalExistente.remove();
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacion';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center;`;
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 10px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
            <p style="font-size: 1.1em; margin: 0 0 20px;">${mensaje}</p>
            <div>
                <button id="btn-confirmar-si" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-right: 10px;">Aceptar</button>
                <button id="btn-confirmar-no" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px;">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-confirmar-si').onclick = () => {
        modal.remove();
        callbackSi();
    };
    document.getElementById('btn-confirmar-no').onclick = () => {
        modal.remove();
        callbackNo();
    };
}