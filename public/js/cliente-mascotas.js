// /js/cliente-mascotas.js - VERSIÓN COMPLETA CONECTADA A MYSQL

// Variables globales
let mascotasData = [];
let clienteId = null;
let usuarioActual = null;
let mascotaEditandoId = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  inicializarPagina();
});

// Función principal de inicialización
async function inicializarPagina() {
  try {
    // Verificar autenticación
    usuarioActual = obtenerUsuarioActual();
    if (!usuarioActual) {
      console.log('Usuario no autenticado, redirigiendo...');
      window.location.href = '/';
      return;
    }

    console.log('Usuario autenticado:', usuarioActual);

    // Actualizar información del usuario en la UI
    actualizarInfoUsuario();

    // Cargar ID del cliente
    await cargarClienteId();

    if (clienteId) {
      // Cargar mascotas del cliente
      await cargarMascotas();
    } else {
      console.error('No se pudo obtener el ID del cliente');
      mostrarError('Error: No se pudo identificar tu perfil de cliente');
      return;
    }

    // Configurar event listeners
    configurarEventListeners();

  } catch (error) {
    console.error('Error al inicializar página:', error);
    mostrarError('Error al cargar la página. Por favor, recarga.');
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
    const usuarioObj = JSON.parse(usuario);
    console.log('Usuario parseado:', usuarioObj);
    return usuarioObj;
  } catch (error) {
    console.error('Error al parsear usuario:', error);
    return null;
  }
}

// Actualizar información del usuario en la UI
function actualizarInfoUsuario() {
  if (usuarioActual) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
      userNameElement.textContent = usuarioActual.nombre;
    }
  }
}

// Cargar ID del cliente basado en el usuario
async function cargarClienteId() {
  try {
    console.log('Buscando cliente para usuario ID:', usuarioActual.id);
    
    const response = await fetch(`/api/clientes`);
    if (!response.ok) throw new Error('Error al obtener clientes');
    
    const clientes = await response.json();
    console.log('Clientes obtenidos:', clientes);
    
    const cliente = clientes.find(c => c.id === usuarioActual.id);
    console.log('Cliente encontrado:', cliente);
    
    if (cliente) {
      clienteId = cliente.id;
      console.log('Cliente ID asignado:', clienteId);
    } else {
      console.error('Cliente no encontrado para usuario ID:', usuarioActual.id);
      throw new Error('Cliente no encontrado');
    }
  } catch (error) {
    console.error('Error al cargar cliente:', error);
    throw error;
  }
}

// Cargar mascotas del cliente específico
async function cargarMascotas() {
  try {
    if (!clienteId) {
      console.error('No hay clienteId para cargar mascotas');
      return;
    }

    console.log('Cargando mascotas para cliente ID:', clienteId);
    mostrarEstadoCarga(true);

    // Usar la ruta específica del cliente
    const response = await fetch(`/api/mascotas/cliente/${clienteId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener mascotas');
    }
    
    mascotasData = await response.json();
    console.log('Mascotas del cliente cargadas:', mascotasData);
    
    // Actualizar UI
    actualizarEstadisticas();
    mostrarMascotas();
    actualizarProximaCita();
    
    mostrarEstadoCarga(false);

  } catch (error) {
    console.error('Error al cargar mascotas:', error);
    mostrarEstadoCarga(false);
    mostrarError('Error al cargar las mascotas');
  }
}

// Mostrar/ocultar estado de carga
function mostrarEstadoCarga(mostrar) {
  const welcomeSection = document.querySelector('.welcome-section');
  const statsSection = document.querySelector('.stats-section');
  const contentCard = document.querySelector('.content-card');
  
  if (mostrar) {
    if (welcomeSection) welcomeSection.style.opacity = '0.5';
    if (statsSection) statsSection.style.opacity = '0.5';
    if (contentCard) contentCard.style.opacity = '0.5';
  } else {
    if (welcomeSection) welcomeSection.style.opacity = '1';
    if (statsSection) statsSection.style.opacity = '1';
    if (contentCard) contentCard.style.opacity = '1';
  }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
  try {
    const total = mascotasData.length;
    const conRaza = mascotasData.filter(m => m.raza && m.raza.trim()).length;
    const conObservaciones = mascotasData.filter(m => m.observaciones && m.observaciones.trim()).length;
    
    // Actualizar elementos del DOM
    const totalElement = document.getElementById('totalMascotas');
    if (totalElement) totalElement.textContent = total;
    
    const vacunasElement = document.getElementById('vacunasAlDia');
    if (vacunasElement) vacunasElement.textContent = conRaza;
    
    const pendientesElement = document.getElementById('vacunasPendientes');
    if (pendientesElement) pendientesElement.textContent = total - conObservaciones;
    
    // Actualizar texto de cambios
    const cambioVacunas = document.getElementById('cambioVacunas');
    if (cambioVacunas) {
      if (total === 0) {
        cambioVacunas.textContent = 'Sin registro';
        cambioVacunas.className = 'stat-change neutral';
      } else {
        cambioVacunas.textContent = 'Información registrada';
        cambioVacunas.className = 'stat-change positive';
      }
    }

    const cambioPendientes = document.getElementById('cambioPendientes');
    if (cambioPendientes) {
      if (total - conObservaciones === 0) {
        cambioPendientes.textContent = 'Completa';
        cambioPendientes.className = 'stat-change positive';
      } else {
        cambioPendientes.textContent = 'Información faltante';
        cambioPendientes.className = 'stat-change negative';
      }
    }

  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
  }
}

// Mostrar mascotas en la UI
function mostrarMascotas() {
  const container = document.getElementById('vista-grid-content');
  const containerLista = document.getElementById('vista-lista-content');
  
  if (!mascotasData || mascotasData.length === 0) {
    const emptyMessage = `
      <div class="text-center py-5">
        <i class="bi bi-heart display-1 text-muted mb-3"></i>
        <h5 class="text-muted">No tienes mascotas registradas</h5>
        <p class="text-muted">Registra tu primera mascota para comenzar</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#nuevaMascotaModal">
          <i class="bi bi-plus-circle me-2"></i>Registrar Mascota
        </button>
      </div>
    `;
    
    if (container) container.innerHTML = emptyMessage;
    if (containerLista) containerLista.innerHTML = emptyMessage;
    return;
  }

  // Vista Grid
  mostrarVistaGrid();
  
  // Vista Lista
  mostrarVistaLista();
}

// Mostrar vista grid
function mostrarVistaGrid() {
  const container = document.getElementById('vista-grid-content');
  if (!container) return;

  let html = '<div class="row g-4">';
  
  mascotasData.forEach(mascota => {
    const avatarMascota = obtenerAvatarMascota(mascota.especie);
    const edad = mascota.edad ? `${mascota.edad} año${mascota.edad !== 1 ? 's' : ''}` : 'Sin especificar';
    const peso = mascota.peso ? `${mascota.peso} kg` : 'Sin especificar';
    
    html += `
      <div class="col-lg-4 col-md-6">
        <div class="mascota-card">
          <div class="mascota-header">
            <div class="mascota-imagen">
              <div class="mascota-avatar">${avatarMascota}</div>
              <div class="mascota-estado bueno"></div>
            </div>
            <div class="mascota-actions">
              <button class="btn btn-sm btn-outline-primary" onclick="verMascota(${mascota.id})" title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-warning" onclick="editarMascota(${mascota.id})" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="eliminarMascota(${mascota.id})" title="Eliminar">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="mascota-body">
            <h5 class="mascota-nombre">${mascota.nombre}</h5>
            <p class="mascota-raza">${mascota.raza || mascota.especie}</p>
            <div class="mascota-info">
              <div class="info-item">
                <i class="bi bi-calendar3"></i>
                <span>${edad}</span>
              </div>
              <div class="info-item">
                <i class="bi bi-speedometer2"></i>
                <span>${peso}</span>
              </div>
              <div class="info-item">
                <i class="bi bi-info-circle"></i>
                <span>ID: ${mascota.id}</span>
              </div>
            </div>
            <div class="mascota-tags">
              ${mascota.raza ? '<span class="tag vacunado">Con raza</span>' : '<span class="tag pendiente">Sin raza</span>'}
              ${mascota.observaciones ? '<span class="tag microchip">Con info</span>' : ''}
            </div>
          </div>
          <div class="mascota-footer">
            <small class="text-muted">Registrado en el sistema</small>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Mostrar vista lista
function mostrarVistaLista() {
  const container = document.getElementById('vista-lista-content');
  if (!container) return;

  let html = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Mascota</th>
            <th>Tipo/Raza</th>
            <th>Edad</th>
            <th>Peso</th>
            <th>Estado</th>
            <th>ID</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  mascotasData.forEach(mascota => {
    const avatarMascota = obtenerAvatarMascota(mascota.especie);
    const edad = mascota.edad ? `${mascota.edad} año${mascota.edad !== 1 ? 's' : ''}` : 'Sin especificar';
    const peso = mascota.peso ? `${mascota.peso} kg` : 'Sin especificar';
    
    html += `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <span class="me-2" style="font-size: 1.5rem;">${avatarMascota}</span>
            <div>
              <h6 class="mb-0">${mascota.nombre}</h6>
              <small class="text-muted">ID: #${String(mascota.id).padStart(3, '0')}</small>
            </div>
          </div>
        </td>
        <td>
          <div>
            <span class="fw-medium">${mascota.especie.charAt(0).toUpperCase() + mascota.especie.slice(1)}</span><br>
            <small class="text-muted">${mascota.raza || 'Sin especificar'}</small>
          </div>
        </td>
        <td>${edad}</td>
        <td>${peso}</td>
        <td><span class="badge bg-primary">Registrada</span></td>
        <td>${mascota.id}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="verMascota(${mascota.id})">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="editarMascota(${mascota.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarMascota(${mascota.id})">
              <i class="bi bi-trash"></i>
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
  `;
  
  container.innerHTML = html;
}

// Funciones auxiliares
function obtenerAvatarMascota(especie) {
  const avatares = {
    'perro': '🐕',
    'gato': '🐱',
    'ave': '🐦',
    'conejo': '🐰',
    'hamster': '🐹',
    'pez': '🐠',
    'reptil': '🦎',
    'tortuga': '🐢'
  };
  return avatares[especie?.toLowerCase()] || '🐾';
}

// Actualizar próxima cita en sidebar
function actualizarProximaCita() {
  const widget = document.querySelector('.sidebar-widget .widget-content');
  if (!widget) return;
  
  if (mascotasData.length > 0) {
    const mascotaSinInfo = mascotasData.find(m => !m.observaciones || !m.raza);

    if (mascotaSinInfo) {
      widget.innerHTML = `
        <p class="mb-1"><strong>Completar info de ${mascotaSinInfo.nombre}</strong></p>
        <small class="text-muted">Requiere atención</small>
      `;
    } else {
      widget.innerHTML = `
        <p class="mb-1"><strong>Información completa</strong></p>
        <small class="text-muted">Todo al día</small>
      `;
    }
  } else {
    widget.innerHTML = `
      <p class="mb-1"><strong>Sin mascotas</strong></p>
      <small class="text-muted">Registra tu primera mascota</small>
    `;
  }
}

// Configurar event listeners
function configurarEventListeners() {
  // Cambio de vista
  const vistaGrid = document.getElementById('vista-grid');
  const vistaLista = document.getElementById('vista-lista');
  const vistaGridContent = document.getElementById('vista-grid-content');
  const vistaListaContent = document.getElementById('vista-lista-content');

  if (vistaGrid && vistaLista && vistaGridContent && vistaListaContent) {
    vistaGrid.addEventListener('change', function() {
      if (this.checked) {
        vistaGridContent.style.display = 'block';
        vistaListaContent.style.display = 'none';
      }
    });

    vistaLista.addEventListener('change', function() {
      if (this.checked) {
        vistaGridContent.style.display = 'none';
        vistaListaContent.style.display = 'block';
      }
    });
  }

  // Filtros
  const buscarInput = document.getElementById('buscarMascota');
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroEdad = document.getElementById('filtroEdad');
  const filtroSalud = document.getElementById('filtroSalud');

  if (buscarInput) buscarInput.addEventListener('input', aplicarFiltros);
  if (filtroTipo) filtroTipo.addEventListener('change', aplicarFiltros);
  if (filtroEdad) filtroEdad.addEventListener('change', aplicarFiltros);
  if (filtroSalud) filtroSalud.addEventListener('change', aplicarFiltros);
}

// Aplicar filtros
function aplicarFiltros() {
  const termino = document.getElementById('buscarMascota')?.value.toLowerCase() || '';
  const tipoFiltro = document.getElementById('filtroTipo')?.value || '';
  const edadFiltro = document.getElementById('filtroEdad')?.value || '';

  const mascotasFiltradas = mascotasData.filter(mascota => {
    // Filtro de búsqueda
    if (termino) {
      const textoCompleto = `${mascota.nombre || ''} ${mascota.especie || ''} ${mascota.raza || ''}`.toLowerCase();
      if (!textoCompleto.includes(termino)) return false;
    }
    
    // Filtro de tipo
    if (tipoFiltro && mascota.especie !== tipoFiltro) return false;
    
    // Filtro de edad
    if (edadFiltro && mascota.edad) {
      switch (edadFiltro) {
        case 'cachorro':
          if (mascota.edad > 1) return false;
          break;
        case 'joven':
          if (mascota.edad <= 1 || mascota.edad > 3) return false;
          break;
        case 'adulto':
          if (mascota.edad <= 3 || mascota.edad > 7) return false;
          break;
        case 'senior':
          if (mascota.edad <= 7) return false;
          break;
      }
    }
    
    return true;
  });

  // Mostrar resultados filtrados
  mostrarMascotasFiltradas(mascotasFiltradas);
}

function mostrarMascotasFiltradas(mascotasFiltradas) {
  // Temporalmente reemplazar los datos y mostrar
  const mascotasOriginales = mascotasData;
  mascotasData = mascotasFiltradas;
  mostrarMascotas();
  mascotasData = mascotasOriginales;
}

// Limpiar filtros
window.limpiarFiltros = function() {
  const buscarInput = document.getElementById('buscarMascota');
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroEdad = document.getElementById('filtroEdad');
  const filtroSalud = document.getElementById('filtroSalud');

  if (buscarInput) buscarInput.value = '';
  if (filtroTipo) filtroTipo.value = '';
  if (filtroEdad) filtroEdad.value = '';
  if (filtroSalud) filtroSalud.value = '';
  
  mostrarMascotas();
};

// Funciones CRUD de mascotas
window.registrarMascota = async function() {
  try {
    const form = document.getElementById('formNuevaMascota');
    
    if (!clienteId) {
      mostrarError('Error: No se pudo identificar tu perfil de cliente');
      return;
    }
    
    // Obtener datos del formulario
    const nombre = document.getElementById('nombreMascota')?.value?.trim();
    const tipo = document.getElementById('tipoMascota')?.value;
    const raza = document.getElementById('razaMascota')?.value?.trim();
    const edad = document.getElementById('edadMascota')?.value;
    const peso = document.getElementById('pesoMascota')?.value;
    const observaciones = document.getElementById('observaciones')?.value?.trim();
    
    console.log('Datos del formulario:', {
      clienteId, nombre, tipo, raza, edad, peso, observaciones
    });
    
    // Validar campos requeridos
    if (!nombre || !tipo) {
      mostrarError('Por favor, completa al menos el nombre y tipo de mascota');
      return;
    }

    // Preparar datos para enviar
    const datosMascota = {
      cliente_id: clienteId,
      nombre: nombre,
      especie: tipo,
      raza: raza || null,
      edad: edad ? parseInt(edad) : null,
      peso: peso ? parseFloat(peso) : null,
      observaciones: observaciones || null
    };

    console.log('Enviando datos de mascota:', datosMascota);

    // Enviar petición al servidor
    const response = await fetch('/api/mascotas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosMascota)
    });

    const result = await response.json();
    console.log('Respuesta del servidor:', result);

    if (!response.ok) throw new Error(result.error || 'Error al registrar la mascota');
    
    // Recargar datos
    await cargarMascotas();
    
    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaMascotaModal'));
    if (modal) modal.hide();
    form.reset();
    
    mostrarExito('Mascota registrada exitosamente');

  } catch (error) {
    console.error('Error al registrar mascota:', error);
    mostrarError(error.message || 'Error al registrar la mascota. Por favor, intenta de nuevo.');
  }
};

window.verMascota = function(mascotaId) {
  const mascota = mascotasData.find(m => m.id === mascotaId);
  if (!mascota) {
    mostrarError('Mascota no encontrada');
    return;
  }
  
  const avatarMascota = obtenerAvatarMascota(mascota.especie);
  const edad = mascota.edad ? `${mascota.edad} año${mascota.edad !== 1 ? 's' : ''}` : 'Sin especificar';
  const peso = mascota.peso ? `${mascota.peso} kg` : 'Sin especificar';

  document.getElementById('detallesMascotaContent').innerHTML = `
    <div class="row g-4">
      <div class="col-12 text-center mb-3">
        <div style="font-size: 5rem;">${avatarMascota}</div>
        <h3>${mascota.nombre}</h3>
        <p class="text-muted">${mascota.raza || mascota.especie}</p>
      </div>
      
      <div class="col-md-6">
        <h6>Información Básica</h6>
        <table class="table table-sm">
          <tr><td><strong>Tipo:</strong></td><td>${mascota.especie.charAt(0).toUpperCase() + mascota.especie.slice(1)}</td></tr>
          <tr><td><strong>Raza:</strong></td><td>${mascota.raza || 'No especificada'}</td></tr>
          <tr><td><strong>Edad:</strong></td><td>${edad}</td></tr>
          <tr><td><strong>Peso:</strong></td><td>${peso}</td></tr>
          <tr><td><strong>ID:</strong></td><td>${mascota.id}</td></tr>
        </table>
      </div>
      
      <div class="col-md-6">
        <h6>Información Adicional</h6>
        <table class="table table-sm">
          <tr><td><strong>Cliente ID:</strong></td><td>${mascota.cliente_id}</td></tr>
        </table>
      </div>
      
      <div class="col-12">
        <h6>Observaciones</h6>
        <p class="text-muted">${mascota.observaciones || 'Sin observaciones'}</p>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById('verMascotaModal')).show();
};

window.editarMascota = function(mascotaId) {
  const mascota = mascotasData.find(m => m.id === mascotaId);
  if (!mascota) {
    mostrarError('Mascota no encontrada');
    return;
  }

  mascotaEditandoId = mascotaId;
  
  // Pre-llenar el formulario con los datos existentes
  document.getElementById('editarMascotaId').value = mascotaId;
  
  // Crear el formulario de edición dinámicamente
  document.getElementById('formularioEdicion').innerHTML = `
    <div class="row g-4">
      <!-- Información básica -->
      <div class="col-12">
        <h6 class="border-bottom pb-2 mb-3">Información Básica</h6>
      </div>
      
      <div class="col-md-6">
        <label for="nombreMascotaEdit" class="form-label">Nombre de la mascota *</label>
        <input type="text" class="form-control" id="nombreMascotaEdit" value="${mascota.nombre}" required>
      </div>
      
      <div class="col-md-6">
        <label for="tipoMascotaEdit" class="form-label">Tipo de mascota *</label>
        <select class="form-select" id="tipoMascotaEdit" required>
          <option value="">Selecciona el tipo</option>
          <option value="perro" ${mascota.especie === 'perro' ? 'selected' : ''}>Perro</option>
          <option value="gato" ${mascota.especie === 'gato' ? 'selected' : ''}>Gato</option>
          <option value="ave" ${mascota.especie === 'ave' ? 'selected' : ''}>Ave</option>
          <option value="conejo" ${mascota.especie === 'conejo' ? 'selected' : ''}>Conejo</option>
          <option value="hamster" ${mascota.especie === 'hamster' ? 'selected' : ''}>Hamster</option>
          <option value="pez" ${mascota.especie === 'pez' ? 'selected' : ''}>Pez</option>
          <option value="reptil" ${mascota.especie === 'reptil' ? 'selected' : ''}>Reptil</option>
          <option value="tortuga" ${mascota.especie === 'tortuga' ? 'selected' : ''}>Tortuga</option>
        </select>
      </div>

      <div class="col-md-6">
        <label for="razaMascotaEdit" class="form-label">Raza</label>
        <input type="text" class="form-control" id="razaMascotaEdit" value="${mascota.raza || ''}" placeholder="Ej: Golden Retriever, Persa, etc.">
      </div>

      <div class="col-md-6">
        <label for="edadMascotaEdit" class="form-label">Edad (años)</label>
        <input type="number" class="form-control" id="edadMascotaEdit" min="0" max="30" step="1" value="${mascota.edad || ''}">
      </div>

      <div class="col-md-6">
        <label for="pesoMascotaEdit" class="form-label">Peso (kg)</label>
        <input type="number" class="form-control" id="pesoMascotaEdit" step="0.1" min="0" value="${mascota.peso || ''}">
      </div>

      <div class="col-md-6">
        <label for="observacionesEdit" class="form-label">Observaciones</label>
        <textarea class="form-control" id="observacionesEdit" rows="3" placeholder="Características especiales, alergias, etc.">${mascota.observaciones || ''}</textarea>
      </div>
    </div>
  `;
  
  new bootstrap.Modal(document.getElementById('editarMascotaModal')).show();
};

window.actualizarMascota = async function() {
  try {
    if (!mascotaEditandoId) {
      mostrarError('Error: No se pudo identificar la mascota a editar');
      return;
    }

    // Obtener datos del formulario de edición
    const nombre = document.getElementById('nombreMascotaEdit')?.value?.trim();
    const tipo = document.getElementById('tipoMascotaEdit')?.value;
    const raza = document.getElementById('razaMascotaEdit')?.value?.trim();
    const edad = document.getElementById('edadMascotaEdit')?.value;
    const peso = document.getElementById('pesoMascotaEdit')?.value;
    const observaciones = document.getElementById('observacionesEdit')?.value?.trim();
    
    // Validar campos requeridos
    if (!nombre || !tipo) {
      mostrarError('Por favor, completa al menos el nombre y tipo de mascota');
      return;
    }

    // Preparar datos para enviar
    const datosMascota = {
      nombre: nombre,
      especie: tipo,
      raza: raza || null,
      edad: edad ? parseInt(edad) : null,
      peso: peso ? parseFloat(peso) : null,
      observaciones: observaciones || null
    };

    console.log('Actualizando mascota:', mascotaEditandoId, datosMascota);

    // Enviar petición al servidor
    const response = await fetch(`/api/mascotas/${mascotaEditandoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosMascota)
    });

    const result = await response.json();
    console.log('Respuesta del servidor:', result);

    if (!response.ok) throw new Error(result.error || 'Error al actualizar la mascota');
    
    // Recargar datos
    await cargarMascotas();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarMascotaModal'));
    if (modal) modal.hide();
    
    mascotaEditandoId = null;
    mostrarExito('Mascota actualizada exitosamente');

  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    mostrarError(error.message || 'Error al actualizar la mascota. Por favor, intenta de nuevo.');
  }
};

window.eliminarMascota = async function(mascotaId) {
  const mascota = mascotasData.find(m => m.id === mascotaId);
  if (!mascota) {
    mostrarError('Mascota no encontrada');
    return;
  }

  if (!confirm(`¿Estás seguro de que deseas eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    console.log('Eliminando mascota ID:', mascotaId);

    const response = await fetch(`/api/mascotas/${mascotaId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Error al eliminar la mascota');
    
    // Recargar datos
    await cargarMascotas();
    
    mostrarExito(`${mascota.nombre} ha sido eliminado del registro`);

  } catch (error) {
    console.error('Error al eliminar mascota:', error);
    mostrarError(error.message || 'Error al eliminar la mascota. Por favor, intenta de nuevo.');
  }
};

window.editarMascotaDesdeVer = function() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('verMascotaModal'));
  if (modal) modal.hide();
  
  // Necesitaríamos saber qué mascota se está viendo
  if (mascotasData.length > 0) {
    editarMascota(mascotasData[0].id);
  }
};

// Cerrar sesión
window.cerrarSesion = function() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = '/';
  }
};

// Funciones de utilidad para mostrar mensajes
function mostrarError(mensaje) {
  console.error('Error:', mensaje);
  alert('Error: ' + mensaje);
}

function mostrarExito(mensaje) {
  console.log('Éxito:', mensaje);
  alert('Éxito: ' + mensaje);
}