// admin-usuarios.js - Gestión completa de usuarios

// ==================== VARIABLES GLOBALES ====================
let todosLosUsuarios = [];
let usuariosFiltrados = [];
let usuarioActual = null;
let adminActual = null;
let modoEdicion = false;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async function() {
  await verificarAutenticacion();
  await cargarUsuarios();
  configurarEventListeners();
  iniciarActualizacionAutomatica();
});

// ==================== AUTENTICACIÓN ====================

async function verificarAutenticacion() {
  const usuario = sessionStorage.getItem('usuario');
  
  if (!usuario) {
    alert('Debe iniciar sesión para acceder al panel de administración');
    window.location.href = '/';
    return;
  }

  try {
    adminActual = JSON.parse(usuario);
    
    if (adminActual.rol !== 'admin') {
      alert('No tiene permisos para acceder a esta sección');
      window.location.href = '/';
      return;
    }

    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = adminActual.nombre;
    });

    console.log('✅ Admin autenticado:', adminActual.nombre);
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
    window.location.href = '/';
  }
}

// ==================== CARGA DE DATOS ====================

async function cargarUsuarios() {
  try {
    console.log('👥 Cargando usuarios...');
    mostrarCargando();

    const response = await fetch('/api/usuarios');
    if (!response.ok) throw new Error('Error al obtener usuarios');
    
    todosLosUsuarios = await response.json();
    console.log(`📊 Total de usuarios cargados: ${todosLosUsuarios.length}`);

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Mostrar usuarios en el tab activo
    mostrarUsuariosPorTab('todos');

    actualizarHora();
    console.log('✅ Usuarios cargados exitosamente');
    
  } catch (error) {
    console.error('❌ Error al cargar usuarios:', error);
    mostrarError('Error al cargar los usuarios. Por favor, recargue la página.');
  }
}

// ==================== ESTADÍSTICAS ====================

function actualizarEstadisticas() {
  const stats = {
    total: todosLosUsuarios.length,
    clientes: todosLosUsuarios.filter(u => u.rol === 'cliente').length,
    vendedores: todosLosUsuarios.filter(u => u.rol === 'vendedor').length,
    admins: todosLosUsuarios.filter(u => u.rol === 'admin').length
  };

  // Actualizar tarjetas de estadísticas
  document.getElementById('statTotalUsuarios').textContent = stats.total;
  document.getElementById('statClientes').textContent = stats.clientes;
  document.getElementById('statVendedores').textContent = stats.vendedores;
  document.getElementById('statAdmins').textContent = stats.admins;

  // Actualizar widget del sidebar
  document.getElementById('totalUsuariosWidget').textContent = stats.total;
}

// ==================== MOSTRAR USUARIOS POR TAB ====================

function mostrarUsuariosPorTab(tab) {
  let usuarios = [...todosLosUsuarios];
  let containerId = '';

  switch(tab) {
    case 'todos':
      containerId = 'todosUsuariosContainer';
      usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;

    case 'clientes':
      containerId = 'clientesContainer';
      usuarios = usuarios.filter(u => u.rol === 'cliente');
      usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;

    case 'vendedores':
      containerId = 'vendedoresContainer';
      usuarios = usuarios.filter(u => u.rol === 'vendedor');
      usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;

    case 'admins':
      containerId = 'adminsContainer';
      usuarios = usuarios.filter(u => u.rol === 'admin');
      usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
  }

  usuariosFiltrados = usuarios;
  renderizarUsuarios(containerId, usuarios);
}

// ==================== RENDERIZAR USUARIOS ====================

function renderizarUsuarios(containerId, usuarios) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.warn(`⚠️ Container ${containerId} no encontrado`);
    return;
  }

  if (usuarios.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-person-x"></i>
        <h4>No hay usuarios</h4>
        <p>No se encontraron usuarios en esta categoría</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-hover align-middle usuarios-table">
        <thead>
          <tr>
            <th width="8%">Avatar</th>
            <th width="25%">Nombre</th>
            <th width="22%">Email</th>
            <th width="12%">Teléfono</th>
            <th width="12%">Rol</th>
            <th width="15%">Dirección</th>
            <th width="6%" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  usuarios.forEach(usuario => {
    const iniciales = obtenerIniciales(usuario.nombre);
    const colorAvatar = obtenerColorAvatar(usuario.rol);
    const badgeRol = obtenerBadgeRol(usuario.rol);
    
    html += `
      <tr>
        <td>
          <div class="usuario-avatar ${colorAvatar}">
            ${iniciales}
          </div>
        </td>
        <td>
          <div class="fw-semibold">${usuario.nombre}</div>
          <small class="text-muted">ID: ${usuario.id}</small>
        </td>
        <td>
          <div class="text-truncate" style="max-width: 200px;" title="${usuario.email}">
            <i class="bi bi-envelope me-1 text-muted"></i>
            ${usuario.email}
          </div>
        </td>
        <td>
          <i class="bi bi-phone me-1 text-muted"></i>
          ${usuario.telefono || 'N/A'}
        </td>
        <td>${badgeRol}</td>
        <td>
          <div class="text-truncate" style="max-width: 150px;" title="${usuario.direccion || 'N/A'}">
            <small class="text-muted">${usuario.direccion || 'N/A'}</small>
          </div>
        </td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" onclick="verDetalleUsuario(${usuario.id})" title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="editarUsuario(${usuario.id})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p class="mb-0 text-muted">Mostrando ${usuarios.length} usuario(s)</p>
    </div>
  `;

  container.innerHTML = html;
}

// ==================== UTILIDADES DE RENDERIZADO ====================

function obtenerIniciales(nombre) {
  if (!nombre) return '??';
  const palabras = nombre.trim().split(' ');
  if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

function obtenerColorAvatar(rol) {
  const colores = {
    'cliente': 'bg-primary',
    'vendedor': 'bg-warning',
    'admin': 'bg-danger'
  };
  return colores[rol] || 'bg-secondary';
}

function obtenerBadgeRol(rol) {
  const badges = {
    'cliente': '<span class="badge-rol cliente"><i class="bi bi-person-check"></i>Cliente</span>',
    'vendedor': '<span class="badge-rol vendedor"><i class="bi bi-briefcase"></i>Vendedor</span>',
    'admin': '<span class="badge-rol admin"><i class="bi bi-shield-lock"></i>Admin</span>'
  };
  return badges[rol] || '<span class="badge bg-secondary">Desconocido</span>';
}

// ==================== DETALLES DE USUARIO ====================

window.verDetalleUsuario = async function(id) {
  try {
    const usuario = todosLosUsuarios.find(u => u.id === id);
    if (!usuario) {
      mostrarError('Usuario no encontrado');
      return;
    }

    usuarioActual = usuario;

    const iniciales = obtenerIniciales(usuario.nombre);
    const colorAvatar = obtenerColorAvatar(usuario.rol);
    const badgeRol = obtenerBadgeRol(usuario.rol);

    const html = `
      <div class="usuario-detalle">
        <div class="text-center mb-4">
          <div class="usuario-avatar ${colorAvatar}" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto;">
            ${iniciales}
          </div>
          <h4 class="mt-3 mb-0">${usuario.nombre}</h4>
          ${badgeRol}
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <div class="info-group">
              <label><i class="bi bi-envelope me-2"></i>Email</label>
              <p>${usuario.email}</p>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="info-group">
              <label><i class="bi bi-phone me-2"></i>Teléfono</label>
              <p>${usuario.telefono || 'No especificado'}</p>
            </div>
          </div>
          
          <div class="col-md-12">
            <div class="info-group">
              <label><i class="bi bi-geo-alt me-2"></i>Dirección</label>
              <p>${usuario.direccion || 'No especificada'}</p>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="info-group">
              <label><i class="bi bi-shield-lock me-2"></i>Rol</label>
              <p>${badgeRol}</p>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="info-group">
              <label><i class="bi bi-hash me-2"></i>ID del Usuario</label>
              <p><span class="badge bg-secondary">${usuario.id}</span></p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('detallesUsuarioContent').innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleUsuario'));
    modal.show();

  } catch (error) {
    console.error('❌ Error al ver detalles:', error);
    mostrarError('Error al cargar los detalles del usuario');
  }
};

// ==================== CREAR/EDITAR USUARIO ====================

window.editarUsuario = function(id) {
  const usuario = todosLosUsuarios.find(u => u.id === id);
  if (!usuario) {
    mostrarError('Usuario no encontrado');
    return;
  }

  usuarioActual = usuario;
  modoEdicion = true;

  // Cambiar título del modal
  document.getElementById('tituloFormUsuario').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Usuario';

  // Llenar el formulario
  document.getElementById('usuarioId').value = usuario.id;
  document.getElementById('usuarioNombre').value = usuario.nombre;
  document.getElementById('usuarioEmail').value = usuario.email;
  document.getElementById('usuarioTelefono').value = usuario.telefono || '';
  document.getElementById('usuarioRol').value = usuario.rol;
  document.getElementById('usuarioDireccion').value = usuario.direccion || '';

  // Ocultar campos de contraseña en modo edición
  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('confirmPasswordGroup').style.display = 'none';

  // Cerrar modal de detalles si está abierto
  const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('modalDetalleUsuario'));
  if (modalDetalle) modalDetalle.hide();

  // Mostrar modal de formulario
  const modal = new bootstrap.Modal(document.getElementById('modalFormUsuario'));
  modal.show();
};

function nuevoUsuario() {
  modoEdicion = false;
  usuarioActual = null;

  // Cambiar título del modal
  document.getElementById('tituloFormUsuario').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Usuario';

  // Limpiar formulario
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = '';

  // Mostrar campos de contraseña en modo creación
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('confirmPasswordGroup').style.display = 'block';

  // Hacer campos de contraseña requeridos
  document.getElementById('usuarioPassword').required = true;
  document.getElementById('usuarioPasswordConfirm').required = true;

  const modal = new bootstrap.Modal(document.getElementById('modalFormUsuario'));
  modal.show();
}

async function guardarUsuario() {
  try {
    const form = document.getElementById('formUsuario');
    
    // Validar formulario
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('usuarioNombre').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim().toLowerCase();
    const telefono = document.getElementById('usuarioTelefono').value.trim();
    const rol = document.getElementById('usuarioRol').value;
    const direccion = document.getElementById('usuarioDireccion').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const passwordConfirm = document.getElementById('usuarioPasswordConfirm').value;

    // Validaciones adicionales
    if (!modoEdicion) {
      // Validar contraseña solo en modo creación
      if (!password || password.length < 8) {
        mostrarError('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      if (password !== passwordConfirm) {
        mostrarError('Las contraseñas no coinciden');
        return;
      }

      // Validar formato de contraseña
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
      if (!passwordRegex.test(password)) {
        mostrarError('La contraseña debe incluir mayúsculas, minúsculas, números y símbolos');
        return;
      }
    }

    // Validar teléfono
    const telefonoRegex = /^[0-9]{8}$/;
    if (telefono && !telefonoRegex.test(telefono)) {
      mostrarError('El teléfono debe tener exactamente 8 dígitos');
      return;
    }

    const btn = document.getElementById('btnGuardarUsuario');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    const datos = {
      nombre,
      email,
      telefono,
      rol,
      direccion
    };

    // Solo incluir contraseña si estamos creando un nuevo usuario
    if (!modoEdicion) {
      datos.password = password;
    }

    let response;
    if (modoEdicion) {
      // Actualizar usuario existente
      response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    } else {
      // Crear nuevo usuario
      response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar usuario');
    }

    mostrarExito(modoEdicion ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('modalFormUsuario')).hide();
    
    await cargarUsuarios();

  } catch (error) {
    console.error('❌ Error al guardar usuario:', error);
    mostrarError(error.message || 'Error al guardar el usuario');
  } finally {
    const btn = document.getElementById('btnGuardarUsuario');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
  }
}

// ==================== ELIMINAR USUARIO ====================

async function eliminarUsuario() {
  if (!usuarioActual) return;

  // No permitir eliminar el propio usuario
  if (usuarioActual.id === adminActual.id) {
    mostrarError('No puede eliminar su propia cuenta');
    return;
  }

  if (!confirm(`¿Está seguro de eliminar al usuario "${usuarioActual.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/usuarios/${usuarioActual.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar usuario');
    }

    mostrarExito('Usuario eliminado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('modalDetalleUsuario')).hide();
    
    await cargarUsuarios();

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    mostrarError(error.message || 'Error al eliminar el usuario');
  }
}

// ==================== FILTROS Y BÚSQUEDA ====================

function aplicarFiltros() {
  const rol = document.getElementById('filtroRol').value;
  const busqueda = document.getElementById('buscarUsuario').value.toLowerCase();

  let usuarios = [...usuariosFiltrados];

  // Filtrar por rol
  if (rol) {
    usuarios = usuarios.filter(u => u.rol === rol);
  }

  // Filtrar por búsqueda
  if (busqueda) {
    usuarios = usuarios.filter(u => 
      (u.nombre || '').toLowerCase().includes(busqueda) ||
      (u.email || '').toLowerCase().includes(busqueda) ||
      (u.telefono || '').includes(busqueda)
    );
  }

  // Determinar qué tab está activo
  const activeTab = document.querySelector('#usuariosTabs .nav-link.active').id.replace('-tab', '');
  const containerId = activeTab === 'todos' ? 'todosUsuariosContainer' : activeTab + 'Container';
  
  renderizarUsuarios(containerId, usuarios);
}

// ==================== EVENT LISTENERS ====================

function configurarEventListeners() {
  // Cerrar sesión
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', cerrarSesion);
  }

  // Mi Perfil
  const btnMiPerfil = document.getElementById('btnMiPerfil');
  if (btnMiPerfil) {
    btnMiPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      irAlPerfil();
    });
  }

  // Actualizar usuarios
  const btnActualizar = document.getElementById('btnActualizarUsuarios');
  if (btnActualizar) {
    btnActualizar.addEventListener('click', async (e) => {
      e.preventDefault();
      btnActualizar.disabled = true;
      btnActualizar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Actualizando...';
      
      await cargarUsuarios();
      
      btnActualizar.disabled = false;
      btnActualizar.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Actualizar';
      mostrarExito('Usuarios actualizados correctamente');
    });
  }

  // Nuevo usuario
  const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
  if (btnNuevoUsuario) {
    btnNuevoUsuario.addEventListener('click', nuevoUsuario);
  }

  // Tabs
  const tabs = document.querySelectorAll('#usuariosTabs button[data-bs-toggle="tab"]');
  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
      const tabId = e.target.id.replace('-tab', '');
      mostrarUsuariosPorTab(tabId);
    });
  });

  // Filtros
  const filtroRol = document.getElementById('filtroRol');
  if (filtroRol) {
    filtroRol.addEventListener('change', aplicarFiltros);
  }

  // Búsqueda
  const buscarUsuario = document.getElementById('buscarUsuario');
  if (buscarUsuario) {
    buscarUsuario.addEventListener('input', debounce(aplicarFiltros, 300));
  }

  // Guardar usuario
  const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
  if (btnGuardarUsuario) {
    btnGuardarUsuario.addEventListener('click', guardarUsuario);
  }

  // Eliminar usuario
  const btnEliminarUsuario = document.getElementById('btnEliminarUsuario');
  if (btnEliminarUsuario) {
    btnEliminarUsuario.addEventListener('click', eliminarUsuario);
  }

  // Editar usuario (desde modal de detalles)
  const btnEditarUsuario = document.getElementById('btnEditarUsuario');
  if (btnEditarUsuario) {
    btnEditarUsuario.addEventListener('click', () => {
      if (usuarioActual) {
        editarUsuario(usuarioActual.id);
      }
    });
  }

  console.log('✅ Event listeners configurados');
}

function cerrarSesion(e) {
  e.preventDefault();
  
  if (confirm('¿Está seguro de cerrar sesión?')) {
    sessionStorage.clear();
    window.location.href = '/';
  }
}

// ==================== UTILIDADES ====================

function mostrarCargando() {
  const containers = [
    'todosUsuariosContainer',
    'clientesContainer',
    'vendedoresContainer',
    'adminsContainer'
  ];

  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      `;
    }
  });
}

function actualizarHora() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  const elemento = document.getElementById('horaActualizacion');
  if (elemento) {
    elemento.textContent = hora;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function mostrarError(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 p-3';
  toast.style.zIndex = '11';
  toast.innerHTML = `
    <div class="toast show bg-danger text-white" role="alert">
      <div class="toast-header bg-danger text-white">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong class="me-auto">Error</strong>
        <button type="button" class="btn-close btn-close-white" onclick="this.closest('.position-fixed').remove()"></button>
      </div>
      <div class="toast-body">${mensaje}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function mostrarExito(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 p-3';
  toast.style.zIndex = '11';
  toast.innerHTML = `
    <div class="toast show bg-success text-white" role="alert">
      <div class="toast-header bg-success text-white">
        <i class="bi bi-check-circle me-2"></i>
        <strong class="me-auto">Éxito</strong>
        <button type="button" class="btn-close btn-close-white" onclick="this.closest('.position-fixed').remove()"></button>
      </div>
      <div class="toast-body">${mensaje}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== ACTUALIZACIÓN AUTOMÁTICA ====================

function iniciarActualizacionAutomatica() {
  setInterval(async () => {
    console.log('🔄 Actualización automática de usuarios...');
    await cargarUsuarios();
  }, 300000); // Cada 5 minutos

  console.log('✅ Actualización automática iniciada');
}

// ==================== LIMPIEZA ====================

window.addEventListener('beforeunload', () => {
  console.log('🧹 Limpieza al salir');
});

// ==================== NAVEGACIÓN ====================

function irAlPerfil() {
  window.location.href = '/admin-perfil.html';
}