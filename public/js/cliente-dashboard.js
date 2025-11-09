// cliente-dashboard.js

// Variables globales
let usuarioActual = null;
let clienteId = null;
let citasData = [];
let mascotasData = [];
let diasActivos = 0;


// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarDashboard();
});

// Función principal de inicialización
async function inicializarDashboard() {
    try {
        // Verificar autenticación
        usuarioActual = obtenerUsuarioActual();
        if (!usuarioActual) {
            console.log('Usuario no autenticado, redirigiendo...');
            window.location.href = '/';
            return;
        }

        console.log('Usuario autenticado:', usuarioActual);

        // Actualizar nombre del usuario en la UI
        actualizarNombreUsuario();

        // Cargar datos necesarios
        await cargarClienteId();
        
        if (clienteId) {
            await Promise.all([
                cargarCitasCliente(),
                cargarMascotasCliente(),
                cargarDiasActivos(),
                registrarActividad()
            ]);

            // Actualizar estadísticas del dashboard
            actualizarEstadisticasDashboard();
            
            // Cargar contenido de las tabs
            cargarCitasTab();
            cargarMascotasTab();
        } else {
            console.error('No se pudo obtener el ID del cliente');
        }

    } catch (error) {
        console.error('Error al inicializar dashboard:', error);
    }
}

// Obtener usuario actual del sessionStorage
function obtenerUsuarioActual() {
    const usuario = sessionStorage.getItem('usuario');
    if (!usuario) {
        console.log('No hay usuario en sessionStorage');
        return null;
    }
    
    try {
        return JSON.parse(usuario);
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        return null;
    }
}

// Actualizar nombre del usuario en la UI
function actualizarNombreUsuario() {
    if (usuarioActual) {
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = usuarioActual.nombre;
        });

        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.textContent = `¡Bienvenido ${usuarioActual.nombre}!`;
        }
    }
}

// Cargar ID del cliente basado en el usuario
async function cargarClienteId() {
    try {
        console.log('Buscando cliente para usuario ID:', usuarioActual.id);
        
        const response = await fetch(`/api/clientes/`);
        if (!response.ok) throw new Error('Error al obtener clientes');
        
        const clientes = await response.json();
        const cliente = clientes.find(c => c.id === usuarioActual.id);

        if (cliente) {
            clienteId = cliente.id;
            console.log('Cliente ID asignado:', clienteId);
        } else {
            throw new Error('Cliente no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar cliente:', error);
        throw error;
    }
}

// Cargar citas del cliente
async function cargarCitasCliente() {
    try {
        console.log('Cargando citas para cliente ID:', clienteId);

        // Intentar ruta específica del cliente primero
        let response = await fetch(`/api/citas/cliente/${clienteId}`);
        
        if (!response.ok) {
            // Si no existe la ruta específica, usar la ruta general y filtrar
            response = await fetch(`/api/citas`);
            if (!response.ok) throw new Error('Error al obtener citas');
            
            const todasCitas = await response.json();
            citasData = todasCitas.filter(cita => cita.cliente_id === clienteId);
        } else {
            citasData = await response.json();
        }
        
        console.log('Citas cargadas:', citasData);

    } catch (error) {
        console.error('Error al cargar citas:', error);
        citasData = []; // Asegurar que esté inicializado
    }
}

// Cargar mascotas del cliente
async function cargarMascotasCliente() {
    try {
        console.log('Cargando mascotas para cliente ID:', clienteId);

        // Intentar ruta específica del cliente primero
        let response = await fetch(`/api/mascotas/cliente/${clienteId}`);
        
        if (!response.ok) {
            // Si no existe la ruta específica, usar la ruta general y filtrar
            response = await fetch(`/api/mascotas`);
            if (!response.ok) throw new Error('Error al obtener mascotas');
            
            const todasMascotas = await response.json();
            mascotasData = todasMascotas.filter(mascota => mascota.cliente_id === clienteId);
        } else {
            mascotasData = await response.json();
        }
        
        console.log('Mascotas cargadas:', mascotasData);

    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        mascotasData = []; // Asegurar que esté inicializado
    }
}

// Cargar días activos del cliente
async function cargarDiasActivos() {
    try {
        console.log('Cargando días activos para cliente ID:', clienteId);

        const response = await fetch(`/api/cliente-actividad/${clienteId}`);
        
        if (response.ok) {
            const actividad = await response.json();
            diasActivos = actividad.dias_activos || 0;
        } else {
            diasActivos = 1; // Primer día
        }
        
        console.log('Días activos:', diasActivos);

    } catch (error) {
        console.error('Error al cargar días activos:', error);
        diasActivos = 0;
    }
}

// Registrar actividad del día actual
async function registrarActividad() {
    try {
        const response = await fetch('/api/cliente-actividad', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cliente_id: clienteId
            })
        });

        if (response.ok) {
            console.log('Actividad registrada correctamente');
        }

    } catch (error) {
        console.error('Error al registrar actividad:', error);
    }
}

// Actualizar estadísticas del dashboard
function actualizarEstadisticasDashboard() {
    // Calcular citas programadas (pendientes)
    const citasProgramadas = citasData.filter(cita => 
        cita.estado === 'pendiente'
    ).length;

    // Calcular consultas realizadas (confirmadas)
    const consultasRealizadas = citasData.filter(cita => 
        cita.estado === 'confirmada'
    ).length;

    // Calcular recordatorios pendientes (aquí podrías implementar lógica específica)
    const recordatoriosPendientes = calcularRecordatoriosPendientes();

    // Actualizar elementos en el DOM
    const stats = document.querySelectorAll('.stat-content h3');
    if (stats.length >= 4) {
        stats[0].textContent = citasProgramadas; // Citas Programadas
        stats[1].textContent = mascotasData.length; // Mascotas Registradas
        stats[2].textContent = recordatoriosPendientes; // Recordatorios Pendientes
        stats[3].textContent = consultasRealizadas; // Consultas Realizadas
    }

    // Actualizar días activos
    const statNumber = document.querySelector('.stat-number');
    if (statNumber) {
        statNumber.textContent = diasActivos;
    }

    console.log('Estadísticas actualizadas:', {
        citasProgramadas,
        mascotas: mascotasData.length,
        recordatoriosPendientes,
        consultasRealizadas,
        diasActivos
    });
}

// Calcular recordatorios pendientes
function calcularRecordatoriosPendientes() {
    // Aquí podrías implementar lógica para calcular recordatorios
    // Por ejemplo: vacunas próximas, citas de seguimiento, etc.
    
    const hoy = new Date();
    const proximasCitas = citasData.filter(cita => {
        const fechaCita = new Date(cita.fecha);
        const diasHastaCita = (fechaCita - hoy) / (1000 * 60 * 60 * 24);
        return diasHastaCita <= 7 && diasHastaCita >= 0 && cita.estado === 'pendiente';
    });

    return proximasCitas.length;
}

// Cargar contenido de la tab de citas
function cargarCitasTab() {
    const appointmentsTab = document.getElementById('appointments');
    if (!appointmentsTab) return;

    const cardBody = appointmentsTab.querySelector('.card-body');
    
    if (citasData.length === 0) {
        cardBody.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x display-1 text-muted mb-3"></i>
                <h5 class="text-muted">No tienes citas programadas</h5>
                <p class="text-muted">Agenda tu primera cita para el cuidado de tus mascotas</p>
                <a href="cliente-citas.html" class="btn btn-primary">
                    <i class="bi bi-plus-circle me-2"></i>Agendar Primera Cita
                </a>
            </div>
        `;
        return;
    }

    // Mostrar las próximas 5 citas
    const proximasCitas = citasData
        .filter(cita => cita.estado === 'pendiente')
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);

    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Mascota</th>
                <th>Servicio</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
    `;

    proximasCitas.forEach(cita => {
        const fecha = new Date(cita.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES');
        const mascota = mascotasData.find(m => m.id === cita.mascota_id);
        
        html += `
            <tr>
                <td>${fechaFormateada}</td>
                <td>${cita.hora}</td>
                <td>${mascota ? mascota.nombre : 'No encontrada'}</td>
                <td>${cita.servicio_nombre || 'Consulta'}</td>
                <td><span class="badge bg-warning">Pendiente</span></td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    
    // Agregar botón para ver todas
    html += `
        <div class="text-center mt-3">
            <a href="cliente-citas.html" class="btn btn-outline-primary">
                Ver todas las citas
            </a>
        </div>
    `;

    cardBody.innerHTML = html;
}

// Cargar contenido de la tab de mascotas
function cargarMascotasTab() {
    const petsTab = document.getElementById('pets');
    if (!petsTab) return;

    const cardBody = petsTab.querySelector('.card-body');
    
    if (mascotasData.length === 0) {
        cardBody.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-heart display-1 text-muted mb-3"></i>
                <h5 class="text-muted">No tienes mascotas registradas</h5>
                <p class="text-muted">Registra tu primera mascota para comenzar</p>
                <a href="cliente-mascota.html" class="btn btn-success">
                    <i class="bi bi-plus-circle me-2"></i>Registrar Primera Mascota
                </a>
            </div>
        `;
        return;
    }

    // Mostrar las mascotas
    let html = '<div class="row g-3">';
    console.log(mascotasData)
    mascotasData.forEach(mascota => {
        const avatar = obtenerAvatarMascota(mascota.especie);
        //const edad = calcularEdad(mascota.fecha_nacimiento);
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${avatar}</div>
                        <h6 class="card-title">${mascota.nombre}</h6>
                        <p class="card-text text-muted">
                            ${mascota.especie} - ${mascota.raza}<br>
                            <small>${mascota.edad} año${mascota.edad !== 1 ? 's' : ''}</small>
                        </p>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    // Agregar botón para ver todas
    html += `
        <div class="text-center mt-3">
            <a href="cliente-mascota.html" class="btn btn-outline-success">
                Ver todas las mascotas
            </a>
        </div>
    `;

    cardBody.innerHTML = html;
}

// Funciones auxiliares
function obtenerAvatarMascota(especie) {
    const avatares = {
        'perro': '🐕',
        'gato': '🐱',
        'ave': '🐦',
        'conejo': '🐰',
        'hamster': '🐹',
        'pez': '🐠'
    };
    return avatares[especie?.toLowerCase()] || '🐾';
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'Edad no disponible';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const edadMs = hoy - nacimiento;
    const edadAnios = Math.floor(edadMs / (1000 * 60 * 60 * 24 * 365));
    
    if (edadAnios < 1) {
        const edadMeses = Math.floor(edadMs / (1000 * 60 * 60 * 24 * 30));
        return `${edadMeses} ${edadMeses === 1 ? 'mes' : 'meses'}`;
    }
    
    return `${edadAnios} ${edadAnios === 1 ? 'año' : 'años'}`;
}

// Event listeners para las acciones rápidas
document.addEventListener('DOMContentLoaded', function() {
    // Agendar cita
    const agendarBtn = document.querySelector('a[href="#"]:has(.bi-calendar-plus)');
    if (agendarBtn) {
        agendarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cliente-citas.html';
        });
    }

    // Ver mascotas
    const mascotasBtn = document.querySelector('a[href="#"]:has(.bi-heart-pulse)');
    if (mascotasBtn) {
        mascotasBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cliente-mascota.html';
        });
    }

    // Cerrar sesión
    const cerrarSesionBtn = document.querySelector('.dropdown-item.text-danger');
    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.removeItem('usuario');
                sessionStorage.removeItem('isLoggedIn');
                window.location.href = '/';
            }
        });
    }
});