// js/admin-servicios.js - TODAS LAS RUTAS CORREGIDAS

// ==================== VARIABLES GLOBALES ====================
let adminActual = null;
let sucursalActual = null;
let departamentos = [];
let municipios = [];
let sucursales = [];
let todosLosServicios = [];
let horariosActuales = [];
let horariosEspeciales = [];
let diasNoLaborables = [];
let modoEdicion = false;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Iniciando admin-servicios.js...');
  await verificarAutenticacion();
  await cargarDepartamentos();
  await cargarServicios();
  configurarEventListeners();
  actualizarHora();
  setInterval(actualizarHora, 60000);
});

// ==================== AUTENTICACIÓN ====================

async function verificarAutenticacion() {
  console.log('🔐 Verificando autenticación...');
  const usuario = sessionStorage.getItem('usuario');
  
  if (!usuario) {
    alert('Debe iniciar sesión para acceder al panel de administración');
    window.location.href = '/login.html';
    return;
  }

  try {
    adminActual = JSON.parse(usuario);
    
    if (adminActual.rol !== 'admin') {
      alert('No tiene permisos para acceder a esta sección');
      window.location.href = '/cliente-dashboard.html';
      return;
    }

    document.getElementById('adminNombre').textContent = adminActual.nombre;
    console.log('✅ Admin autenticado:', adminActual.nombre);
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
    window.location.href = '/login.html';
  }
}

// ==================== CARGA DE DEPARTAMENTOS Y FILTROS ====================

async function cargarDepartamentos() {
  try {
    console.log('📍 Cargando departamentos...');
    const response = await fetch('/api/departamentos');
    if (!response.ok) throw new Error('Error al obtener departamentos');
    
    departamentos = await response.json();
    console.log(`✅ ${departamentos.length} departamentos cargados`);
    
    renderizarDepartamentos();
  } catch (error) {
    console.error('❌ Error al cargar departamentos:', error);
    mostrarError('Error al cargar los departamentos');
  }
}

function renderizarDepartamentos() {
  const select = document.getElementById('filtroDepartamento');
  select.innerHTML = '<option value="">Seleccione departamento...</option>';
  
  departamentos.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.nombre;
    select.appendChild(option);
  });
}

async function cargarMunicipiosPorDepartamento(departamentoId) {
  try {
    console.log('🏘️ Cargando municipios del departamento:', departamentoId);
    const response = await fetch(`/api/municipios?departamento_id=${departamentoId}`);
    if (!response.ok) throw new Error('Error al obtener municipios');
    
    municipios = await response.json();
    console.log(`✅ ${municipios.length} municipios cargados`);
    
    renderizarMunicipios();
  } catch (error) {
    console.error('❌ Error al cargar municipios:', error);
    mostrarError('Error al cargar los municipios');
  }
}

function renderizarMunicipios() {
  const select = document.getElementById('filtroMunicipio');
  select.innerHTML = '<option value="">Seleccione municipio...</option>';
  select.disabled = false;
  
  municipios.forEach(mun => {
    const option = document.createElement('option');
    option.value = mun.id;
    option.textContent = mun.nombre;
    select.appendChild(option);
  });
}

async function cargarSucursales(departamentoId = null, municipioId = null) {
  try {
    console.log('🏢 Cargando sucursales...', { departamentoId, municipioId });
    
    let url = '/api/sucursales/filtrar?';
    if (municipioId) {
      url += `municipio_id=${municipioId}`;
    } else if (departamentoId) {
      url += `departamento_id=${departamentoId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener sucursales');
    
    sucursales = await response.json();
    console.log(`✅ ${sucursales.length} sucursales cargadas`);
    
    renderizarSucursales();
  } catch (error) {
    console.error('❌ Error al cargar sucursales:', error);
    mostrarError('Error al cargar las sucursales');
  }
}

function renderizarSucursales() {
  const select = document.getElementById('filtroSucursal');
  select.innerHTML = '<option value="">Seleccione sucursal...</option>';
  select.disabled = sucursales.length === 0;
  
  sucursales.forEach(suc => {
    const option = document.createElement('option');
    option.value = suc.id;
    option.textContent = suc.nombre;
    select.appendChild(option);
  });
}

async function seleccionarSucursal(sucursalId) {
  if (!sucursalId) {
    sucursalActual = null;
    document.getElementById('contenidoPrincipal').style.display = 'none';
    document.getElementById('alertaSucursal').className = 'alert alert-info mt-3 mb-0';
    document.getElementById('alertaSucursal').innerHTML = '<i class="bi bi-info-circle me-2"></i>Seleccione una sucursal para administrar sus servicios, horarios y días no laborables.';
    document.getElementById('sucursalActualWidget').textContent = 'Seleccione una sucursal';
    return;
  }

  try {
    console.log('🏢 Seleccionando sucursal:', sucursalId);
    const response = await fetch(`/api/sucursales/${sucursalId}`);
    if (!response.ok) throw new Error('Error al obtener sucursal');
    
    sucursalActual = await response.json();
    console.log('✅ Sucursal seleccionada:', sucursalActual);
    
    // Actualizar UI
    document.getElementById('contenidoPrincipal').style.display = 'block';
    document.getElementById('alertaSucursal').className = 'alert alert-success mt-3 mb-0';
    document.getElementById('alertaSucursal').innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      <strong>Sucursal seleccionada:</strong> ${sucursalActual.nombre} - ${sucursalActual.municipio_nombre}, ${sucursalActual.departamento_nombre}
    `;
    document.getElementById('sucursalActualWidget').textContent = sucursalActual.nombre;
    document.getElementById('nombreSucursalHorarios').textContent = sucursalActual.nombre;
    document.getElementById('nombreSucursalDias').textContent = sucursalActual.nombre;
    
    // Cargar datos de la sucursal
    await Promise.all([
      cargarHorariosSucursal(),
      cargarHorariosEspeciales(),
      cargarDiasNoLaborables()
    ]);
    
  } catch (error) {
    console.error('❌ Error al seleccionar sucursal:', error);
    mostrarError('Error al cargar los datos de la sucursal');
  }
}

// ==================== CARGA DE SERVICIOS ====================

async function cargarServicios() {
  try {
    console.log('📋 Cargando servicios...');
    
    // ✅ CORREGIDO: Ruta simplificada sin duplicación
    const response = await fetch('/api/servicios');
    if (!response.ok) throw new Error('Error al obtener servicios');
    
    todosLosServicios = await response.json();
    console.log(`✅ ${todosLosServicios.length} servicios cargados`);
    
    renderizarServicios();
    
  } catch (error) {
    console.error('❌ Error al cargar servicios:', error);
    document.getElementById('serviciosContainer').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar los servicios: ${error.message}
      </div>
    `;
  }
}

function renderizarServicios() {
  const container = document.getElementById('serviciosContainer');
  
  if (todosLosServicios.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-clipboard-x" style="font-size: 3rem;"></i>
        <h4 class="mt-3">No hay servicios</h4>
        <p>No se han agregado servicios todavía</p>
      </div>
    `;
    return;
  }

  let html = '<div class="table-responsive"><table class="table table-hover align-middle"><thead><tr>';
  html += '<th>Servicio</th><th>Precio</th><th>Duración</th><th>Estado</th><th width="200">Acciones</th>';
  html += '</tr></thead><tbody>';

  todosLosServicios.forEach(servicio => {
    const estadoBadge = servicio.activo 
      ? '<span class="badge bg-success">Activo</span>' 
      : '<span class="badge bg-secondary">Inactivo</span>';
    
    html += `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <div class="servicio-icon-sm bg-${servicio.color} me-2">
              <i class="bi ${servicio.icono}"></i>
            </div>
            <div>
              <strong>${servicio.nombre}</strong>
              ${servicio.descripcion ? `<br><small class="text-muted">${servicio.descripcion}</small>` : ''}
            </div>
          </div>
        </td>
        <td><strong>Q${parseFloat(servicio.precio).toFixed(2)}</strong></td>
        <td>${servicio.duracion_minutos} min</td>
        <td>${estadoBadge}</td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="editarServicio(${servicio.id})" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-${servicio.activo ? 'warning' : 'success'}" 
                    onclick="toggleServicio(${servicio.id}, ${!servicio.activo})" 
                    title="${servicio.activo ? 'Desactivar' : 'Activar'}">
              <i class="bi bi-${servicio.activo ? 'pause' : 'play'}-circle"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarServicio(${servicio.id})" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ==================== FUNCIONES DE SERVICIOS ====================

function nuevoServicio() {
  modoEdicion = false;
  
  document.getElementById('tituloFormServicio').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nuevo Servicio';
  document.getElementById('formServicio').reset();
  document.getElementById('servicioId').value = '';
  document.getElementById('servicioDuracion').value = '30';
  document.getElementById('servicioActivo').value = 'true';
  document.getElementById('servicioIcono').value = 'bi-heart-pulse';
  document.getElementById('servicioColor').value = 'primary';
  
  const modal = new bootstrap.Modal(document.getElementById('modalFormServicio'));
  modal.show();
}

window.editarServicio = function(id) {
  const servicio = todosLosServicios.find(s => s.id === id);
  if (!servicio) {
    mostrarError('Servicio no encontrado');
    return;
  }
  
  modoEdicion = true;
  
  document.getElementById('tituloFormServicio').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Servicio';
  document.getElementById('servicioId').value = servicio.id;
  document.getElementById('servicioNombre').value = servicio.nombre;
  document.getElementById('servicioPrecio').value = servicio.precio;
  document.getElementById('servicioDuracion').value = servicio.duracion_minutos;
  document.getElementById('servicioActivo').value = servicio.activo.toString();
  document.getElementById('servicioIcono').value = servicio.icono;
  document.getElementById('servicioColor').value = servicio.color;
  document.getElementById('servicioDescripcion').value = servicio.descripcion || '';
  
  const modal = new bootstrap.Modal(document.getElementById('modalFormServicio'));
  modal.show();
};

async function guardarServicio() {
  try {
    const form = document.getElementById('formServicio');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const id = document.getElementById('servicioId').value;
    const datos = {
      nombre: document.getElementById('servicioNombre').value.trim(),
      precio: parseFloat(document.getElementById('servicioPrecio').value),
      duracion_minutos: parseInt(document.getElementById('servicioDuracion').value),
      activo: document.getElementById('servicioActivo').value === 'true',
      icono: document.getElementById('servicioIcono').value,
      color: document.getElementById('servicioColor').value,
      descripcion: document.getElementById('servicioDescripcion').value.trim()
    };

    const btn = document.getElementById('btnGuardarServicio');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    let response;
    if (modoEdicion) {
      // ✅ CORREGIDO: Ruta simplificada
      response = await fetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    } else {
      response = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar servicio');
    }

    mostrarExito(modoEdicion ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('modalFormServicio')).hide();
    await cargarServicios();

  } catch (error) {
    console.error('❌ Error al guardar servicio:', error);
    mostrarError(error.message);
  } finally {
    const btn = document.getElementById('btnGuardarServicio');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
  }
}

window.toggleServicio = async function(id, activo) {
  try {
    const accion = activo ? 'activar' : 'desactivar';
    if (!confirm(`¿Está seguro de ${accion} este servicio?`)) return;

    // ✅ CORREGIDO: Ruta simplificada
    const response = await fetch(`/api/servicios/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito(`Servicio ${activo ? 'activado' : 'desactivado'} correctamente`);
    await cargarServicios();

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    mostrarError(error.message);
  }
};

window.eliminarServicio = async function(id) {
  try {
    const servicio = todosLosServicios.find(s => s.id === id);
    if (!confirm(`¿Está seguro de eliminar el servicio "${servicio.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    // ✅ CORREGIDO: Ruta simplificada
    const response = await fetch(`/api/servicios/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Servicio eliminado correctamente');
    await cargarServicios();

  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    mostrarError(error.message);
  }
};

// ==================== HORARIOS DE ATENCIÓN ====================

async function cargarHorariosSucursal() {
  if (!sucursalActual) return;
  
  try {
    console.log('⏰ Cargando horarios de la sucursal...');
    
    // ✅ CORREGIDO: Ruta correcta para horarios de sucursal
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/horarios`);
    if (!response.ok) throw new Error('Error al obtener horarios');
    
    horariosActuales = await response.json();
    console.log(`✅ ${horariosActuales.length} horarios cargados`);
    
    renderizarHorarios();
    
  } catch (error) {
    console.error('❌ Error al cargar horarios:', error);
    document.getElementById('horariosContainer').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar los horarios: ${error.message}
      </div>
    `;
  }
}

function renderizarHorarios() {
  const container = document.getElementById('horariosContainer');
  
  if (horariosActuales.length === 0) {
    container.innerHTML = `
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle me-2"></i>
        No se han configurado horarios para esta sucursal
      </div>
    `;
    return;
  }

  const diasNombres = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };

  let html = '<div class="row g-3">';

  horariosActuales.forEach(horario => {
    const horaInicio = horario.hora_inicio.substring(0, 5);
    const horaFin = horario.hora_fin.substring(0, 5);
    
    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card ${!horario.activo ? 'border-secondary' : 'border-primary'}">
          <div class="card-header d-flex justify-content-between align-items-center ${!horario.activo ? 'bg-light' : 'bg-primary text-white'}">
            <h6 class="mb-0">${diasNombres[horario.dia_semana]}</h6>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" id="activo_${horario.id}" 
                ${horario.activo ? 'checked' : ''} 
                onchange="cambiarEstadoDia(${horario.id}, this.checked)">
            </div>
          </div>
          
          <div class="card-body ${!horario.activo ? 'text-muted' : ''}">
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small">Hora Inicio</label>
                <input type="time" class="form-control form-control-sm" 
                  id="inicio_${horario.id}" 
                  value="${horaInicio}"
                  ${!horario.activo ? 'disabled' : ''}>
              </div>
              <div class="col-6">
                <label class="form-label small">Hora Fin</label>
                <input type="time" class="form-control form-control-sm" 
                  id="fin_${horario.id}" 
                  value="${horaFin}"
                  ${!horario.activo ? 'disabled' : ''}>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

window.cambiarEstadoDia = function(id, activo) {
  const inicioInput = document.getElementById(`inicio_${id}`);
  const finInput = document.getElementById(`fin_${id}`);
  
  inicioInput.disabled = !activo;
  finInput.disabled = !activo;
};

async function guardarHorarios() {
  if (!sucursalActual) {
    mostrarError('Debe seleccionar una sucursal');
    return;
  }

  try {
    const horarios = [];
    
    horariosActuales.forEach(h => {
      const activo = document.getElementById(`activo_${h.id}`).checked;
      const inicio = document.getElementById(`inicio_${h.id}`).value;
      const fin = document.getElementById(`fin_${h.id}`).value;
      
      horarios.push({
        id: h.id,
        hora_inicio: inicio,
        hora_fin: fin,
        activo: activo
      });
    });

    const btn = document.getElementById('btnGuardarHorarios');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/horarios`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horarios })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Horarios actualizados correctamente');
    await cargarHorariosSucursal();

  } catch (error) {
    console.error('❌ Error al guardar horarios:', error);
    mostrarError(error.message);
  } finally {
    const btn = document.getElementById('btnGuardarHorarios');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar Cambios';
  }
}

// ==================== HORARIOS ESPECIALES ====================

async function cargarHorariosEspeciales() {
  if (!sucursalActual) return;
  
  try {
    console.log('📅 Cargando horarios especiales...');
    
    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/horarios-especiales`);
    if (!response.ok) throw new Error('Error al obtener horarios especiales');
    
    horariosEspeciales = await response.json();
    console.log(`✅ ${horariosEspeciales.length} horarios especiales cargados`);
    
    renderizarHorariosEspeciales();
    
  } catch (error) {
    console.error('❌ Error al cargar horarios especiales:', error);
    document.getElementById('horariosEspecialesContainer').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar los horarios especiales: ${error.message}
      </div>
    `;
  }
}

function renderizarHorariosEspeciales() {
  const container = document.getElementById('horariosEspecialesContainer');
  
  if (horariosEspeciales.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-calendar-event" style="font-size: 3rem;"></i>
        <h4 class="mt-3">No hay horarios especiales</h4>
        <p>No se han configurado horarios especiales para esta sucursal</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th width="25%">Fecha</th>
            <th width="15%">Hora Inicio</th>
            <th width="15%">Hora Fin</th>
            <th width="35%">Motivo</th>
            <th width="10%" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  horariosEspeciales.forEach(horario => {
    const fecha = new Date(horario.fecha + 'T00:00:00');
    const fechaFormateada = fecha.toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    html += `
      <tr>
        <td>
          <strong>${fechaFormateada}</strong><br>
          <small class="text-muted">${horario.fecha}</small>
        </td>
        <td><i class="bi bi-clock text-success me-1"></i>${horario.hora_inicio.substring(0, 5)}</td>
        <td><i class="bi bi-clock text-danger me-1"></i>${horario.hora_fin.substring(0, 5)}</td>
        <td>
          <i class="bi bi-calendar-event text-warning me-2"></i>
          ${horario.descripcion}
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarHorarioEspecial(${horario.id})" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
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

function nuevoHorarioEspecial() {
  if (!sucursalActual) {
    mostrarError('Debe seleccionar una sucursal primero');
    return;
  }

  document.getElementById('formHorarioEspecial').reset();
  document.getElementById('horarioEspecialId').value = '';
  
  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('horarioEspecialFecha').min = hoy;
  
  const modal = new bootstrap.Modal(document.getElementById('modalHorarioEspecial'));
  modal.show();
}

async function guardarHorarioEspecial() {
  if (!sucursalActual) {
    mostrarError('Debe seleccionar una sucursal');
    return;
  }

  try {
    const form = document.getElementById('formHorarioEspecial');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const datos = {
      fecha: document.getElementById('horarioEspecialFecha').value,
      hora_inicio: document.getElementById('horarioEspecialInicio').value,
      hora_fin: document.getElementById('horarioEspecialFin').value,
      descripcion: document.getElementById('horarioEspecialMotivo').value.trim()
    };

    const btn = document.getElementById('btnGuardarHorarioEspecial');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/horarios-especiales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Horario especial creado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('modalHorarioEspecial')).hide();
    await cargarHorariosEspeciales();

  } catch (error) {
    console.error('❌ Error al guardar horario especial:', error);
    mostrarError(error.message);
  } finally {
    const btn = document.getElementById('btnGuardarHorarioEspecial');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
  }
}

window.eliminarHorarioEspecial = async function(id) {
  try {
    const horario = horariosEspeciales.find(h => h.id === id);
    if (!confirm(`¿Está seguro de eliminar el horario especial del ${horario.fecha}?`)) {
      return;
    }

    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/horarios-especiales/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Horario especial eliminado correctamente');
    await cargarHorariosEspeciales();

  } catch (error) {
    console.error('❌ Error al eliminar horario especial:', error);
    mostrarError(error.message);
  }
};

// ==================== DÍAS NO LABORABLES ====================

async function cargarDiasNoLaborables() {
  if (!sucursalActual) return;
  
  try {
    console.log('📅 Cargando días no laborables...');
    
    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/dias-no-laborables`);
    if (!response.ok) throw new Error('Error al obtener días no laborables');
    
    diasNoLaborables = await response.json();
    console.log(`✅ ${diasNoLaborables.length} días no laborables cargados`);
    
    renderizarDiasNoLaborables();
    
  } catch (error) {
    console.error('❌ Error al cargar días no laborables:', error);
    document.getElementById('diasNoLaborablesContainer').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar los días no laborables: ${error.message}
      </div>
    `;
  }
}

function renderizarDiasNoLaborables() {
  const container = document.getElementById('diasNoLaborablesContainer');
  
  if (diasNoLaborables.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-calendar-check" style="font-size: 3rem;"></i>
        <h4 class="mt-3">No hay días no laborables</h4>
        <p>No se han configurado días festivos o de descanso para esta sucursal</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th width="35%">Fecha</th>
            <th width="45%">Motivo</th>
            <th width="20%" class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;

  diasNoLaborables.forEach(dia => {
    const fecha = new Date(dia.fecha + 'T00:00:00');
    const fechaFormateada = fecha.toLocaleDateString('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    html += `
      <tr>
        <td>
          <strong>${fechaFormateada}</strong><br>
          <small class="text-muted">${dia.fecha}</small>
        </td>
        <td>
          <i class="bi bi-calendar-x text-danger me-2"></i>
          ${dia.descripcion}
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarDiaNoLaborable(${dia.id})" title="Eliminar">
            <i class="bi bi-trash"></i> Eliminar
          </button>
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

function nuevoDiaNoLaborable() {
  if (!sucursalActual) {
    mostrarError('Debe seleccionar una sucursal primero');
    return;
  }

  document.getElementById('formDiaNoLaborable').reset();
  
  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('diaNoLaborableFecha').min = hoy;
  
  const modal = new bootstrap.Modal(document.getElementById('modalDiaNoLaborable'));
  modal.show();
}

async function guardarDiaNoLaborable() {
  if (!sucursalActual) {
    mostrarError('Debe seleccionar una sucursal');
    return;
  }

  try {
    const form = document.getElementById('formDiaNoLaborable');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const datos = {
      fecha: document.getElementById('diaNoLaborableFecha').value,
      descripcion: document.getElementById('diaNoLaborableMotivo').value.trim()
    };

    const btn = document.getElementById('btnGuardarDiaNoLaborable');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando...';

    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/sucursales/${sucursalActual.id}/dias-no-laborables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Día no laborable agregado correctamente');
    
    bootstrap.Modal.getInstance(document.getElementById('modalDiaNoLaborable')).hide();
    await cargarDiasNoLaborables();

  } catch (error) {
    console.error('❌ Error al guardar día no laborable:', error);
    mostrarError(error.message);
  } finally {
    const btn = document.getElementById('btnGuardarDiaNoLaborable');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
  }
}

window.eliminarDiaNoLaborable = async function(id) {
  try {
    const dia = diasNoLaborables.find(d => d.id === id);
    if (!confirm(`¿Está seguro de eliminar el día no laborable "${dia.descripcion}"?`)) {
      return;
    }

    // ✅ CORREGIDO: Ruta correcta
    const response = await fetch(`/api/dias-no-laborables/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    mostrarExito('Día no laborable eliminado correctamente');
    await cargarDiasNoLaborables();

  } catch (error) {
    console.error('❌ Error al eliminar día no laborable:', error);
    mostrarError(error.message);
  }
};

// ==================== EVENT LISTENERS ====================

function configurarEventListeners() {
  // Cerrar sesión
  document.getElementById('cerrarSesionBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Está seguro de cerrar sesión?')) {
      sessionStorage.clear();
      window.location.href = '/login.html';
    }
  });

  // Mi Perfil
  document.getElementById('btnMiPerfil')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/admin-perfil.html';
  });

  // Actualizar datos
  document.getElementById('btnActualizarDatos')?.addEventListener('click', async () => {
    await cargarServicios();
    if (sucursalActual) {
      await Promise.all([
        cargarHorariosSucursal(),
        cargarHorariosEspeciales(),
        cargarDiasNoLaborables()
      ]);
    }
    mostrarExito('Datos actualizados correctamente');
  });

  // Filtro de departamento
  document.getElementById('filtroDepartamento')?.addEventListener('change', async (e) => {
    const departamentoId = e.target.value;
    
    // Reset
    document.getElementById('filtroMunicipio').innerHTML = '<option value="">Seleccione municipio...</option>';
    document.getElementById('filtroMunicipio').disabled = true;
    document.getElementById('filtroSucursal').innerHTML = '<option value="">Seleccione sucursal...</option>';
    document.getElementById('filtroSucursal').disabled = true;
    sucursalActual = null;
    document.getElementById('contenidoPrincipal').style.display = 'none';
    
    if (departamentoId) {
      await cargarMunicipiosPorDepartamento(departamentoId);
    }
  });

  // Filtro de municipio
  document.getElementById('filtroMunicipio')?.addEventListener('change', async (e) => {
    const departamentoId = document.getElementById('filtroDepartamento').value;
    const municipioId = e.target.value;
    
    // Reset sucursal
    document.getElementById('filtroSucursal').innerHTML = '<option value="">Seleccione sucursal...</option>';
    document.getElementById('filtroSucursal').disabled = true;
    sucursalActual = null;
    document.getElementById('contenidoPrincipal').style.display = 'none';
    
    if (municipioId) {
      await cargarSucursales(departamentoId, municipioId);
    }
  });

  // Selección de sucursal
  document.getElementById('filtroSucursal')?.addEventListener('change', async (e) => {
    await seleccionarSucursal(e.target.value);
  });

  // Botones de servicios
  document.getElementById('btnNuevoServicio')?.addEventListener('click', nuevoServicio);
  document.getElementById('btnGuardarServicio')?.addEventListener('click', guardarServicio);

  // Botones de horarios
  document.getElementById('btnGuardarHorarios')?.addEventListener('click', guardarHorarios);

  // Botones de horarios especiales
  document.getElementById('btnNuevoHorarioEspecial')?.addEventListener('click', nuevoHorarioEspecial);
  document.getElementById('btnGuardarHorarioEspecial')?.addEventListener('click', guardarHorarioEspecial);

  // Botones de días no laborables
  document.getElementById('btnNuevoDiaNoLaborable')?.addEventListener('click', nuevoDiaNoLaborable);
  document.getElementById('btnGuardarDiaNoLaborable')?.addEventListener('click', guardarDiaNoLaborable);

  console.log('✅ Event listeners configurados');
}

// ==================== UTILIDADES ====================

function actualizarHora() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const elem = document.getElementById('horaActualizacion');
  if (elem) elem.textContent = hora;
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