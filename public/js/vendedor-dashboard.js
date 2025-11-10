// Variables globales
let usuarioActual = null;

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Inicializando dashboard vendedor...');
  cargarUsuario();
  if (usuarioActual) {
    // Delay para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      cargarDatosInicio();
      configurarEventos();
    }, 100);
  }
});

// Cargar usuario desde sessionStorage
function cargarUsuario() {
  const usuario = sessionStorage.getItem('usuario');
  if (!usuario) {
    console.warn('❌ No hay usuario en sesión');
    window.location.href = '/login.html';
    return;
  }
  
  try {
    usuarioActual = JSON.parse(usuario);
    console.log('👤 Usuario encontrado:', usuarioActual.nombre, 'Rol:', usuarioActual.rol);
    
    // Validar que sea vendedor
    if (usuarioActual.rol !== 'vendedor') {
      console.warn('⚠️ Acceso denegado - Usuario no es vendedor. Rol:', usuarioActual.rol);
      alert('⚠️ No tienes permiso para acceder a este panel.\nTu rol es: ' + usuarioActual.rol);
      sessionStorage.clear();
      window.location.href = '/login.html';
      return;
    }
    
    document.getElementById('userName').textContent = usuarioActual.nombre;
    console.log('✅ Vendedor autenticado correctamente');
  } catch (error) {
    console.error('❌ Error al parsear usuario:', error);
    sessionStorage.clear();
    window.location.href = '/login.html';
  }
}

// Configurar eventos
function configurarEventos() {
  console.log('⚙️ Configurando eventos...');
  
  const btnCerrar = document.getElementById('btnCerrarSesion');
  const btnPerfil = document.getElementById('btnMiPerfil');
  const userDropdownToggle = document.getElementById('userDropdownToggle');
  const userDropdownMenu = document.getElementById('userDropdownMenu');
  
  console.log('🔍 Verificando elementos:');
  console.log('  - btnCerrar:', btnCerrar);
  console.log('  - btnPerfil:', btnPerfil);
  console.log('  - userDropdownToggle:', userDropdownToggle);
  console.log('  - userDropdownMenu:', userDropdownMenu);
  
  // Configurar dropdown manual (sin depender de Bootstrap)
  if (userDropdownToggle && userDropdownMenu) {
    userDropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔽 Click en dropdown toggle');
      
      // Toggle la clase 'show' para mostrar/ocultar el menu
      userDropdownMenu.classList.toggle('show');
      userDropdownToggle.setAttribute('aria-expanded', userDropdownMenu.classList.contains('show'));
    });
    
    // Cerrar el menu cuando se hace click fuera
    document.addEventListener('click', (e) => {
      if (!userDropdownToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
        userDropdownMenu.classList.remove('show');
        userDropdownToggle.setAttribute('aria-expanded', false);
      }
    });
    
    console.log('✅ Dropdown manual configurado');
  }
  
  // Configurar botón cerrar sesión
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚪 Click en cerrar sesión');
      cerrarSesion();
    });
    console.log('✅ Evento cerrar sesión configurado');
  } else {
    console.warn('⚠️ Botón cerrar sesión no encontrado');
  }
  
  // Configurar botón perfil
  if (btnPerfil) {
    btnPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📝 Click en perfil');
      
      // Cerrar el dropdown antes de navegar
      if (userDropdownMenu) {
        userDropdownMenu.classList.remove('show');
      }
      
      irAlPerfil();
    });
    console.log('✅ Evento perfil configurado');
  } else {
    console.warn('⚠️ Botón perfil no encontrado');
  }
  
  console.log('✅ Todos los eventos configurados');
}

// Cerrar sesión
function cerrarSesion() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    console.log('🚪 Cerrando sesión...');
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// Ir al perfil
function irAlPerfil() {
  console.log('📝 Yendo al perfil...');
  window.location.href = '/vendedor-perfil.html';
}

// Funciones de navegación
function mostrarSeccion(seccion) {
  console.log('📄 Mostrando sección:', seccion);
  
  // Ocultar todas las secciones
  document.querySelectorAll('.seccion-contenido').forEach(el => {
    el.style.display = 'none';
  });
  
  // Actualizar tabs activos
  document.querySelectorAll('#dashboardTabs button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar sección seleccionada
  const elemento = document.getElementById(`seccion-${seccion}`);
  if (elemento) {
    elemento.style.display = 'block';
    const tab = document.getElementById(`${seccion}-tab`);
    if (tab) tab.classList.add('active');
  }
  
  // Cargar datos según la sección
  switch(seccion) {
    case 'citas':
      cargarCitas();
      break;
    case 'clientes':
      cargarClientes();
      break;
    case 'servicios':
      cargarServicios();
      break;
    case 'sucursales':
      cargarSucursales();
      break;
    case 'reportes':
      cargarReportes();
      break;
    default:
      cargarDatosInicio();
  }
}

// Cargar datos de inicio
function cargarDatosInicio() {
  console.log('📊 Cargando datos de inicio...');
  
  Promise.all([
    fetch('/api/citas').then(r => r.json()).catch(e => {
      console.error('Error citas:', e);
      return [];
    }),
    fetch('/api/clientes').then(r => r.json()).catch(e => {
      console.error('Error clientes:', e);
      return [];
    }),
    fetch('/api/servicios').then(r => r.json()).catch(e => {
      console.error('Error servicios:', e);
      return [];
    }),
    fetch('/api/sucursales').then(r => r.json()).catch(e => {
      console.error('Error sucursales:', e);
      return [];
    })
  ]).then(([citas, clientes, servicios, sucursales]) => {
    console.log('📈 Datos recibidos:', {
      citas: citas.length,
      clientes: clientes.length,
      servicios: servicios.length,
      sucursales: sucursales.length
    });
    
    // Actualizar contadores
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = Array.isArray(citas) ? citas.filter(c => c.fecha === hoy).length : 0;
    
    document.getElementById('citasHoy').textContent = citasHoy;
    document.getElementById('totalClientes').textContent = (clientes || []).length;
    document.getElementById('totalServicios').textContent = (servicios || []).length;
    document.getElementById('totalSucursales').textContent = (sucursales || []).length;
    
    // Cargar próximas citas
    if (Array.isArray(citas)) {
      cargarProximasCitas(citas);
      cargarCitasCompletadasHoy(citas, hoy);
    }
  }).catch(err => console.error('❌ Error cargando datos:', err));
}

// Cargar próximas 5 citas
function cargarProximasCitas(citas) {
  const hoy = new Date().toISOString().split('T')[0];
  const proximas = citas
    .filter(c => c.fecha >= hoy && c.estado !== 'cancelada')
    .sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`))
    .slice(0, 5);
  
  const contenedor = document.getElementById('citasProximas');
  
  if (!contenedor) {
    console.warn('⚠️ Elemento citasProximas no encontrado');
    return;
  }
  
  if (proximas.length === 0) {
    contenedor.innerHTML = '<p class="text-muted text-center py-3">No hay citas próximas</p>';
    return;
  }
  
  contenedor.innerHTML = proximas.map(cita => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">${cita.cliente || 'Cliente'} - ${cita.mascota || 'Mascota'}</h6>
          <small class="text-muted">${formatearFecha(cita.fecha)} a las ${cita.hora}</small>
        </div>
        <span class="badge bg-primary">${cita.estado}</span>
      </div>
      <p class="mb-0 mt-2 small">Servicio: ${cita.servicio || 'N/A'}</p>
    </div>
  `).join('');
}

// Cargar citas completadas hoy
function cargarCitasCompletadasHoy(citas, hoy) {
  const completadas = citas.filter(c => c.fecha === hoy && c.estado === 'completada');
  
  const contenedor = document.getElementById('citasCompletadas');
  if (!contenedor) return;
  
  if (completadas.length === 0) {
    contenedor.innerHTML = '<p class="text-muted text-center py-3">No hay citas completadas hoy</p>';
    return;
  }
  
  contenedor.innerHTML = completadas.map(cita => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1"><i class="bi bi-check-circle text-success"></i> ${cita.cliente || 'Cliente'}</h6>
          <small class="text-muted">${cita.mascota || 'Mascota'} - ${cita.servicio || 'N/A'}</small>
        </div>
        <span class="badge bg-success">Completada</span>
      </div>
    </div>
  `).join('');
}

// Cargar citas del sistema
function cargarCitas() {
  const filtroFecha = document.getElementById('filtroFecha')?.value || new Date().toISOString().split('T')[0];
  
  fetch('/api/citas')
    .then(r => r.json())
    .then(citas => {
      const filtradas = Array.isArray(citas) ? citas.filter(c => c.fecha >= filtroFecha) : [];
      const tbody = document.getElementById('citasBody');
      
      if (!tbody) return;
      
      if (filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3">No hay citas para esta fecha</td></tr>';
        return;
      }
      
      tbody.innerHTML = filtradas.map(cita => `
        <tr>
          <td>${formatearFecha(cita.fecha)}</td>
          <td>${cita.hora}</td>
          <td>${cita.cliente || '-'}</td>
          <td>${cita.mascota || '-'}</td>
          <td>${cita.servicio || '-'}</td>
          <td>${cita.sucursal || '-'}</td>
          <td><span class="badge bg-${getColorEstado(cita.estado)}">${cita.estado}</span></td>
        </tr>
      `).join('');
    })
    .catch(err => console.error('Error cargando citas:', err));
}

// Cargar clientes
function cargarClientes() {
  const busqueda = document.getElementById('buscadorClientes')?.value.toLowerCase() || '';
  
  fetch('/api/clientes')
    .then(r => r.json())
    .then(clientes => {
      const filtrados = (Array.isArray(clientes) ? clientes : []).filter(c => 
        (c.nombre || '').toLowerCase().includes(busqueda) ||
        (c.email || '').toLowerCase().includes(busqueda) ||
        (c.telefono || '').includes(busqueda)
      );
      
      const tbody = document.getElementById('clientesBody');
      if (!tbody) return;
      
      if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No se encontraron clientes</td></tr>';
        return;
      }
      
      tbody.innerHTML = filtrados.map(cliente => `
        <tr>
          <td>${cliente.id}</td>
          <td>${cliente.nombre}</td>
          <td>${cliente.email}</td>
          <td>${cliente.telefono || '-'}</td>
          <td>${cliente.mascotas || 0}</td>
          <td>${cliente.citas_totales || 0}</td>
        </tr>
      `).join('');
    })
    .catch(err => console.error('Error cargando clientes:', err));
}

// Cargar servicios
function cargarServicios() {
  fetch('/api/servicios')
    .then(r => r.json())
    .then(servicios => {
      const contenedor = document.getElementById('serviciosContainer');
      if (!contenedor) return;
      
      const lista = Array.isArray(servicios) ? servicios : [];
      
      if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-center">No hay servicios disponibles</p>';
        return;
      }
      
      contenedor.innerHTML = lista.map(servicio => `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title">${servicio.nombre}</h5>
                <span class="badge bg-primary">Q${parseFloat(servicio.precio || 0).toFixed(2)}</span>
              </div>
              <p class="card-text text-muted small">${servicio.descripcion || 'Sin descripción'}</p>
              <div class="mt-3">
                <small class="text-muted">
                  <i class="bi bi-hourglass-split"></i> ${servicio.duracion_minutos || 30} min
                </small>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error('Error cargando servicios:', err));
}

// Cargar sucursales
function cargarSucursales() {
  fetch('/api/sucursales')
    .then(r => r.json())
    .then(sucursales => {
      const tbody = document.getElementById('sucursalesBody');
      if (!tbody) return;
      
      const lista = Array.isArray(sucursales) ? sucursales : [];
      
      if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No hay sucursales registradas</td></tr>';
        return;
      }
      
      tbody.innerHTML = lista.map(sucursal => `
        <tr>
          <td>${sucursal.id}</td>
          <td>${sucursal.nombre}</td>
          <td>${sucursal.direccion}</td>
          <td>${sucursal.telefono || '-'}</td>
          <td>${sucursal.ciudad || '-'}</td>
        </tr>
      `).join('');
    })
    .catch(err => console.error('Error cargando sucursales:', err));
}

// Cargar reportes
function cargarReportes() {
  const hoy = new Date().toISOString().split('T')[0];
  
  fetch('/api/citas')
    .then(r => r.json())
    .then(citas => {
      const citasHoy = (Array.isArray(citas) ? citas : []).filter(c => c.fecha === hoy);
      
      // Contar por estado
      const porEstado = {
        pendiente: citasHoy.filter(c => c.estado === 'pendiente').length,
        confirmada: citasHoy.filter(c => c.estado === 'confirmada').length,
        completada: citasHoy.filter(c => c.estado === 'completada').length,
        cancelada: citasHoy.filter(c => c.estado === 'cancelada').length
      };
      
      const contenedor = document.getElementById('reporteCitasEstado');
      const total = citasHoy.length || 1;
      
      const html = `
        <div class="text-start">
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span>Pendiente</span>
              <strong>${porEstado.pendiente}</strong>
            </div>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-warning" style="width: ${(porEstado.pendiente / total * 100)}%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span>Confirmada</span>
              <strong>${porEstado.confirmada}</strong>
            </div>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-info" style="width: ${(porEstado.confirmada / total * 100)}%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span>Completada</span>
              <strong>${porEstado.completada}</strong>
            </div>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-success" style="width: ${(porEstado.completada / total * 100)}%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span>Cancelada</span>
              <strong>${porEstado.cancelada}</strong>
            </div>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-danger" style="width: ${(porEstado.cancelada / total * 100)}%"></div>
            </div>
          </div>
        </div>
      `;
      if (contenedor) contenedor.innerHTML = html;
    })
    .catch(err => console.error('Error cargando reportes:', err));
}

// Funciones auxiliares
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-GT', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getColorEstado(estado) {
  const colores = {
    pendiente: 'warning',
    confirmada: 'info',
    completada: 'success',
    cancelada: 'danger'
  };
  return colores[estado] || 'secondary';
}

console.log('✅ vendedor-dashboard.js cargado');
