// =======================================================
// --- Datos Centralizados y Estado de la Aplicación ---
// =======================================================
const appData = {
    regiones: {
        "15": { nombre: "Región de Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos","Máfil", "La Unión", "Futrono", "Lago Ranco","Río Bueno", "Mariquina", "Paillaco", "Panguipulli"] },
        "11": { nombre: "Provincia de Osorno", comunas: ["Osorno", "Puerto Octay", "Puyehue", "Río Negro", "Purranque", "San Juan de la Costa", "San Pablo"] },
        "12": { nombre: "Provincia de Chiloé", comunas: ["Castro", "Ancud", "Quellón", "Dalcahue", "Chonchi", "Curaco de Vélez", "Queilén", "Quinchao", "Puqueldón"] },
        "13": { nombre: "Provincia de Llanquihue", comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Maullín", "Puerto Varas", "Frutillar", "Los Muermos", "Llanquihue"] },
        "14": { nombre: "Provincia de Palena", comunas: ["Chaitén", "Futaleufú", "Palena", "Hualaihué"] },
    },
    servicios: {
        Instalacion: ["1 Deco", "2 Decos", "3 Decos", "4 Decos"],
        VT: ["Reparación", "Cambio 1 Deco", "Cambio 2 Decos", "Cambio 3 Decos", "Cambio 4 Decos"],
        Garantia: ["Reparación", "Cambio 1 Deco", "Cambio 2 Decos", "Cambio 3 Decos", "Cambio 4 Decos"],
        Upgrade: ["1 Deco", "2 Decos", "3 Decos"],
        Regularizacion: ["Cambio 1 Deco", "Cambio 2 Decos", "Cambio 3 Decos", "Cambio 4 Decos"],
        Traslado: ["Traslado"]
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
let motivoSeleccionado = null; // { ordenId, motivo }
let ordenes = [];
let paginaActual = 1;
const filasPorPagina = 10;
const CORREO_BODEGA = 'bodegapoolosorno@gmail.com';
const TIPOS_RECHAZO = ["Cliente rechaza", "Sin moradores", "Direccion erronea", "Orden mal generada", "Servicio operativo"];
let datosReporteActual = [];
 // Guardará los datos filtrados para exportar
let timeoutBienvenida = null;
 function esFechaFutura(fechaStr) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fechaIngreso = new Date(anio, mes - 1, dia);
    fechaIngreso.setHours(0, 0, 0, 0);
    return fechaIngreso >= hoy;
}

function esCargoTecnico(nombre) {
    if (!nombre) return false;
    // Normaliza: quita tildes y pasa a minúsculas
    const normalizado = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalizado.includes('tecnico');
}

function esCargoTecnicoPorId(cargoId) {
    const cargo = appData.cargos.find(c => c.id === cargoId);
    return cargo && esCargoTecnico(cargo.nombre);
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
    // Desactivar todos los botones del menú principal
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    // No activar ningún módulo al inicio

    // Desactivar todos los submenús
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    // Mostrar la imagen de bienvenida general
    mostrarPanel('modulo-bienvenida');
    const imagenModulo = document.getElementById('imagen-modulo');
    const tituloModulo = document.getElementById('titulo-modulo');
    if (imagenModulo) {
        imagenModulo.src = 'https://cdn-icons-png.flaticon.com/512/4976/4976857.png';
        // Imagen de bienvenida general
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
    // Activar botón del menú principal
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
    const botonActivo = document.querySelector(`#main-nav button[data-module="${moduloId}"]`);
    if (botonActivo) botonActivo.classList.add('active');

    // Activar submenú
    document.querySelectorAll('#sidebar .submenu').forEach(s => s.classList.remove('active'));
    const submenuActivo = document.getElementById(`submenu-${moduloId}`);
    if (submenuActivo) submenuActivo.classList.add('active');

    // Mostrar la imagen del módulo seleccionado
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
    // Mostrar u ocultar según el panel
    document.querySelectorAll('#main-content .content-panel').forEach(p => {
        p.style.display = (p.id === panelId) ? 'block' : 'none';
    });
    // Si es el panel de bienvenida, configurar imagen
    if (panelId === 'modulo-bienvenida') {
        const moduloActivo = document.querySelector('#main-nav button.active')?.dataset.module;
        if (moduloActivo) {
            const imagenModulo = document.getElementById('imagen-modulo');
            const tituloModulo = document.getElementById('titulo-modulo');
            let imgSrc = '';
            let titulo = '';
            switch (moduloActivo) {
                case 'dth':
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/3096/3096673.png';
                    titulo = 'Operaciones de Terreno (DTH)';
                    break;
                case 'rrhh':
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/2910/2910675.png';
                    titulo = 'Recursos Humanos';
                    break;
                case 'avance':
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/2972/2972220.png';
                    titulo = 'Reportes y Análisis';
                    break;
                case 'logistica':
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                    titulo = 'Gestión Logística';
                    break;
                default:
                    imgSrc = 'https://cdn-icons-png.flaticon.com/512/4976/4976857.png';
                    // Bienvenida general
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

    // Resto de tus cases (agendadas, rrhh, etc.)
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
        case 'panel-lista-personal': renderTablaPersonal(); break;
        case 'panel-ingreso-cliente': resetFormularioOrden(); break;
        case 'panel-nuevo-ingreso': setupFormularioNuevoIngreso(); break;
        case 'panel-liquidadas':
            // No mostrar nada hasta que se filtre
            document.querySelector('#tabla-liquidadas tbody').innerHTML = '';
            document.getElementById('paginacion')?.innerHTML = '';
            break;

        case 'panel-rechazadas':
            // No mostrar nada hasta que se filtre
            document.querySelector('#tabla-rechazadas tbody').innerHTML = '';
            document.getElementById('paginacion')?.innerHTML = '';
            break;
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
        case 'panel-transferencia':
            // Reiniciar el panel cada vez que se entra
            document.getElementById('tec-origen').value = '';
            document.getElementById('tec-destino').value = '';
            document.getElementById('stock-origen').style.display = 'none';
            document.getElementById('contenedor-destino').style.display = 'none';
            document.getElementById('btn-transferir').style.display = 'none';
            document.getElementById('lista-equipos-origen').innerHTML = '';
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
        // ❌ SE ELIMINÓ EL CASE DUPLICADO DE 'panel-asignacion-materiales'
    }
}
// ============================================
// --- Lógica del Formulario de Ingreso DTH ---
// ============================================
function validarNumeroOrden() {
    const numeroInput = document.getElementById('orden-numero');
    const numero = numeroInput?.value.trim();
    if (!numero) return mostrarToast("Por favor, ingrese un número de orden.", "error");
    
    // Mostrar paso 2 (solo región)
    document.getElementById('paso-1').style.display = 'none';
    document.getElementById('paso-2').style.display = 'block';
    
    // Cargar regiones
    const regionSelect = document.getElementById('orden-region');
    if (regionSelect) {
        populateSelect(regionSelect, Object.keys(appData.regiones).map(num => ({
            value: num,
            text: appData.regiones[num].nombre
        })), "Seleccione Región");
    }
}

function validarRutChileno(rutCompleto) {
    // Eliminar puntos y dejar solo números, guion y dígito
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

function requiereEquiposYSeries(servicio, subServicio) {
    const s = subServicio.trim();
    if (servicio === 'Instalacion' || servicio === 'Upgrade') {
        // Instalación y Upgrade: 1 serie por "Deco"
        const num = s.includes('1') ? 1 : s.includes('2') ? 2 : s.includes('3') ? 3 : s.includes('4') ? 4 : 0;
        return { tipo: 'instalacion', cantidad: num };
    }
    if (['VT', 'Garantia', 'Regularizacion'].includes(servicio)) {
        if (s.includes('Reparación') || s.includes('Reparacion')) {
            return null; // No requiere series
        }
        const num = s.includes('1') ? 1 : s.includes('2') ? 2 : s.includes('3') ? 3 : s.includes('4') ? 4 : 0;
        return { tipo: 'cambio', cantidad: num };
    }
    if (servicio === 'Traslado' && s === 'Traslado') {
        // Traslado: hasta 4, pero se definen manualmente
        return { tipo: 'traslado', cantidad: 4 }; // máx 4
    }
    return null; // No aplica
}

function cargarSubServicio(selectSub, selectServicio) {
    if (!selectSub || !selectServicio) return;
    const servicio = selectServicio.value;
    const subServicios = appData.servicios[servicio] || [];
    populateSelect(selectSub, subServicios.map(s => ({ value: s, text: s })), "Seleccione Sub Servicio");
}

function resetFormularioOrden() {
    document.getElementById('paso-1').style.display = 'block';
    document.getElementById('paso-2').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'none';
    // Limpiar campos
    document.getElementById('orden-numero').value = '';
    document.getElementById('orden-region').innerHTML = '<option value="">-- Seleccione Región --</option>';
    document.getElementById('form-ingreso-orden').reset();
    // Limpiar variables temporales
    delete window.numeroConSufijoTemporal;
    delete window.regionIdTemporal;
    delete window.ordenEnEdicion;
}

function guardarOrden(event) {
    event.preventDefault();

    const rut = document.getElementById('orden-rut')?.value.trim();
    const nombre = document.getElementById('orden-nombre')?.value.trim();
    const direccion = document.getElementById('orden-direccion')?.value.trim();
    const numeroContacto = document.getElementById('numeroContacto')?.value.trim();
    const comuna = document.getElementById('orden-comuna')?.value;
    const servicio = document.getElementById('orden-servicio')?.value;
    const subServicio = document.getElementById('orden-sub')?.value;
    const fecha = document.getElementById('orden-fecha')?.value;
    const tecnico = document.getElementById('orden-tecnico')?.value;
    const despacho = document.getElementById('orden-despacho')?.value;
    const observacion = document.getElementById('orden-observacion')?.value.trim();

    // === Validaciones básicas ===
    if (!rut || !nombre || !direccion || !comuna || !servicio || !subServicio || !fecha || !despacho) {
        return mostrarToast("Todos los campos marcados son obligatorios.", "error");
    }
    if (!validarRutChileno(rut)) {
        return mostrarToast("RUT inválido.", "error");
    }
    if (!esFechaFutura(fecha)) {
        return mostrarToast("La fecha de agenda debe ser hoy o futura.", "error");
    }

    // === Usar el número con sufijo ya validado ===
    const numeroConSufijo = window.numeroConSufijoTemporal;
    const regionId = window.regionIdTemporal;
    if (!numeroConSufijo || !regionId) {
        return mostrarToast("Error: número de orden o región no válidos.", "error");
    }
    const regionNombre = appData.regiones[regionId]?.nombre;

    // === Si estamos editando, actualizar ===
    if (window.ordenEnEdicion) {
        const index = ordenes.findIndex(o => o.id === window.ordenEnEdicion);
        if (index !== -1) {
            ordenes[index] = {
                ...ordenes[index],
                numero: numeroConSufijo,
                numeroBase: numeroConSufijo.replace(/-[RL]$/, ''),
                rut, nombre, direccion, numeroContacto,
                region: regionNombre, comuna, servicio, subServicio, fecha,
                tecnico, despacho, observacion
            };
            mostrarToast(`Orden ${numeroConSufijo} actualizada con éxito.`, "success");
            delete window.ordenEnEdicion;
            resetFormularioOrden();
            mostrarPanel('panel-agendadas');
            return;
        }
    }

    // === Crear nueva orden ===
    const nuevaOrden = {
        id: `orden-${Date.now()}`,
        numero: numeroConSufijo,
        numeroBase: numeroConSufijo.replace(/-[RL]$/, ''),
        rut, nombre, direccion, numeroContacto,
        region: regionNombre,
        comuna, servicio, subServicio, fecha,
        tecnico, despacho, observacion,
        estado: 'Agendada'
    };

    ordenes.unshift(nuevaOrden);
    mostrarToast(`Orden ${numeroConSufijo} guardada con éxito.`, "success");
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
        tr.dataset.orden = JSON.stringify(o); // <-- ESTA LÍNEA ES CLAVE
        tr.innerHTML = `
            <td style="color: #0056b3; text-decoration: underline; cursor: pointer;" onclick="cargarOrdenParaEdicion('${o.id}')">${o.numero}</td>
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
    const filas = document.querySelectorAll("#tabla-agendadas tbody tr");
    if (filas.length === 0 || !filas[0].dataset.orden) {
        return mostrarToast("No hay órdenes para enviar.", "error");
    }

    // Tomar solo la primera orden visible (asumiendo que se filtra por técnico)
    const ord = JSON.parse(filas[0].dataset.orden);

    const mensaje = `
Número de orden: ${ord.numero}
Nombre de cliente: ${ord.nombre}
Dirección: ${ord.direccion}
Comuna: ${ord.comuna}
Contacto: ${ord.numeroContacto || 'No disponible'}
Servicio: ${ord.servicio} / ${ord.subServicio}
Observación: ${ord.observacion || 'Sin observación'}

¡Éxito en el terreno!
    `.trim();

    const templateParams = {
        to_email: 'bodegapoolosorno@gmail.com',
        message: mensaje,
        subject: `Orden ${ord.numero} - Comercial Pool`
    };

    emailjs.send('TU_SERVICE_ID', 'TU_TEMPLATE_ID', templateParams)
        .then(() => mostrarToast('Correo enviado a bodegapoolosorno@gmail.com', 'success'))
        .catch(err => {
            console.error('Error EmailJS:', err);
            mostrarToast('Error al enviar correo', 'error');
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
    if (filas.length === 0 || filas[0].children.length < 8) return mostrarToast("No hay órdenes para enviar.", "error");

    let mensaje = `Hola ${tecnico.nombre1}, tienes ${filas.length} órdenes:\n\n`;

    filas.forEach(fila => {
        const num       = fila.children[0]?.textContent || '';
        const fecha     = fila.children[1]?.textContent || '';
        const subserv   = fila.children[2]?.textContent || '';
        const cliente   = fila.children[3]?.textContent || '';
        const rut       = fila.children[4]?.textContent || '';
        const direccion = fila.children[5]?.textContent || '';
        const comuna    = fila.children[6]?.textContent || '';
        const contacto  = ordenes.find(o => o.numero === num)?.numeroContacto || 'No disponible';
        const servicio  = ordenes.find(o => o.numero === num)?.servicio || '—';
        const obs       = ordenes.find(o => o.numero === num)?.observacion || '';

        mensaje += `• #${num} | ${fecha}
        Cliente: ${cliente}
        RUT: ${rut}
        Dirección: ${direccion}
        Comuna: ${comuna}
        Contacto: ${contacto}
        Servicio: ${servicio} / ${subserv}
        Obs: ${obs || 'Sin observación'}\n\n`;
        });

    mensaje += `¡Éxito en el terreno! 💪`;

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
                
                <p><strong>Fecha de Ingreso:</strong> ${emp.fechaIngreso ||
'—'}</p>
                <p><strong>Estado:</strong> ${emp.activo ?
'✅ Activo' : '❌ Inactivo'}</p>
                ${emp.observacion ?
`<p><strong>Observaciones:</strong> ${emp.observacion}</p>` : ''}
                <button class="btn-editar-colab" data-id="${emp.id}" style="margin-top:12px; background:#007bff; color:white; border:none; padding:8px 16px; border-radius:5px; cursor:pointer;">
                    ✏️ Editar
                </button>
            </div>
        `;
    });

    resultadoDiv.innerHTML = html;

    // Vincular botones de edición
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
    // Vincular eventos
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
        nombre1: document.getElementById('emp-nombre1')?.value ||
'',
        nombre2: document.getElementById('emp-nombre2')?.value ||
'',
        apepaterno: document.getElementById('emp-apepaterno')?.value ||
'',
        apematerno: document.getElementById('emp-apematerno')?.value ||
'',
        rut,
        telefono: document.getElementById('emp-telefono')?.value ||
'',
        direccion: document.getElementById('emp-direccion')?.value ||
'',
        region: document.getElementById('emp-region')?.value ||
'',
        comuna: document.getElementById('emp-comuna')?.value ||
'',
        fechaNacimiento: fechaNac,
        email: document.getElementById('emp-email')?.value ||
'',
        cargoId,
        fechaIngreso: document.getElementById('emp-fecha-ingreso')?.value ||
'',
        observacion: document.getElementById('emp-observacion')?.value ||
'',
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
    // ✅ Solo cargo, región y comuna (sin departamento)
    populateSelect(document.getElementById('editar-cargo'), appData.cargos.map(c => ({ value: c.id, text: c.nombre })), "Seleccione Cargo");
    populateSelect(document.getElementById('editar-region'), Object.keys(appData.regiones).map(num => ({ value: num, text: appData.regiones[num].nombre })), "Seleccione Región");
    
    document.getElementById('editar-cargo').value = empleado.cargoId;
    // ✅ Manejo de región/comuna
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
    // ✅ Mostrar campo de licencia si es técnico
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
        nombre1: document.getElementById('editar-nombre1')?.value ||
'',
        nombre2: document.getElementById('editar-nombre2')?.value || '',
        apepaterno: document.getElementById('editar-apepaterno')?.value ||
'',
        apematerno: document.getElementById('editar-apematerno')?.value || '',
        rut,
        telefono: document.getElementById('editar-telefono')?.value ||
'',
        direccion: document.getElementById('editar-direccion')?.value || '',
        region: document.getElementById('editar-region')?.options[document.getElementById('editar-region')?.selectedIndex]?.text ||
'',
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

    if (nuevoEstado === 'Liquidadas') {
        if (!orden.tecnico || orden.tecnico.trim() === '') {
            // Mostrar modal con mensaje y botón
            const modal = document.createElement('div');
            modal.id = 'modal-error-tecnico';
            modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 3000;`;
            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 400px;">
                    <h3 style="color: #dc3545; margin-top: 0;">❌ Error</h3>
                    <p>Debe asignar la orden a un técnico antes de liquidarla.</p>
                    <button id="btn-aceptar-error-tecnico" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px;">Aceptar</button>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('btn-aceptar-error-tecnico').addEventListener('click', () => {
                modal.remove();
                // Ir al formulario de ingreso para asignar técnico
                window.ordenEnEdicion = ordenId;
                cargarOrdenParaEdicion(ordenId); // ✅ esta función ya la creamos arriba
            });
            return;
        }

        // Si tiene técnico, continuar con liquidación
        const esquema = requiereEquiposYSeries(orden.servicio, orden.subServicio);
        if (esquema && esquema.cantidad > 0) {
            abrirFormularioLiquidacionCompleto(orden, esquema);
        } else {
            orden.estado = 'Liquidadas';
            guardarOrdenesFirebase();
            mostrarToast(`Orden ${orden.numero} liquidadas.`);
            actualizarTablasPostLiquidacion();
        }
    } else {
        // Otros estados
        orden.estado = nuevoEstado;
        guardarOrdenesFirebase();
        mostrarToast(`Orden ${orden.numero} marcada como ${nuevoEstado}.`);
        actualizarTablasPostLiquidacion();
    }
}

function actualizarTablasPostLiquidacion() {
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
           <div id="error-observacion" 
style="color: #dc3545; font-size: 0.85em; margin-top: 5px;
 display: none;">La observación es obligatoria.</div>
            </div>
            <div style="text-align: right;
margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" id="btnCancelarRechazo" style="background: #6c757d;
color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Cancelar</button>
                <button type="button" id="btnAceptarRechazo" disabled style="background: #ccc;
color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: not-allowed;">Aceptar</button>
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
        return;
        // Detiene la ejecución para no llamar a pivotUI
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
        empleados: appData.empleados  // ✅ Directo, sin map, sin delete
    }));
}

function cargarDatos() {
    const rrhhData = localStorage.getItem("rrhhData");
    if (rrhhData) {
        const datos = JSON.parse(rrhhData);
        appData.cargos = datos.cargos || [];
        appData.empleados = datos.empleados || [];
    } else {
        appData.empleados = [];
    }

    // ✅ 7 cargos predefinidos (no eliminables)
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

    // Usar la función 'esCargoTecnico' que ya tienes
    const tecnicos = appData.empleados
        .filter(emp => {
            const cargo = appData.cargos.find(c => c.id === emp.cargoId);
            return emp.activo && cargo && esCargoTecnico(cargo.nombre);
        })
        .map(emp => ({
            value: emp.id, // <-- Usamos el ID del empleado
            text: `${emp.nombre1} ${emp.apepaterno}`
        }));

    populateSelect(select, tecnicos, "Seleccione Técnico");
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

// [MODIFICADO source: 359]
function procesarExcelEquipos(file, articuloCodigo) { // <-- 1. RECIBE EL CÓDIGO
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
         
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // --- 2. VALIDAR EL ARTÍCULO ANTES DE SEGUIR ---
                const articulo = appData.articulos.seriados.find(a => a.codigo === articuloCodigo);
                if (!articulo) {
                    return reject(`[Error PEX] Código de artículo no encontrado: ${articuloCodigo}`);
                }
                // --- FIN VALIDACIÓN ---

                if (json.length < 2) return reject("Archivo vacío o sin datos.");
                const headers = json[0].map(h => h?.toString().trim().toLowerCase());
 
                let equipos = [];

                // --- 3. LÓGICA CORREGIDA ---
                if (headers.includes('serie1') && headers.includes('serie2')) {
                    // Si encuentra headers 'serie1' y 'serie2', los usa
                    const idxSerie1 = headers.findIndex(h => h === 'serie1');
                    const idxSerie2 = headers.findIndex(h => h === 'serie2');
                    
                    equipos = json.slice(1).map(row => ({
                        codigo: articuloCodigo, // <-- USA EL CÓDIGO DEL ARGUMENTO
                        nombreArticulo: articulo.nombre,
                        serie1: row[idxSerie1]?.toString().trim() || '',
                        serie2: row[idxSerie2]?.toString().trim() || ''
                    })).filter(eq => eq.serie1 || eq.serie2); // Solo necesita una serie para ser válido
                } else {
                    // Si no, asume 2 columnas por posición: Col0=serie1, Col1=serie2
                    // (Como dice la etiqueta HTML)
                    equipos = json.slice(1).map(row => ({
                        codigo: articuloCodigo, // <-- USA EL CÓDIGO DEL ARGUMENTO
                        nombreArticulo: articulo.nombre,
                        serie1: row[0]?.toString().trim() || '', // <-- Columna 0
                        serie2: row[1]?.toString().trim() || ''  // <-- Columna 1
                    })).filter(eq => eq.serie1 || eq.serie2);
                }
                // --- FIN LÓGICA CORREGIDA ---

                if (equipos.length === 0) return reject("No se encontraron series válidas en el archivo.");
                
                // [MODIFICADO source: 371]
                resolve(equipos);
            } catch (err) {
                // [MODIFICADO source: 372]
                reject(err.message || "Error al leer el archivo Excel.");
            }
        };
        reader.onerror = () => reject("Error al cargar el archivo.");
        reader.readAsArrayBuffer(file);
    });
}

// [MODIFICADO source: 373]
function procesarExcelTarjetas(file, articuloCodigo) { // <-- 1. RECIBE EL CÓDIGO
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
         
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // --- 2. VALIDAR EL ARTÍCULO ANTES DE SEGUIR ---
                const articulo = appData.articulos.ferreteria.find(a => a.codigo === articuloCodigo);
                if (!articulo) {
                    return reject(`[Error PTJ] Código de artículo no encontrado: ${articuloCodigo}`);
                }
                // --- FIN VALIDACIÓN ---

                if (json.length < 2) return reject("Archivo vacío o sin datos.");
                const headers = json[0].map(h => h?.toString().trim().toLowerCase());
 
                let tarjetas = [];

                // --- 3. LÓGICA CORREGIDA ---
                if (headers.includes('serie') || headers.includes('codigo')) { // Acepta 'serie' o 'codigo' como header
                    const idxSerie = headers.findIndex(h => h === 'serie' || h === 'codigo');
                    
                    tarjetas = json.slice(1).map(row => ({
                        codigo: articuloCodigo, // <-- USA EL CÓDIGO DEL ARGUMENTO
                        nombreArticulo: articulo.nombre,
                        serie: row[idxSerie]?.toString().trim() || ''
                    })).filter(t => t.serie);
                } else {
                    // Si no, asume 1 columna por posición: Col0=serie
                    // (Como dice la etiqueta HTML)
                    tarjetas = json.slice(1).map(row => ({
                        codigo: articuloCodigo, // <-- USA EL CÓDIGO DEL ARGUMENTO
                        nombreArticulo: articulo.nombre,
                        serie: row[0]?.toString().trim() || ''  // <-- Columna 0
                    })).filter(t => t.serie);
                }
                // --- FIN LÓGICA CORREGIDA ---

                if (tarjetas.length === 0) return reject("No se encontraron series válidas.");

                // [MODIFICADO source: 383]
                resolve(tarjetas);
            } catch (err) {
                // [MODIFICADO source: 384]
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

        // ✅ Inicializar si no existe
        if (!appData.ingresosSeriados) appData.ingresosSeriados = [];

        // ✅ Solo UNA vez esta lógica
        const guiaExistenteIndex = appData.ingresosSeriados.findIndex(ing => ing.guia === guia);
        if (guiaExistenteIndex > -1) {
            if (confirm(`La guía N° ${guia} ya fue ingresada. ¿Desea sobrescribirla?`)) {
                appData.ingresosSeriados[guiaExistenteIndex] = ingreso;
            } else {
                return mostrarToast("Ingreso cancelado.", "info");
            }
        } else {
            appData.ingresosSeriados.push(ingreso); // ✅ Esto es clave
        }

        // ✅ Guardar en localStorage
        localStorage.setItem('ingresosSeriados', JSON.stringify(appData.ingresosSeriados));

        mostrarModalConfirmacion(equipos.length, 'equipo', articuloCodigo, () => {
            document.getElementById('form-ingreso-seriados').reset();
        });

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
    // 🔍 Buscar en EQUIPOS (seriados)
    appData.ingresosSeriados?.forEach(ingreso => {
        ingreso.equipos?.forEach(eq => {
            if (eq.serie1.toLowerCase().includes(termino) || eq.serie2.toLowerCase().includes(termino)) {
                const articulo = appData.articulos.seriados.find(a => a.codigo === eq.codigo);
                let estado = 'En bodega';
                let detalle = '';

 
 
                // Verificar si está asignado a un técnico
                let asignadoATecnico = null;
                appData.empleados.forEach(emp => {
                    if (emp.activo && emp.stock?.equipos) {
                
  
        const equipoAsignado = emp.stock.equipos.find(e => 
                            e.serie1 === eq.serie1 && e.serie2 === eq.serie2 && e.articuloCodigo === eq.codigo
                        );
                        
                        if (equipoAsignado) 
 {
                            asignadoATecnico = `${emp.nombre1} ${emp.apepaterno}`;
                        }
                    }
                });
                if (asignadoATecnico) {
                    estado = 'Asignado a técnico';
                    detalle = asignadoATecnico;
                } else {
                    // Verificar si fue usado en una orden liquidadas
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
    // 🔍 Buscar en TARJETAS
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
                  
                    estado 
 = 'Asignado a técnico';
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
            html += `
    
 
             <div style="background:#f8f9fa; padding:14px; border-radius:8px; margin:12px 0; border-left:4px solid ${colorEstado}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
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
// Cargar materiales con stock disponible (CORREGIDA)
function cargarMaterialesAsignacion(tipo) {
    const select = document.getElementById('material-asignacion');
    if (!select) return;

    // Asegurar que los artículos estén cargados
    if (!appData.articulos.seriados) appData.articulos.seriados = [];
    if (!appData.articulos.ferreteria) appData.articulos.ferreteria = [];

    const ingresosSeriados = appData.ingresosSeriados || [];
    const ingresosTarjetas = appData.ingresosTarjetas || [];
    const empleados = appData.empleados || [];

    if (tipo === 'equipo') {
        // Obtener códigos de artículos que tienen stock en ingresosSeriados
        const codigosConStock = [...new Set(ingresosSeriados.map(ing => ing.articuloCodigo))];
        // Filtrar artículos seriados que están en ese listado
        const articulosDisponibles = appData.articulos.seriados.filter(art => 
            codigosConStock.includes(art.codigo)
        );
        // Calcular stock real (en bodega - asignado)
        const articulosConStock = articulosDisponibles.filter(articulo => {
            const enBodega = ingresosSeriados
                .filter(ing => ing.articuloCodigo === articulo.codigo)
                .reduce((total, ing) => total + (ing.equipos?.length || 0), 0);
            const asignados = empleados
                .reduce((total, emp) => {
                    const count = (emp.stock?.equipos || []).filter(eq => eq.articuloCodigo === articulo.codigo).length;
                    return total + count;
                }, 0);
            return (enBodega - asignados) > 0;
        });
        populateSelect(select, articulosConStock.map(a => ({ value: a.codigo, text: a.nombre })), "Seleccione Equipo");
    } else if (tipo === 'tarjeta') {
        const codigosConStock = [...new Set(ingresosTarjetas.map(ing => ing.articuloCodigo))];
        const articulosDisponibles = appData.articulos.ferreteria.filter(art => 
            codigosConStock.includes(art.codigo)
        );
        const articulosConStock = articulosDisponibles.filter(articulo => {
            const enBodega = ingresosTarjetas
                .filter(ing => ing.articuloCodigo === articulo.codigo)
                .reduce((total, ing) => total + (ing.tarjetas?.length || 0), 0);
            const asignadas = empleados
                .reduce((total, emp) => {
                    const count = (emp.stock?.tarjetas || []).filter(t => t.articuloCodigo === articulo.codigo)
                        .reduce((sum, t) => sum + (t.cantidad || 0), 0);
                    return total + count;
                }, 0);
            return (enBodega - asignadas) > 0;
        });
        populateSelect(select, articulosConStock.map(a => ({ value: a.codigo, text: a.nombre })), "Seleccione Tarjeta");
    }
}

// =======================================================
// --- LÓGICA DEL NUEVO PANEL: SALDO TÉCNICO ---
// =======================================================

// Función para inicializar el select de técnicos y el evento de cambio
function setupSaldoTecnico() {
    const select = document.getElementById('filtro-tecnico-saldo');
    if (!select) return;

    // Obtener la lista de técnicos activos
    const tecnicosActivos = appData.empleados
        .filter(emp => emp.activo && appData.cargos.find(c => c.id === emp.cargoId)?.nombre.toLowerCase().includes('tecnico'))
        .map(emp => ({ value: emp.id, text: `${emp.nombre1} ${emp.apepaterno}` }));
    // Cargar el select con la opción "Todos"
    // Usamos 'todos' como valor para el filtro global.
    populateSelect(select, tecnicosActivos, "Todos los Técnicos");
    
    // Cambiar el valor de la opción por defecto a 'todos' para el filtro
    const defaultOption = select.querySelector('option[value=""]');
    if (defaultOption) defaultOption.value = 'todos'; 

    // Agregar el listener para renderizar al cambiar la selección
    select.onchange = renderSaldoTecnico;
    // Renderizar con la opción por defecto (Todos) al cargar
    renderSaldoTecnico();
}

// Función para renderizar el stock asignado
function renderSaldoTecnico() {
    const tecnicoId = document.getElementById('filtro-tecnico-saldo')?.value;
    const detalleDiv = document.getElementById('detalle-stock');
    const totalSpan = document.getElementById('total-asignado');
    if (!detalleDiv || !totalSpan) return;

    detalleDiv.innerHTML = '';
    let empleadosAfectados = [];
    let totalStockGlobal = 0;
    if (tecnicoId === 'todos') {
        // Incluir a todos los técnicos activos
        empleadosAfectados = appData.empleados.filter(emp => 
            emp.activo && 
            appData.cargos.find(c => c.id === emp.cargoId)?.nombre.toLowerCase().includes('tecnico')
        );
    } else if (tecnicoId) {
        // Incluir solo al técnico seleccionado por ID
        const tecnico = appData.empleados.find(emp => emp.id === tecnicoId);
        if (tecnico) {
            empleadosAfectados.push(tecnico);
        }
    } else {
        // Caso inicial sin selección (Aunque el setup llama con 'todos')
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
        
                        `).join('') : `<tr><td colspan="5" style="text-align: center;
                        color: #6c757d; padding: 8px;">No tiene equipos seriados asignados.</td></tr>`}
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
// --- GENERAR GUIA DE ASIGNACION ---
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

function abrirFormularioLiquidacionCompleto(orden, esquema) {
    const modal = document.createElement('div');
    modal.id = 'modal-liquidacion-completa';
    modal.style = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px; box-sizing: border-box;`;

    // Generar inputs para decos y tarjetas
    let camposDecos = '';
    let camposTarjetas = '';
    for (let i = 1; i <= esquema.cantidad; i++) {
        camposDecos += `<div class="form-group"><label>Deco ${i}:</label><input type="text" name="deco${i}" placeholder="Serie del Deco ${i}" required></div>`;
        camposTarjetas += `<div class="form-group"><label>Tarjeta ${i}:</label><input type="text" name="tarjeta${i}" placeholder="Serie de tarjeta ${i}" required></div>`;
    }

    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin-top: 0;">✅ Liquidar Orden #${orden.numero}</h3>
            <p><strong>Servicio:</strong> ${orden.servicio} — ${orden.subServicio}</p>
            
            <div class="form-group">
                <label>Nombre de quien recibe:</label>
                <input type="text" id="liquida-nombre-recibe" placeholder="Nombre completo" required>
            </div>
            <div class="form-group">
                <label>Teléfono de contacto:</label>
                <input type="text" id="liquida-telefono" placeholder="Ej: 912345678" required>
            </div>
            <div class="form-group">
                <label>Coordenadas (opcional):</label>
                <input type="text" id="liquida-coordenadas" placeholder="Ej: -40.5731, -73.1352">
            </div>
            <div class="form-group">
                <label>Observación:</label>
                <textarea id="liquida-observacion" rows="3" placeholder="Notas adicionales..."></textarea>
            </div>

            <h4 style="margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Equipos Instalados</h4>
            ${camposDecos}

            <h4 style="margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Tarjetas Asociadas</h4>
            ${camposTarjetas}

            <div style="text-align: right; margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" id="btn-cancelar-liquida" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px;">Cancelar</button>
                <button type="button" id="btn-confirmar-liquida" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px;">✅ Confirmar Liquidación</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Cancelar
    document.getElementById('btn-cancelar-liquida').addEventListener('click', () => {
        modal.remove();
        mostrarToast("Liquidación cancelada.", "info");
    });

    // Confirmar
    document.getElementById('btn-confirmar-liquida').addEventListener('click', () => {
        const nombreRecibe = document.getElementById('liquida-nombre-recibe').value.trim();
        const telefono = document.getElementById('liquida-telefono').value.trim();
        const coordenadas = document.getElementById('liquida-coordenadas').value.trim();
        const observacion = document.getElementById('liquida-observacion').value.trim();

        if (!nombreRecibe || !telefono) {
            return mostrarToast("Nombre de quien recibe y teléfono son obligatorios.", "error");
        }

        // Leer decos y tarjetas
        const decos = [];
        const tarjetas = [];
        for (let i = 1; i <= esquema.cantidad; i++) {
            const deco = document.querySelector(`[name="deco${i}"]`).value.trim();
            const tarj = document.querySelector(`[name="tarjeta${i}"]`).value.trim();
            if (!deco || !tarj) {
                return mostrarToast(`Debe completar Deco ${i} y Tarjeta ${i}.`, "error");
            }
            decos.push(deco);
            tarjetas.push(tarj);
        }

        // Guardar en la orden
        orden.estado = 'Liquidadas';
        orden.liquidacion = {
            fecha: new Date().toISOString().split('T')[0],
            nombreRecibe,
            telefono,
            coordenadas,
            observacion,
            decos,
            tarjetas
        };

        guardarOrdenesFirebase();
        mostrarToast(`✅ Orden ${orden.numero} liquidadas con ${esquema.cantidad} deco(s).`);
        modal.remove();
        actualizarTablasPostLiquidacion();
    });
}

// === CLICK EN FILA → EDITAR ORDEN ===
document.getElementById('main-content').addEventListener('click', function(e) {
    const fila = e.target.closest('#tabla-agendadas tbody tr');
    if (!fila || !fila.dataset.orden) return;

    const ord = JSON.parse(fila.dataset.orden);
    
    // Mostrar formulario de ingreso
    mostrarPanel('');
    document.getElementById('ingreso-paso-1').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'block';
    
    // Rellenar campos
    document.getElementById('orden-numero').value = ord.numero;
    document.getElementById('orden-rut').value = ord.rut;
    document.getElementById('orden-nombre').value = ord.nombre;
    document.getElementById('orden-direccion').value = ord.direccion;
    document.getElementById('numeroContacto').value = ord.numeroContacto || '';
    document.getElementById('orden-region').value = Object.keys(appData.regiones).find(k => appData.regiones[k].nombre === ord.region) || '';
    cargarComunas(document.getElementById('orden-comuna'), document.getElementById('orden-region'));
    setTimeout(() => { document.getElementById('orden-comuna').value = ord.comuna; }, 10);
    document.getElementById('orden-fecha').value = ord.fecha;
    document.getElementById('orden-despacho').value = ord.despacho;
    document.getElementById('orden-tecnico').value = ord.tecnico;
    document.getElementById('orden-servicio').value = ord.servicio;
    cargarSubServicio(document.getElementById('orden-sub'), document.getElementById('orden-servicio'));
    setTimeout(() => { document.getElementById('orden-sub').value = ord.subServicio; }, 10);
    document.getElementById('orden-observacion').value = ord.observacion || '';
    
    // Marcar que estamos editando (opcional, para diferenciar en guardarOrden)
    window.ordenEnEdicion = ord.id;
});

function validarCombinacion() {
    const numeroBase = document.getElementById('orden-numero')?.value.trim();
    const regionId = document.getElementById('orden-region')?.value;
    if (!numeroBase || !regionId) {
        return mostrarToast("Complete número de orden y región.", "error");
    }
    // Aplicar sufijo
    const sufijo = (regionId === "15") ? "-R" : "-L";
    const numeroConSufijo = numeroBase + sufijo;
    // Validar duplicado
    if (ordenes.some(o => o.numero === numeroConSufijo)) {
        return mostrarToast(`La orden ${numeroConSufijo} ya existe en esa región.`, "error");
    }
    // ✅ Todo OK → mostrar formulario completo
    document.getElementById('paso-2').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'block';
    
    // Guardar para usar en guardarOrden
    window.numeroConSufijoTemporal = numeroConSufijo;
    window.regionIdTemporal = regionId;
    
    // Configurar fecha mínima = hoy
    document.getElementById('orden-fecha').min = new Date().toISOString().split('T')[0];
    
    // Cargar listas dinámicas
    cargarComunas(document.getElementById('orden-comuna'), document.getElementById('orden-region'));
    actualizarPersonalDTH();
    const servicioSelect = document.getElementById('orden-servicio');
    if (servicioSelect) {
        populateSelect(servicioSelect, Object.keys(appData.servicios).map(s => ({ value: s, text: s })), "Seleccione Servicio");
        servicioSelect.onchange = () => cargarSubServicio(document.getElementById('orden-sub'), servicioSelect);
    }
    // Enfocar RUT
    document.getElementById('orden-rut')?.focus();
}

// ============================================
// --- INICIALIZACIÓN DE LA APLICACIÓN ---
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    cargarDatosLogistica();
    emailjs.init("jzFJsfyQK4_babi6V");
    // =======================================================
    // --- BLOQUE DE CARGA DE STOCK (SEGURO) ---
    // =======================================================
    try {
        const ingresosSeriadosData = localStorage.getItem('ingresosSeriados');
        if (ingresosSeriadosData && ingresosSeriadosData !== 'null') {
            appData.ingresosSeriados = JSON.parse(ingresosSeriadosData) || [];
        } else {
            appData.ingresosSeriados = []; // Asegura que sea un array
        }
    } catch (e) {
        console.error("Error al cargar ingresosSeriados:", e);
        appData.ingresosSeriados = []; // En caso de error, es un array
    }

    try {
        const ingresosTarjetasData = localStorage.getItem('ingresosTarjetas');
        if (ingresosTarjetasData && ingresosTarjetasData !== 'null') {
            appData.ingresosTarjetas = JSON.parse(ingresosTarjetasData) || [];
        } else {
            appData.ingresosTarjetas = []; // Asegura que sea un array
        }
    } catch (e) {
        console.error("Error al cargar ingresosTarjetas:", e);
        appData.ingresosTarjetas = []; // En caso de error, es un array
    }
    // =======================================================
    // --- FIN DEL BLOQUE ---
    // =======================================================
    // === CARGAR TRANSFERENCIA DE MATERIALES ===
    const tecnicosTransferencia = appData.empleados
        .filter(e => e.activo && esCargoTecnicoPorId(e.cargoId))
        .map(e => ({ id: e.id, text: `${e.nombre1} ${e.apepaterno}` }));
    if (document.getElementById('tec-origen')) {
        populateSelect(document.getElementById('tec-origen'), tecnicosTransferencia, "Seleccione Origen");
    }
    if (document.getElementById('tec-destino')) {
        populateSelect(document.getElementById('tec-destino'), tecnicosTransferencia, "Seleccione Destino");
    }
    actualizarPersonalDTH();

        const safeAddListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    // Paso 1 → Paso 2
    document.getElementById('btnSiguientePaso1')?.addEventListener('click', validarNumeroOrden);

    // Paso 2 → Validar combinación
    document.getElementById('btnValidarCombinacion')?.addEventListener('click', validarCombinacion);

    // Volver de paso 2 a paso 1
    document.getElementById('btnVolverPaso1')?.addEventListener('click', () => {
        document.getElementById('paso-2').style.display = 'none';
        document.getElementById('paso-1').style.display = 'block';
    });

// Cancelar ingreso
document.getElementById('btnCancelarIngreso')?.addEventListener('click', resetFormularioOrden);
    // === NAVEGACIÓN PRINCIPAL Y SUBMENÚS ===
    document.querySelectorAll('#main-nav button[data-module]').forEach(button => {
        button.addEventListener('click', () => seleccionarModulo(button.dataset.module));
    });

    // === LISTENER ÚNICO PARA EL SIDEBAR (Corregido) ===
    document.querySelectorAll('#sidebar button[data-panel]').forEach(button => {
        button.addEventListener('click', () => {
            const panelId = button.dataset.panel;
            mostrarPanel(panelId);
    
            // Lógica específica por panel
            if (panelId === 'panel-ingreso-seriados' ||
            panelId === 'panel-ingreso-no-seriados') {
                cargarArticulosEnSelects();
            }
            // -- ASIGNACION DE MATERIALES -- 
            
            if (panelId === 'panel-asignacion-materiales') {
    // 
    // Llama a la NUEVA lógica que prepara el panel
    inicializarAsignacion(); //
        // === CARGAR TRANSFERENCIA DE MATERIALES (CORREGIDO) ===
    function esTecnicoPorId(cargoId) {
        const cargo = appData.cargos.find(c => c.id === cargoId);
        return cargo && esCargoTecnico(cargo.nombre);
    }

    function cargarTecnicosTransferencia() {
        const tecnicos = appData.empleados
            .filter(e => e.activo && esTecnicoPorId(e.cargoId))
            .map(e => ({ id: e.id, text: `${e.nombre1} ${e.apepaterno}` }));
        populateSelect(document.getElementById('tec-origen'), tecnicos, "Seleccione Origen");
        populateSelect(document.getElementById('tec-destino'), tecnicos, "Seleccione Destino");
    }

    // === LISTENERS DE TRANSFERENCIA ===
    function setupTransferencia() {
        const origenSelect = document.getElementById('tec-origen');
        if (!origenSelect) return;

        origenSelect.addEventListener('change', function () {
            const origenId = this.value;
            const contenedor = document.getElementById('stock-origen');
            contenedor.style.display = origenId ? 'block' : 'none';

            if (!origenId) {
                document.getElementById('contenedor-destino').style.display = 'none';
                document.getElementById('btn-transferir').style.display = 'none';
                return;
            }

            const tecnico = appData.empleados.find(e => e.id === origenId);
            const lista = document.getElementById('lista-equipos-origen');
            lista.innerHTML = '';

            if (!tecnico?.stock?.equipos?.length) {
                lista.innerHTML = '<p style="color:#6c757d;">No tiene equipos asignados.</p>';
                document.getElementById('contenedor-destino').style.display = 'block';
                document.getElementById('btn-transferir').style.display = 'none';
                return;
            }

            let html = '';
            tecnico.stock.equipos.forEach((eq, index) => {
                const articulo = appData.articulos.seriados.find(a => a.codigo === eq.articuloCodigo)?.nombre || 'Desconocido';
                html += `
                    <div style="padding:10px; border:1px solid #eee; margin:8px 0; border-radius:6px; display:flex; align-items:center;">
                        <input type="checkbox" class="equipo-a-transferir" data-index="${index}" data-id="${eq.articuloCodigo}-${eq.serie1}">
                        <div style="margin-left:12px;">
                            <strong>${articulo}</strong><br>
                            Serie: ${eq.serie1} / ${eq.serie2}<br>
                            Guía: ${eq.guiaAsignacion || '—'}
                        </div>
                    </div>
                `;
            });
            lista.innerHTML = html;
            document.getElementById('contenedor-destino').style.display = 'block';
            document.getElementById('btn-transferir').style.display = 'block';
        });

        safeAddListener('btn-transferir', 'click', function () {
            const origenId = document.getElementById('tec-origen').value;
            const destinoId = document.getElementById('tec-destino').value;
            if (!origenId || !destinoId) return mostrarToast("Seleccione origen y destino.", "error");
            if (origenId === destinoId) return mostrarToast("El origen y destino no pueden ser el mismo.", "error");
            const checkboxes = document.querySelectorAll('.equipo-a-transferir:checked');
            if (checkboxes.length === 0) return mostrarToast("Seleccione al menos un equipo.", "error");

            const origen = appData.empleados.find(e => e.id === origenId);
            const destino = appData.empleados.find(e => e.id === destinoId);
            const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
            const equiposTransferir = indices.map(i => origen.stock.equipos[i]);

            // Eliminar del origen
            origen.stock.equipos = origen.stock.equipos.filter((_, i) => !indices.includes(i));
            // Agregar al destino
            if (!destino.stock) destino.stock = { equipos: [], tarjetas: [] };
            destino.stock.equipos.push(...equiposTransferir);
            // Guardar
            guardarDatosRRHH();
            mostrarToast(`✅ Transferidos ${equiposTransferir.length} equipos de ${origen.nombre1} a ${destino.nombre1}.`, "success");
            // Reset
            resetPanelTransferencia();
        });
    }

    // Función para resetear el panel
    function resetPanelTransferencia() {
        document.getElementById('tec-origen').value = '';
        document.getElementById('tec-destino').value = '';
        document.getElementById('stock-origen').style.display = 'none';
        document.getElementById('contenedor-destino').style.display = 'none';
        document.getElementById('btn-transferir').style.display = 'none';
        document.getElementById('lista-equipos-origen').innerHTML = '';
    }

    // Llamar al inicializar el panel
    cargarTecnicosTransferencia();
    setupTransferencia();

}
        });
    });

    // GUARDA LA ASIGNACION DE EQUIPOS
    function guardarAsignacion(form) {
        const tecnicoId = form.querySelector('#tecnico-asignacion').value;
        const tipo = form.querySelector('#tipo-asignacion').value;
        const materialCodigo = form.querySelector('#material-asignacion').value;

    if (!tecnicoId || !tipo || !materialCodigo) {
            return mostrarToast("Complete todos los campos: Técnico, Tipo y Material.", "error");
        }
        const tecnico = appData.empleados.find(emp => emp.id === tecnicoId);
    if (!tecnico) return mostrarToast("Técnico no encontrado.", "error");
    if (!tecnico.stock) {tecnico.stock = { equipos: [], tarjetas: [] };}
    if (tipo === 'equipo') {
        const seriesIngresadasNodes = form.querySelectorAll('#lista-series-ingresadas div');
        const series = Array.from(seriesIngresadasNodes).map(div => div.textContent);
        
        if (series.length === 0) {
            return mostrarToast("Debe agregar al menos una serie.", "error");
        }
        series.forEach(serie => {
            tecnico.stock.equipos.push({
                articuloCodigo: materialCodigo,
                serie1: serie,
                serie2: '',
                fechaAsignacion: new Date().toISOString().split('T')[0]
            });
        });        
        mostrarToast(`Se asignaron ${series.length} equipos a ${tecnico.nombre1}.`);
        enviarCorreoAsignacion(tecnico, series, materialCodigo);
    } else if (tipo === 'tarjeta') {
        
        const cantidadInput = form.querySelector('#cantidad-asignar');
        const cantidad = parseInt(cantidadInput.value);
        
        if (!cantidad || cantidad <= 0) {
            return mostrarToast("La cantidad debe ser mayor a 0.", "error");
        }
        
        // --- Validación de Stock (Paso 4) ---
        // (Faltaría implementar la lógica de stock de tarjetas)
        
        const registroExistente = tecnico.stock.tarjetas.find(t => t.articuloCodigo === materialCodigo);
        if (registroExistente) {
            registroExistente.cantidad += cantidad;
        } else {
            tecnico.stock.tarjetas.push({
                articuloCodigo: materialCodigo,
                cantidad,
                fechaAsignacion: new Date().toISOString().split('T')[0]
            });
        }
        mostrarToast(`Se asignaron ${cantidad} tarjetas a ${tecnico.nombre1}.`);
        
        // --- Lógica de Email (Paso 5) ---
        enviarCorreoAsignacion(tecnico, cantidad, materialCodigo);
    }

    guardarDatosRRHH(); // Guarda el stock actualizado del técnico
    form.reset();
    form.querySelector('#contenedor-series').style.display = 'none';
    form.querySelector('#contenedor-cantidad').style.display = 'none';
    form.querySelector('#contenedor-asignar-final').style.display = 'none';
    form.querySelector('#lista-series-ingresadas').innerHTML = '';
    form.querySelector('#material-asignacion').innerHTML = '<option value="">-- Seleccione tipo primero --</option>';
}

// === LISTENERS DE TRANSFERENCIA ===
safeAddListener('tec-origen', 'change', function() {
    const origenId = this.value;
    const contenedor = document.getElementById('stock-origen');
    contenedor.style.display = 'block';
    if (!origenId) {
        contenedor.style.display = 'none';
        return;
    }
    const tecnico = appData.empleados.find(e => e.id === origenId);
    const lista = document.getElementById('lista-equipos-origen');
    lista.innerHTML = '';
    if (!tecnico?.stock?.equipos?.length) {
        lista.innerHTML = '<p style="color:#6c757d;">No tiene equipos asignados.</p>';
        return;
    }
    let html = '';
    tecnico.stock.equipos.forEach((eq, index) => {
        const articulo = appData.articulos.seriados.find(a => a.codigo === eq.articuloCodigo)?.nombre || eq.articuloCodigo;
        html += `
            <div style="padding:10px; border:1px solid #eee; margin:8px 0; border-radius:6px; display:flex; align-items:center;">
                <input type="checkbox" class="equipo-a-transferir" data-index="${index}" data-id="${eq.articuloCodigo}-${eq.serie1}">
                <div style="margin-left:12px;">
                    <strong>${articulo}</strong><br>
                    Serie: ${eq.serie1} / ${eq.serie2}<br>
                    Guía: ${eq.guiaAsignacion || '—'}
                </div>
            </div>
        `;
    });
    lista.innerHTML = html;
    document.getElementById('contenedor-destino').style.display = 'block';
    document.getElementById('btn-transferir').style.display = 'block';
});

safeAddListener('btn-transferir', 'click', function() {
    const origenId = document.getElementById('tec-origen').value;
    const destinoId = document.getElementById('tec-destino').value;
    if (!origenId || !destinoId) return mostrarToast("Seleccione origen y destino.", "error");
    if (origenId === destinoId) return mostrarToast("El origen y destino no pueden ser el mismo.", "error");
    const checkboxes = document.querySelectorAll('.equipo-a-transferir:checked');
    if (checkboxes.length === 0) return mostrarToast("Seleccione al menos un equipo.", "error");
    const origen = appData.empleados.find(e => e.id === origenId);
    const destino = appData.empleados.find(e => e.id === destinoId);
    // Extraer los equipos seleccionados
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    const equiposTransferir = indices.map(i => origen.stock.equipos[i]);
    // Eliminar del origen
    origen.stock.equipos = origen.stock.equipos.filter((_, i) => !indices.includes(i));
    // Agregar al destino
    if (!destino.stock) destino.stock = { equipos: [], tarjetas: [] };
    destino.stock.equipos.push(...equiposTransferir);
    // Guardar
    guardarDatosRRHH();
    mostrarToast(`✅ Transferidos ${equiposTransferir.length} equipos de ${origen.nombre1} a ${destino.nombre1}.`, "success");
    // Reset
    document.getElementById('tec-origen').value = '';
    document.getElementById('stock-origen').style.display = 'none';
    document.getElementById('contenedor-destino').style.display = 'none';
    document.getElementById('btn-transferir').style.display = 'none';
});

    // === LISTENERS DE BOTONES Y FORMULARIOS (Safe) ===
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

    // === LISTENERS DE SUBMIT DE FORMULARIOS ===
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

    const formEditarEmpleado = document.getElementById('form-editar-empleado');
    if (formEditarEmpleado) formEditarEmpleado.addEventListener('submit', guardarEdicionEmpleado);

    // === LISTENERS PARA BÚSQUEDA CON 'ENTER' ===
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

    // === LISTENER PARA REPORTES RRHH ===
    const reportesRRHH = document.querySelector('#reportes-rrhh .report-buttons');
    if (reportesRRHH) {
        reportesRRHH.addEventListener('click', (e) => {
            if (e.target.dataset.reportType) exportarExcelRRHH(e.target.dataset.reportType);
        });
    }

    // === LISTENERS DE VALIDACIÓN/FORMATO DE RUT ===
    ['orden-rut', 'emp-rut', 'editar-rut'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => formatearRut(e.target));
            el.addEventListener('blur', (e) => validarRutInput(e.target));
        }
    });
    // === LISTENER PARA LOGIN CON 'ENTER' ===
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && document.getElementById('login-container').style.display !== 'none') {
            event.preventDefault();
            login();
        }
    });
    // === LÓGICA DE FORMATEO DE RUT (Helper) ===
    function formatearRut(inputElement) {
        let valor = inputElement.value.replace(/[^0-9kK]/g, '').toLowerCase();
        if (!valor) return;
        let cuerpo = valor.slice(0, -1);
        let dv = valor.slice(-1);
        cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        inputElement.value = cuerpo + '-' + dv;
    }
});

// ================================
// NUEVA LÓGICA DE ASIGNACIÓN
// ================================

let asignacionActiva = {
    tipo: null,
    materialCodigo: null,
    cantidad: 0,
    seriesIngresadas: [],
    tecnicoNombre: null,
    tecnicoId: null
};

// Envía correos simulados (mailto)
function enviarCorreoAsignacion(tecnico, tipo, codigo, detalle, guia) {
    const articulo = tipo === 'equipo'
        ? appData.articulos.seriados.find(a => a.codigo === codigo)
        : appData.articulos.ferreteria.find(a => a.codigo === codigo);

    const nombreArticulo = articulo?.nombre || codigo;

    let cuerpo = `Hola ${tecnico.nombre1},\n\n`;
    cuerpo += `Se ha generado la asignación con guía: **${guia}**\n\n`;
    cuerpo += `Material: ${nombreArticulo} (${codigo})\n\n`;

    if (tipo === 'equipo') {
        cuerpo += `Series asignadas (${detalle.length}):\n`;
        detalle.forEach(eq => {
            cuerpo += `- ${eq.serie1} / ${eq.serie2}\n`;
        });
    } else {
        cuerpo += `Cantidad asignada: ${detalle}\n`;
    }
    
    const templateParams = {
        to_email: tecnico.email || 'bodegapoolosorno@gmail.com', // fallback
        to_name: tecnico.nombre1,
        subject: `Asignación de Material - Guía ${guia}`,
        message: cuerpo
    };

    // ✅ Enviar correo SIN salir de la app
    emailjs.send('service_8p2y4a6', 'template_m8313jl', templateParams)
        .then(() => {
            mostrarToast(`✅ Correo enviado a ${tecnico.nombre1}`, "success");
        })
        .catch((error) => {
            console.error("Error al enviar correo:", error);
            mostrarToast("⚠️ No se pudo enviar el correo (revisar consola)", "error");
        });

    // ✅ Enviar copia a bodega
    setTimeout(() => {
        emailjs.send('service_8p2y4a6', 'template_m8313jl', {
            to_email: CORREO_BODEGA,
            to_name: 'Bodega',
            subject: `[COPIA BODEGA] Asignación - Guía ${guia}`,
            message: cuerpo + "\n\n--- COPIA DE RESPALDO PARA BODEGA ---"
        }).catch(console.error);
    }, 500);
}

// Validación y asignación final
function procesarAsignacionFinal() {
    const { tipo, materialCodigo, cantidad, seriesIngresadas, tecnicoNombre, tecnicoId } = asignacionActiva;
    // ✅ Validar duplicados DENTRO de la misma asignación
    const seriesUnicas = [...new Set(seriesIngresadas)];
    if (seriesUnicas.length !== seriesIngresadas.length) {
        return mostrarToast("No puede asignar la misma serie más de una vez.", "error");
    }
    const tecnico = appData.empleados.find(e => e.id === tecnicoId);
    if (!tecnico) return mostrarToast("Técnico no válido.", "error");

    // === EQUIPOS ===
    if (tipo === 'equipo') {
        const seriesValidas = [];
        for (const serie of seriesIngresadas) {
            let encontrado = false;
            for (const ingreso of (appData.ingresosSeriados || [])) {
                if (ingreso.articuloCodigo !== materialCodigo) continue;
                for (const eq of (ingreso.equipos || [])) {
                    if ((eq.serie1 === serie || eq.serie2 === serie)) {
                        // Verificar que NO esté asignado
                        const yaAsignado = appData.empleados.some(emp =>
                            emp.stock?.equipos?.some(e =>
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
            if (!encontrado) {
                return mostrarToast(`La serie "${serie}" no existe o ya está asignada.`, "error");
            }
        }

        // Asignar
        const guia = generarGuiaAsignacion();
        seriesValidas.forEach(eq => {
            tecnico.stock.equipos.push({
                articuloCodigo: materialCodigo,
                serie1: eq.serie1,
                serie2: eq.serie2,
                fechaAsignacion: new Date().toISOString().split('T')[0],
                guiaAsignacion: guia
            });
        });
        guardarDatosRRHH();
        mostrarToast(`✅ Asignadas ${seriesValidas.length} series. Guía: ${guia}`);
        enviarCorreoAsignacion(tecnico, 'equipo', materialCodigo, seriesValidas, guia);

    // === TARJETAS ===
    } else if (tipo === 'tarjeta') {
        const enBodega = (appData.ingresosTarjetas || [])
            .filter(ing => ing.articuloCodigo === materialCodigo)
            .reduce((sum, ing) => sum + ing.tarjetas.length, 0);
        const asignadas = appData.empleados.reduce((sum, emp) => {
            return sum + (emp.stock?.tarjetas?.find(t => t.articuloCodigo === materialCodigo)?.cantidad || 0);
        }, 0);
        if (cantidad > (enBodega - asignadas)) {
            return mostrarToast(`Stock insuficiente. Disponible: ${enBodega - asignadas}`, "error");
        }

        const guia = generarGuiaAsignacion();
        const registro = tecnico.stock.tarjetas.find(t => t.articuloCodigo === materialCodigo);
        if (registro) {
            registro.cantidad += cantidad;
            registro.guiaAsignacion = guia;
        } else {
            tecnico.stock.tarjetas.push({
                articuloCodigo: materialCodigo,
                cantidad,
                fechaAsignacion: new Date().toISOString().split('T')[0],
                guiaAsignacion: guia
            });
        }
        guardarDatosRRHH();
        mostrarToast(`✅ Asignadas ${cantidad} unidades. Guía: ${guia}`);
        enviarCorreoAsignacion(tecnico, 'tarjeta', materialCodigo, cantidad, guia);
    }

    resetAsignacion();
    mostrarToast("✅ Asignación completada con éxito.", "success");

    // Crear modal personalizado
    const modal = document.createElement('div');
    modal.id = 'modal-asignacion-exitosa';
    modal.style = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
    `;
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%;">
            <h3 style="margin-top: 0; color: #007bff;">✅ Asignación Exitosa</h3>
            <p>¿Desea asignar más material?</p>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button id="btn-asignar-otro" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px;">Sí, asignar más</button>
                <button id="btn-finalizar-asignacion" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px;">Finalizar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Eventos del modal
    document.getElementById('btn-asignar-otro').addEventListener('click', () => {
        modal.remove();
        document.getElementById('tipo-asignacion').value = '';
        document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione --</option>';
        mostrarPanel('panel-asignacion-materiales');
    });

    document.getElementById('btn-finalizar-asignacion').addEventListener('click', () => {
        modal.remove();
        mostrarToast("✅ Asignación completada con éxito.", "success"); // o el panel que quieras (ej: bienvenida)
    });
    }

    // [FUNCIÓN CORREGIDA]
    function resetAsignacion() {
    asignacionActiva = { tipo: null, materialCodigo: null, cantidad: 0, seriesIngresadas: [], tecnicoNombre: null, tecnicoId: null };

    // --- AÑADIDO: Resetear el formulario ---
    const tecnicoSelect = document.getElementById('tecnico-asignacion');
    const tipoSelect = document.getElementById('tipo-asignacion');
    const materialSelect = document.getElementById('material-asignacion');
    
    // Resetea los selects
    if (tecnicoSelect) tecnicoSelect.value = '';
    if (tipoSelect) tipoSelect.value = '';
    if (materialSelect) materialSelect.innerHTML = '<option value="">-- Seleccione tipo --</option>';

    // Resetea los inputs
    document.getElementById('cantidad-asignar').value = '';
    document.getElementById('input-serie').value = '';
    document.getElementById('lista-series-ingresadas').innerHTML = '';

    // Oculta los contenedores
    document.getElementById('contenedor-cantidad').style.display = 'none';
    document.getElementById('contenedor-ingreso-series').style.display = 'none';
    document.getElementById('contenedor-asignar-final').style.display = 'none';
}

// ================================
// INICIALIZAR ASIGNACIÓN (al mostrar el panel)
// ================================
function inicializarAsignacion() {
    resetAsignacion();
    cargarTecnicosAsignacion();
    cargarMaterialesAsignacion(''); // limpia el select de materiales

    // --- Técnico ---
    document.getElementById('tecnico-asignacion')?.addEventListener('change', function() {
        const tecnicoId = this.value;
        const emp = appData.empleados.find(e => e.id === tecnicoId);
        asignacionActiva.tecnicoNombre = emp ? `${emp.nombre1} ${emp.apepaterno}` : null;
        asignacionActiva.tecnicoId = tecnicoId || null;
    });

    // --- Tipo ---
    document.getElementById('tipo-asignacion')?.addEventListener('change', function() {
        const tipo = this.value;
        asignacionActiva.tipo = tipo;
        asignacionActiva.materialCodigo = null;
        asignacionActiva.cantidad = 0;
        asignacionActiva.seriesIngresadas = [];
        document.getElementById('contenedor-cantidad').style.display = 'none';
        document.getElementById('contenedor-ingreso-series').style.display = 'none';
        document.getElementById('contenedor-asignar-final').style.display = 'none';
        document.getElementById('lista-series-ingresadas').innerHTML = '';
        if (tipo) {
            cargarMaterialesAsignacion(tipo);
        } else {
            document.getElementById('material-asignacion').innerHTML = '<option value="">-- Seleccione tipo --</option>';
        }
    });

    // --- Material ---
    document.getElementById('material-asignacion')?.addEventListener('change', function() {
        const codigo = this.value;
        asignacionActiva.materialCodigo = codigo;
        document.getElementById('contenedor-cantidad').style.display = codigo ? 'block' : 'none';
        document.getElementById('contenedor-ingreso-series').style.display = 'none';
        document.getElementById('contenedor-asignar-final').style.display = 'none';
        document.getElementById('cantidad-asignar').value = '';
        document.getElementById('input-serie').value = '';
    });

    // --- Confirmar cantidad ---
    document.getElementById('btn-confirmar-cantidad')?.addEventListener('click', function() {
        const cantidad = parseInt(document.getElementById('cantidad-asignar').value);
        if (!cantidad || cantidad <= 0) return mostrarToast("Cantidad inválida.", "error");
        asignacionActiva.cantidad = cantidad;
        if (asignacionActiva.tipo === 'tarjeta') {
            document.getElementById('contenedor-asignar-final').style.display = 'block';
        } else if (asignacionActiva.tipo === 'equipo') {
            document.getElementById('contenedor-ingreso-series').style.display = 'block';
            document.getElementById('input-serie').focus();
        }
    });

    // --- Agregar serie (SIN validación de duplicados locales) ---
    document.getElementById('btn-agregar-serie')?.addEventListener('click', function() {
        const input = document.getElementById('input-serie');
        const serie = input.value.trim();
        if (!serie) return mostrarToast("Ingrese una serie.", "error");
        if (asignacionActiva.seriesIngresadas.length >= asignacionActiva.cantidad) {
            return mostrarToast(`Ya ingresó las ${asignacionActiva.cantidad} series.`, "info");
        }
        asignacionActiva.seriesIngresadas.push(serie);
        input.value = '';

        // Renderizar lista
        const lista = document.getElementById('lista-series-ingresadas');
        let html = `<p><strong>Series (${asignacionActiva.seriesIngresadas.length}/${asignacionActiva.cantidad}):</strong></p><ul>`;
        asignacionActiva.seriesIngresadas.forEach(s => {
            html += `<li>${s}</li>`;
        });
        html += `</ul>`;
        lista.innerHTML = html;

        if (asignacionActiva.seriesIngresadas.length >= asignacionActiva.cantidad) {
            mostrarToast("✅ Series OK", "success");
            setTimeout(() => {
                document.getElementById('contenedor-asignar-final').style.display = 'block';
            }, 800);
        }
    });

    // ✅ BOTÓN FINAL: Vinculado una sola vez, sin rebind
    const btnAsignar = document.getElementById('btn-asignar-material');
    if (btnAsignar) {
        // Elimina cualquier listener anterior (por si acaso)
        const nuevoBtn = btnAsignar.cloneNode(true);
        btnAsignar.parentNode.replaceChild(nuevoBtn, btnAsignar);
        nuevoBtn.addEventListener('click', procesarAsignacionFinal);
    }
}

function editarOrden(ordenId) {
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden) return mostrarToast("Orden no encontrada.", "error");

    // Mostrar formulario de ingreso
    mostrarPanel('panel-ingreso-cliente');
    document.getElementById('ingreso-paso-1').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'block';

    // Rellenar campos
    document.getElementById('orden-numero').value = orden.numero;
    document.getElementById('orden-rut').value = orden.rut;
    document.getElementById('orden-nombre').value = orden.nombre;
    document.getElementById('orden-direccion').value = orden.direccion;
    document.getElementById('numeroContacto').value = orden.numeroContacto || '';
    document.getElementById('orden-region').value = Object.keys(appData.regiones).find(k => appData.regiones[k].nombre === orden.region) || '';
    cargarComunas(document.getElementById('orden-comuna'), document.getElementById('orden-region'));
    setTimeout(() => { document.getElementById('orden-comuna').value = orden.comuna; }, 10);
    document.getElementById('orden-fecha').value = orden.fecha;
    document.getElementById('orden-despacho').value = orden.despacho;
    document.getElementById('orden-tecnico').value = orden.tecnico;
    document.getElementById('orden-servicio').value = orden.servicio;
    cargarSubServicio(document.getElementById('orden-sub'), document.getElementById('orden-servicio'));
    setTimeout(() => { document.getElementById('orden-sub').value = orden.subServicio; }, 10);
    document.getElementById('orden-observacion').value = orden.observacion || '';

    // Guardar ID para evitar duplicar número al editar
    window.ordenEnEdicion = orden.id;
}

function cargarOrdenParaEdicion(id) {
    const orden = ordenes.find(o => o.id === id);
    if (!orden) return;
    window.ordenEnEdicion = id; // ✅ clave para evitar duplicado
    mostrarPanel('panel-ingreso-cliente');
    document.getElementById('ingreso-paso-1').style.display = 'none';
    document.getElementById('form-ingreso-orden').style.display = 'block';
    
    // Rellenar campos
    document.getElementById('orden-numero').value = orden.numero;
    document.getElementById('orden-rut').value = orden.rut;
    document.getElementById('orden-nombre').value = orden.nombre;
    document.getElementById('orden-direccion').value = orden.direccion;
    document.getElementById('numeroContacto').value = orden.numeroContacto || '';
    
    // Región y comuna
    const regionKey = Object.keys(appData.regiones).find(k => appData.regiones[k].nombre === orden.region);
    document.getElementById('orden-region').value = regionKey || '';
    cargarComunas(document.getElementById('orden-comuna'), document.getElementById('orden-region'));
    setTimeout(() => {
        document.getElementById('orden-comuna').value = orden.comuna;
    }, 10);
    
    document.getElementById('orden-fecha').value = orden.fecha;
    document.getElementById('orden-despacho').value = orden.despacho;
    document.getElementById('orden-tecnico').value = orden.tecnico;
    document.getElementById('orden-servicio').value = orden.servicio;
    cargarSubServicio(document.getElementById('orden-sub'), document.getElementById('orden-servicio'));
    setTimeout(() => {
        document.getElementById('orden-sub').value = orden.subServicio;
    }, 10);
    document.getElementById('orden-observacion').value = orden.observacion || '';
}