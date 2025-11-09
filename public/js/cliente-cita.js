// /js/cliente-cita.js - VERSIÓN MEJORADA CON VALIDACIONES

// Variables globales
let citasData = [];
let mascotasData = [];
let serviciosData = [];
let sucursalesData = [];
let horasCitasData = [];
let clienteId = null;
let usuarioActual = null;
let citaEditando = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  inicializarPagina();
});

// Función principal de inicialización
async function inicializarPagina() {
  try {
    usuarioActual = obtenerUsuarioActual();
    if (!usuarioActual) {
      console.log('Usuario no autenticado, redirigiendo...');
      window.location.href = '/';
      return;
    }

    console.log('Usuario autenticado:', usuarioActual);
    actualizarInfoUsuario();

    await Promise.all([
      cargarClienteId(),
      cargarServicios(),
      cargarSucursales()
    ]);

    if (clienteId) {
      await actualizarCitasPasadasCliente();
      await Promise.all([
        cargarMascotas(),
        cargarCitas()
      ]);
    } else {
      console.error('No se pudo obtener el ID del cliente');
      mostrarError('Error: No se pudo identificar tu perfil de cliente');
      return;
    }

    configurarFechaMinima();
    configurarEventListeners();

  } catch (error) {
    console.error('Error al inicializar página:', error);
    mostrarError('Error al cargar la página. Por favor, recarga.');
  }
}

// Actualizar citas pasadas del cliente
async function actualizarCitasPasadasCliente() {
  try {
    console.log(`🔄 Verificando citas pasadas del cliente ${clienteId}...`);
    
    const response = await fetch(`/api/citas/actualizar-cliente/${clienteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const resultado = await response.json();
      if (resultado.citasActualizadas > 0) {
        console.log(`✅ ${resultado.citasActualizadas} cita(s) actualizada(s) a completada`);
      }
    }
  } catch (error) {
    console.error('Error al actualizar citas pasadas:', error);
  }
}

function obtenerUsuarioActual() {
  const usuario = sessionStorage.getItem('usuario');
  if (!usuario) return null;
  
  try {
    return JSON.parse(usuario);
  } catch (error) {
    console.error('Error al parsear usuario:', error);
    return null;
  }
}

function actualizarInfoUsuario() {
  if (usuarioActual) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      userNameElement.textContent = usuarioActual.nombre;
    }
  }
}

async function cargarClienteId() {
  try {
    const response = await fetch(`/api/clientes`);
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

async function cargarMascotas() {
  try {
    if (!clienteId) return;

    const response = await fetch(`/api/mascotas/cliente/${clienteId}`);
    
    if (!response.ok) {
      const responseGeneral = await fetch(`/api/mascotas`);
      if (!responseGeneral.ok) throw new Error('Error al obtener mascotas');
      
      const todasMascotas = await responseGeneral.json();
      mascotasData = todasMascotas.filter(mascota => mascota.cliente_id === clienteId);
    } else {
      mascotasData = await response.json();
    }
    
    actualizarSelectMascotas();
    actualizarFiltroMascotas();

  } catch (error) {
    console.error('Error al cargar mascotas:', error);
    mostrarError('Error al cargar las mascotas');
  }
}

async function cargarServicios() {
  try {
    const response = await fetch(`/api/servicios`);
    if (!response.ok) throw new Error('Error al obtener servicios');
    
    serviciosData = await response.json();
    actualizarSelectServicios();

  } catch (error) {
    console.error('Error al cargar servicios:', error);
    mostrarError('Error al cargar los servicios');
  }
}

async function cargarSucursales() {
  try {
    const response = await fetch(`/api/sucursales`);
    if (!response.ok) throw new Error('Error al obtener sucursales');
    
    sucursalesData = await response.json();
    actualizarSelectSucursales();

  } catch (error) {
    console.error('Error al cargar sucursales:', error);
    mostrarError('Error al cargar las sucursales');
  }
}

async function cargarHorariosCitas() {
  try {
    const response = await fetch(`/api/sucursales/HorasCitas`);
    if (!response.ok) throw new Error('Error al obtener Horas Citas');
    
    horasCitasData = await response.json();
    actualizarSelectHorasCitas();

  } catch (error) {
    console.error('Error al cargar sucursales:', error);
    mostrarError('Error al cargar las sucursales');
  }
}

async function cargarCitas() {
  try {
    if (!clienteId) return;

    mostrarEstadoCarga(true);

    let response = await fetch(`/api/citas/cliente/${clienteId}`);
    
    if (!response.ok) {
      response = await fetch(`/api/citas`);
      if (!response.ok) throw new Error('Error al obtener citas');
      
      const todasCitas = await response.json();
      citasData = todasCitas.filter(cita => cita.cliente_id === clienteId);
    } else {
      citasData = await response.json();
    }
    
    actualizarEstadisticas();
    mostrarCitas();
    actualizarProximaCita();
    actualizarNotificaciones();
    
    mostrarEstadoCarga(false);

  } catch (error) {
    console.error('Error al cargar citas:', error);
    mostrarEstadoCarga(false);
    mostrarError('Error al cargar las citas');
  }
}

function mostrarEstadoCarga(mostrar) {
  const loadingState = document.getElementById('loadingState');
  const filtrosSection = document.getElementById('filtrosSection');
  const citasSection = document.getElementById('citasSection');
  const sinCitasState = document.getElementById('sinCitasState');
  
  if (mostrar) {
    loadingState.style.display = 'block';
    filtrosSection.style.display = 'none';
    citasSection.style.display = 'none';
    sinCitasState.style.display = 'none';
  } else {
    loadingState.style.display = 'none';
    
    if (citasData.length > 0) {
      filtrosSection.style.display = 'block';
      citasSection.style.display = 'block';
      sinCitasState.style.display = 'none';
    } else {
      filtrosSection.style.display = 'none';
      citasSection.style.display = 'none';
      sinCitasState.style.display = 'block';
    }
  }
}

function actualizarEstadisticas() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const citasProgramadas = citasData.filter(cita => {
    const fechaCita = new Date(cita.fecha);
    return fechaCita >= hoy && (cita.estado === 'pendiente' || cita.estado === 'confirmada');
  });
  
  const citasCompletadas = citasData.filter(cita => cita.estado === 'completada');
  
  const citasHoy = citasData.filter(cita => {
    const fechaCita = new Date(cita.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    return fechaCita.getTime() === hoy.getTime();
  });
  
  const citasSemana = citasData.filter(cita => {
    const fechaCita = new Date(cita.fecha);
    return fechaCita >= inicioSemana && fechaCita <= finSemana;
  });

  document.getElementById('citasProgramadas').textContent = citasProgramadas.length;
  document.getElementById('citasCompletadas').textContent = citasCompletadas.length;
  document.getElementById('citasHoy').textContent = citasHoy.length;
  document.getElementById('citasSemana').textContent = citasSemana.length;
  document.getElementById('citasCount').textContent = citasProgramadas.length;
}

function actualizarSelectMascotas() {
  const select = document.getElementById('mascotaSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecciona una mascota</option>';
  
  if (mascotasData.length === 0) {
    select.innerHTML += '<option value="" disabled>No tienes mascotas registradas</option>';
    return;
  }
  
  mascotasData.forEach(mascota => {
    select.innerHTML += `<option value="${mascota.id}">${mascota.nombre} - ${mascota.especie} ${mascota.raza}</option>`;
  });
}

function actualizarSelectServicios() {
  const select = document.getElementById('servicioSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecciona un servicio</option>';
  
  serviciosData.forEach(servicio => {
    select.innerHTML += `<option value="${servicio.id}">${servicio.nombre}</option>`;
  });
}

function actualizarSelectSucursales() {
  const select = document.getElementById('sucursalSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecciona una sucursal</option>';
  
  sucursalesData.forEach(sucursal => {
    select.innerHTML += `<option value="${sucursal.id}">${sucursal.nombre} - ${sucursal.direccion}</option>`;
  });
}

/*function actualizarSelectHorasCitas() {
  const select = document.getElementById('horaCita');
  if (!select) return;
  console.log(select);
  select.innerHTML = '<option value="">Selecciona una sucursal</option>';
  
  sucursalesData.forEach(sucursal => {
    select.innerHTML += `<option value="${sucursal.id}">${sucursal.nombre} - ${sucursal.direccion}</option>`;
  });
}*/

function actualizarFiltroMascotas() {
  const select = document.getElementById('filtroMascota');
  if (!select) return;
  
  select.innerHTML = '<option value="">Todas las mascotas</option>';
  
  mascotasData.forEach(mascota => {
    select.innerHTML += `<option value="${mascota.id}">${mascota.nombre}</option>`;
  });
}

// ========== VALIDACIÓN Y CREACIÓN DE CITAS ==========

function validarFormularioCita() {
  const form = document.getElementById('formNuevaCita');
  const mascotaId = document.getElementById('mascotaSelect').value;
  const servicioId = document.getElementById('servicioSelect').value;
  const sucursalId = document.getElementById('sucursalSelect').value;
  const fecha = document.getElementById('fechaCita').value;
  const hora = document.getElementById('horaCita').value;
  
  let errores = [];
  
  // Validar mascota
  if (!mascotaId) {
    errores.push('Debes seleccionar una mascota');
    document.getElementById('mascotaSelect').classList.add('is-invalid');
  } else {
    document.getElementById('mascotaSelect').classList.remove('is-invalid');
  }
  
  // Validar servicio
  if (!servicioId) {
    errores.push('Debes seleccionar un servicio');
    document.getElementById('servicioSelect').classList.add('is-invalid');
  } else {
    document.getElementById('servicioSelect').classList.remove('is-invalid');
  }
  
  // Validar sucursal
  if (!sucursalId) {
    errores.push('Debes seleccionar una sucursal');
    document.getElementById('sucursalSelect').classList.add('is-invalid');
  } else {
    document.getElementById('sucursalSelect').classList.remove('is-invalid');
  }
  
  // Validar fecha
  if (!fecha) {
    errores.push('Debes seleccionar una fecha');
    document.getElementById('fechaCita').classList.add('is-invalid');
  } else {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      errores.push('La fecha no puede ser anterior a hoy');
      document.getElementById('fechaCita').classList.add('is-invalid');
    } else {
      document.getElementById('fechaCita').classList.remove('is-invalid');
    }
  }
  
  // Validar hora
  if (!hora) {
    errores.push('Debes seleccionar una hora');
    document.getElementById('horaCita').classList.add('is-invalid');
  } else {
    document.getElementById('horaCita').classList.remove('is-invalid');
  }
  
  // Mostrar errores si los hay
  if (errores.length > 0) {
    mostrarErrorEnModal(errores.join('<br>'));
    return false;
  }
  
  return true;
}

function mostrarErrorEnModal(mensaje) {
  const alertError = document.getElementById('alertErrorCita');
  const mensajeError = document.getElementById('mensajeErrorCita');
  
  mensajeError.innerHTML = mensaje;
  alertError.style.display = 'block';
  alertError.classList.add('show');
  
  // Scroll al top del modal
  document.querySelector('#nuevaCitaModal .modal-body').scrollTop = 0;
}

function ocultarErrorEnModal() {
  const alertError = document.getElementById('alertErrorCita');
  alertError.style.display = 'none';
  alertError.classList.remove('show');
}

async function agendarCita() {
  try {
    // Ocultar errores previos
    ocultarErrorEnModal();
    
    // Validar formulario
    if (!validarFormularioCita()) {
      return;
    }
    
    if (!clienteId) {
      mostrarErrorEnModal('Error: No se pudo identificar tu perfil de cliente');
      return;
    }
    
    const mascotaId = document.getElementById('mascotaSelect').value;
    const servicioId = document.getElementById('servicioSelect').value;
    const sucursalId = document.getElementById('sucursalSelect').value;
    const fecha = document.getElementById('fechaCita').value;
    const hora = document.getElementById('horaCita').value;
    const motivo = document.getElementById('motivoConsulta').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();
    
    // Deshabilitar botón mientras se procesa
    const btnAgendar = document.getElementById('btnAgendarCita');
    const btnTextOriginal = btnAgendar.innerHTML;
    btnAgendar.disabled = true;
    btnAgendar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Agendando...';
    
    const datosCita = {
      cliente_id: clienteId,
      mascota_id: parseInt(mascotaId),
      servicio_id: parseInt(servicioId),
      sucursal_id: parseInt(sucursalId),
      fecha: fecha,
      hora: hora,
      estado: 'pendiente',
      motivo: motivo,
      observaciones: observaciones
    };

    console.log('Enviando datos de cita:', datosCita);

    const response = await fetch('/api/citas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosCita)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear la cita');
    }
    
    // Agregar la cita a los datos locales
    citasData.push(result.data || result);
    
    // Actualizar la interfaz
    actualizarEstadisticas();
    mostrarCitas();
    actualizarProximaCita();
    actualizarNotificaciones();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaCitaModal'));
    if (modal) modal.hide();
    
    // Limpiar formulario
    document.getElementById('formNuevaCita').reset();
    
    // Mostrar mensaje de éxito
    mostrarExito('¡Cita agendada exitosamente!');
    
    // Si es la primera cita, mostrar las secciones correspondientes
    if (citasData.length === 1) {
      document.getElementById('sinCitasState').style.display = 'none';
      document.getElementById('filtrosSection').style.display = 'block';
      document.getElementById('citasSection').style.display = 'block';
    }

  } catch (error) {
    console.error('Error al agendar cita:', error);
    mostrarErrorEnModal(error.message || 'Error al agendar la cita. Por favor, intenta de nuevo.');
  } finally {
    // Rehabilitar botón
    const btnAgendar = document.getElementById('btnAgendarCita');
    btnAgendar.disabled = false;
    btnAgendar.innerHTML = '<i class="bi bi-check-circle me-1"></i>Agendar Cita';
  }
}

// ========== CONTINÚA CON EL RESTO DE FUNCIONES ==========

function mostrarCitas() {
  const container = document.getElementById('citasListContainer');
  
  if (!citasData || citasData.length === 0) {
    container.innerHTML = '';
    return;
  }

  const citasOrdenadas = [...citasData].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  let html = '';
  
  citasOrdenadas.forEach(cita => {
    const mascota = mascotasData.find(m => m.id === cita.mascota_id);
    const servicio = serviciosData.find(s => s.id === cita.servicio_id);
    const fecha = new Date(cita.fecha);
    
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    
    const estadoBadge = obtenerBadgeEstado(cita.estado);
    const avatarMascota = obtenerAvatarMascota(mascota?.especie);
    
    const puedeEditar = cita.estado === 'pendiente';
    const puedeCancelar = cita.estado === 'pendiente' || cita.estado === 'confirmada';
    
    html += `
      <div class="cita-item border rounded-3 p-3 mb-3 ${cita.estado}" data-cita-id="${cita.id}">
        <div class="row align-items-center">
          <div class="col-md-2">
            <div class="fecha-cita text-center">
              <div class="dia">${dia}</div>
              <div class="mes">${obtenerMesAbrev(mes)}</div>
              <div class="hora">${cita.hora}</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="mascota-info">
              <div class="d-flex align-items-center mb-2">
                <div class="mascota-avatar me-2">${avatarMascota}</div>
                <div>
                  <h6 class="mb-0">${mascota ? mascota.nombre : 'Mascota no encontrada'}</h6>
                  <small class="text-muted">${mascota ? `${mascota.especie} - ${mascota.raza}` : 'Sin información'}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="servicio-info">
              <h6 class="mb-1">${servicio ? servicio.nombre : 'Servicio no encontrado'}</h6>
              <small class="text-muted">${cita.veterinario || 'Sin asignar'}</small>
            </div>
          </div>
          <div class="col-md-2">
            ${estadoBadge}
          </div>
          <div class="col-md-2 text-end">
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary" onclick="verDetalles(${cita.id})" title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              ${puedeEditar ? 
                `<button class="btn btn-sm btn-outline-warning" onclick="editarCita(${cita.id})" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>` : 
                ''
              }
              ${puedeCancelar ? 
                `<button class="btn btn-sm btn-outline-danger" onclick="cancelarCita(${cita.id})" title="Cancelar">
                  <i class="bi bi-x-circle"></i>
                </button>` : 
                `<button class="btn btn-sm btn-outline-secondary" disabled title="${cita.estado === 'completada' ? 'Completada' : 'Cancelada'}">
                  <i class="bi bi-${cita.estado === 'completada' ? 'check' : 'x'}-circle"></i>
                </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function obtenerBadgeEstado(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning rounded-pill">Pendiente</span>',
    'confirmada': '<span class="badge bg-success rounded-pill">Confirmada</span>',
    'completada': '<span class="badge bg-info rounded-pill">Completada</span>',
    'cancelada': '<span class="badge bg-danger rounded-pill">Cancelada</span>'
  };
  return badges[estado] || '<span class="badge bg-secondary rounded-pill">Desconocido</span>';
}

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

function obtenerMesAbrev(mes) {
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
                 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return meses[mes];
}

function actualizarProximaCita() {
  const widget = document.getElementById('proximaCitaWidget');
  if (!widget) return;
  
  const hoy = new Date();
  
  const proximasCitas = citasData
    .filter(cita => new Date(cita.fecha) >= hoy && (cita.estado === 'pendiente' || cita.estado === 'confirmada'))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  
  if (proximasCitas.length > 0) {
    const proxima = proximasCitas[0];
    const servicio = serviciosData.find(s => s.id === proxima.servicio_id);
    const fecha = new Date(proxima.fecha);
    const esManana = fecha.toDateString() === new Date(hoy.getTime() + 24*60*60*1000).toDateString();
    
    widget.innerHTML = `
      <p class="mb-1"><strong>${servicio ? servicio.nombre : 'Consulta'}</strong></p>
      <small class="text-muted">${esManana ? 'Mañana' : fecha.toLocaleDateString()} a las ${proxima.hora}</small>
    `;
  } else {
    widget.innerHTML = '<p class="text-muted">No hay citas próximas</p>';
  }
}

function actualizarNotificaciones() {
  const badge = document.getElementById('notificationCount');
  const list = document.getElementById('notificationList');
  
  if (!badge || !list) return;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy.getTime() + 24*60*60*1000);
  
  const citasHoy = citasData.filter(cita => {
    const fechaCita = new Date(cita.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    return fechaCita.getTime() === hoy.getTime() && 
           (cita.estado === 'pendiente' || cita.estado === 'confirmada');
  });
  
  const citasManana = citasData.filter(cita => {
    const fechaCita = new Date(cita.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    return fechaCita.getTime() === manana.getTime() && 
           (cita.estado === 'pendiente' || cita.estado === 'confirmada');
  });
  
  let notificaciones = [];
  
  citasHoy.forEach(cita => {
    notificaciones.push({
      tipo: 'cita-hoy',
      mensaje: `Cita hoy a las ${cita.hora}`,
      icono: 'bi-calendar-check'
    });
  });
  
  citasManana.forEach(cita => {
    notificaciones.push({
      tipo: 'cita-manana',
      mensaje: `Cita mañana a las ${cita.hora}`,
      icono: 'bi-calendar-event'
    });
  });
  
  badge.textContent = notificaciones.length;
  badge.style.display = notificaciones.length > 0 ? 'flex' : 'none';
  
  if (notificaciones.length > 0) {
    let html = '<li><h6 class="dropdown-header">Notificaciones</h6></li>';
    notificaciones.forEach(notif => {
      html += `<li><a class="dropdown-item" href="#"><i class="${notif.icono} me-2"></i>${notif.mensaje}</a></li>`;
    });
    list.innerHTML = html;
  } else {
    list.innerHTML = `
      <li><h6 class="dropdown-header">Notificaciones</h6></li>
      <li class="dropdown-item text-muted">No hay notificaciones</li>
    `;
  }
}

function configurarFechaMinima() {
  const fechaInput = document.getElementById('fechaCita');
  if (fechaInput) {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    fechaInput.min = `${year}-${month}-${day}`;
  }
}

function configurarEventListeners() {
  // Event listener para el botón de agendar cita
  const btnAgendarCita = document.getElementById('btnAgendarCita');
  if (btnAgendarCita) {
    btnAgendarCita.addEventListener('click', agendarCita);
  }
  
  // Limpiar errores al abrir el modal
  const modalNuevaCita = document.getElementById('nuevaCitaModal');
  if (modalNuevaCita) {
    modalNuevaCita.addEventListener('show.bs.modal', function() {
      ocultarErrorEnModal();
      document.getElementById('formNuevaCita').reset();
      document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      configurarFechaMinima();
    });
  }
  
  // Event listeners para vistas
  const vistaLista = document.getElementById('vista-lista');
  const vistaCalendario = document.getElementById('vista-calendario');
  
  if (vistaLista && vistaCalendario) {
    vistaLista.addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('vista-lista-content').style.display = 'block';
        document.getElementById('vista-calendario-content').style.display = 'none';
      }
    });

    vistaCalendario.addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('vista-lista-content').style.display = 'none';
        document.getElementById('vista-calendario-content').style.display = 'block';
      }
    });
  }

  // Event listeners para filtros
  let filtroTimeout;
  
  document.getElementById('buscarCitas')?.addEventListener('input', function() {
    clearTimeout(filtroTimeout);
    filtroTimeout = setTimeout(aplicarFiltros, 300);
  });
  
  document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroMascota')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filtroFecha')?.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const termino = document.getElementById('buscarCitas')?.value.toLowerCase().trim() || '';
  const estadoFiltro = document.getElementById('filtroEstado')?.value || '';
  const mascotaFiltro = document.getElementById('filtroMascota')?.value || '';
  const fechaFiltro = document.getElementById('filtroFecha')?.value || '';

  const citasFiltradas = citasData.filter(cita => {
    if (estadoFiltro && cita.estado !== estadoFiltro) {
      return false;
    }
    
    if (mascotaFiltro && cita.mascota_id != mascotaFiltro) {
      return false;
    }
    
    if (fechaFiltro) {
      const fechaCita = extraerSoloFecha(cita.fecha);
      if (fechaCita !== fechaFiltro) {
        return false;
      }
    }
    
    if (termino) {
      const mascota = mascotasData.find(m => m.id === cita.mascota_id);
      const servicio = serviciosData.find(s => s.id === cita.servicio_id);
      
      const textoCompleto = [
        mascota?.nombre || '',
        mascota?.especie || '',
        mascota?.raza || '',
        servicio?.nombre || '',
        cita.veterinario || '',
        cita.estado || '',
        cita.fecha || '',
        cita.hora || ''
      ].join(' ').toLowerCase();
      
      if (!textoCompleto.includes(termino)) {
        return false;
      }
    }
    
    return true;
  });
  
  mostrarCitasFiltradas(citasFiltradas);
}

function extraerSoloFecha(fechaStr) {
  if (!fechaStr) return null;
  
  const fecha = new Date(fechaStr);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function mostrarCitasFiltradas(citasFiltradas) {
  const container = document.getElementById('citasListContainer');
  
  if (citasFiltradas.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-search display-1 text-muted mb-3"></i>
        <h5 class="text-muted">No se encontraron citas</h5>
        <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
      </div>
    `;
    return;
  }

  const citasOrdenadas = [...citasFiltradas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  let html = '';
  
  citasOrdenadas.forEach(cita => {
    const mascota = mascotasData.find(m => m.id === cita.mascota_id);
    const servicio = serviciosData.find(s => s.id === cita.servicio_id);
    const fecha = new Date(cita.fecha);
    
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    
    const estadoBadge = obtenerBadgeEstado(cita.estado);
    const avatarMascota = obtenerAvatarMascota(mascota?.especie);
    
    const puedeEditar = cita.estado === 'pendiente';
    const puedeCancelar = cita.estado === 'pendiente' || cita.estado === 'confirmada';
    
    html += `
      <div class="cita-item border rounded-3 p-3 mb-3 ${cita.estado}" data-cita-id="${cita.id}">
        <div class="row align-items-center">
          <div class="col-md-2">
            <div class="fecha-cita text-center">
              <div class="dia">${dia}</div>
              <div class="mes">${obtenerMesAbrev(mes)}</div>
              <div class="hora">${cita.hora}</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="mascota-info">
              <div class="d-flex align-items-center mb-2">
                <div class="mascota-avatar me-2">${avatarMascota}</div>
                <div>
                  <h6 class="mb-0">${mascota ? mascota.nombre : 'Mascota no encontrada'}</h6>
                  <small class="text-muted">${mascota ? `${mascota.especie} - ${mascota.raza}` : 'Sin información'}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="servicio-info">
              <h6 class="mb-1">${servicio ? servicio.nombre : 'Servicio no encontrado'}</h6>
              <small class="text-muted">${cita.veterinario || 'Sin asignar'}</small>
            </div>
          </div>
          <div class="col-md-2">
            ${estadoBadge}
          </div>
          <div class="col-md-2 text-end">
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary" onclick="verDetalles(${cita.id})" title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              ${puedeEditar ? 
                `<button class="btn btn-sm btn-outline-warning" onclick="editarCita(${cita.id})" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>` : 
                ''
              }
              ${puedeCancelar ? 
                `<button class="btn btn-sm btn-outline-danger" onclick="cancelarCita(${cita.id})" title="Cancelar">
                  <i class="bi bi-x-circle"></i>
                </button>` : 
                `<button class="btn btn-sm btn-outline-secondary" disabled title="${cita.estado === 'completada' ? 'Completada' : 'Cancelada'}">
                  <i class="bi bi-${cita.estado === 'completada' ? 'check' : 'x'}-circle"></i>
                </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

window.limpiarFiltros = function() {
  document.getElementById('buscarCitas').value = '';
  document.getElementById('filtroEstado').value = '';
  document.getElementById('filtroMascota').value = '';
  document.getElementById('filtroFecha').value = '';
  
  mostrarCitas();
};

window.verDetalles = function(citaId) {
  const cita = citasData.find(c => c.id === citaId);
  if (!cita) {
    mostrarError('Cita no encontrada');
    return;
  }
  
  if (cita.cliente_id !== clienteId) {
    mostrarError('No tienes permisos para ver esta cita');
    return;
  }
  
  const mascota = mascotasData.find(m => m.id === cita.mascota_id);
  const servicio = serviciosData.find(s => s.id === cita.servicio_id);
  const sucursal = sucursalesData.find(suc => suc.id === cita.sucursal_id);
  const fecha = new Date(cita.fecha);
  
  const dia = fecha.getDate();
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  const nombreMes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][mes];
  const nombreDia = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][fecha.getDay()];
  
  const fechaFormateada = `${nombreDia}, ${dia} de ${nombreMes} de ${anio}`;
  
  const estadoBadge = obtenerBadgeEstado(cita.estado);
  const avatarMascota = obtenerAvatarMascota(mascota?.especie);

  document.getElementById('detallesCitaContent').innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <h6>Información de la Mascota</h6>
        <div class="d-flex align-items-center mb-3">
          <div class="me-3" style="font-size: 2rem;">${avatarMascota}</div>
          <div>
            <h5 class="mb-1">${mascota ? mascota.nombre : 'No disponible'}</h5>
            <p class="text-muted mb-0">${mascota ? `${mascota.especie} - ${mascota.raza}` : 'Información no disponible'}</p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <h6>Estado de la Cita</h6>
        <div class="mb-3">${estadoBadge}</div>
      </div>
      <div class="col-md-6">
        <h6>Fecha y Hora</h6>
        <div class="mb-3">
          <i class="bi bi-calendar-event me-2"></i>${fechaFormateada}
          <br><i class="bi bi-clock me-2"></i>${cita.hora}
        </div>
      </div>
      <div class="col-md-6">
        <h6>Servicio</h6>
        <div class="mb-3">
          <i class="bi bi-clipboard-pulse me-2"></i>${servicio ? servicio.nombre : 'No disponible'}
        </div>
      </div>
      <div class="col-md-6">
        <h6>Sucursal</h6>
        <div class="mb-3">
          <i class="bi bi-building me-2"></i>${sucursal ? sucursal.nombre : 'No especificada'}
          ${sucursal ? `<br><small class="text-muted">${sucursal.direccion}</small>` : ''}
        </div>
      </div>
      <div class="col-md-6">
        <h6>Veterinario</h6>
        <div class="mb-3">
          <i class="bi bi-person-badge me-2"></i>${cita.veterinario || 'Sin asignar'}
        </div>
      </div>
      ${cita.motivo ? `
      <div class="col-12">
        <h6>Motivo de la Consulta</h6>
        <div class="mb-3">
          <p class="text-muted">${cita.motivo}</p>
        </div>
      </div>
      ` : ''}
      ${cita.observaciones ? `
      <div class="col-12">
        <h6>Observaciones</h6>
        <div class="mb-3">
          <p class="text-muted">${cita.observaciones}</p>
        </div>
      </div>
      ` : ''}
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('detallesCitaModal'));
  modal.show();
};

// Helper robusto: intenta setear el valor, si no existe busca opción y la marca, si aún no existe la agrega.
function setSelectValueRobusto(selectId, val) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  // normalizar a string (HTML option values suelen ser strings)
  const target = val === null || val === undefined ? '' : String(val);

  // intento directo
  sel.value = target;

  // si no se aplicó (browser deja otro value), buscamos manualmente
  if (String(sel.value) !== target) {
    const opt = Array.from(sel.options).find(o => o.value === target || o.value === String(Number(target)));
    if (opt) {
      opt.selected = true;
    } else {
      // opcional: crear una option visible para el id inexistente (útil para depuración/UX)
      const placeholder = document.createElement('option');
      placeholder.value = target;
      placeholder.textContent = `ID ${target} (no disponible)`;
      placeholder.selected = true;
      sel.appendChild(placeholder);
      // aseguramos que el select muestre la nueva opción
      sel.value = target;
    }
  }
}


window.editarCita = async function(citaId) {
  try {
    const response = await fetch(`/api/citas/${citaId}`);
    if (!response.ok) throw new Error('Error al obtener la cita');
    
    const cita = await response.json();
    console.log(cita)
    
    if (!cita) {
      mostrarError('Cita no encontrada');
      return;
    }
    
    if (cita.cliente_id !== clienteId) {
      mostrarError('No tienes permisos para editar esta cita');
      return;
    }
    
    if (cita.estado !== 'pendiente') {
      mostrarError('Solo se pueden editar citas pendientes');
      return;
    }
    
    citaEditando = cita;
    
    document.querySelector('#nuevaCitaModal .modal-title').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Cita';
    
    let fechaFormateada = cita.fecha;
    if (cita.fecha && !cita.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const fechaObj = new Date(cita.fecha);
      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      fechaFormateada = `${year}-${month}-${day}`;
    }
    
    let horaFormateada = cita.hora;
    if (cita.hora && cita.hora.includes(':')) {
      const partesHora = cita.hora.split(':');
      horaFormateada = `${partesHora[0]}:${partesHora[1]}`;
    }

    // dentro de window.editarCita, después de obtener `cita` y formatear fecha/hora:

    // 1) aseguramos que los selects se actualicen (si tus funciones devuelven Promises las esperamos)
    await actualizarSelectMascotas();
    await actualizarSelectServicios();
    await actualizarSelectSucursales(); // si es sync no hace falta await

    // 2) aplicamos los valores de forma robusta — pero lo hacemos también cuando el modal esté mostrado
    const aplicarValores = () => {
      setSelectValueRobusto('mascotaSelect', cita.mascota_id);
      setSelectValueRobusto('servicioSelect', cita.servicio_id);
      setSelectValueRobusto('sucursalSelect', cita.sucursal_id || '');
      document.getElementById('fechaCita').value = fechaFormateada || '';
      document.getElementById('horaCita').value = horaFormateada || '';
      document.getElementById('motivoConsulta').value = cita.motivo || '';
      document.getElementById('observaciones').value = cita.observaciones || '';
    };

    // aplicarlo ahora (por si ya está listo)
    aplicarValores();

    // crear modal y aplicar también cuando esté completamente visible
    const modalElement = document.getElementById('nuevaCitaModal');
    //const modal = new bootstrap.Modal(modalElement);
    const modal = new bootstrap.Modal(document.getElementById('nuevaCitaModal'));

    const onShown = () => {
      aplicarValores();
      modalElement.removeEventListener('shown.bs.modal', onShown);
    };
    modalElement.addEventListener('shown.bs.modal', onShown);

    //modal.show();

    const botonSubmit = document.getElementById('btnAgendarCita');
    botonSubmit.removeEventListener('click', agendarCita);
    botonSubmit.innerHTML = '<i class="bi bi-check-circle me-1"></i>Actualizar Cita';
    botonSubmit.onclick = actualizarCitaEditada;
    
    modal.show();
    
    document.getElementById('nuevaCitaModal').addEventListener('hidden.bs.modal', function handler() {
      restaurarModalNuevaCita();
      document.getElementById('nuevaCitaModal').removeEventListener('hidden.bs.modal', handler);
    });
    /*await actualizarSelectMascotas();
    await actualizarSelectServicios(), actualizarSelectSucursales();

    console.log('mascotasData:', mascotasData);
    console.log('valor a seleccionar (mascota):', cita.mascota_id);
    console.log('options mascota:', Array.from(document.getElementById('mascotaSelect').options).map(o => o.value));

    
    document.getElementById('mascotaSelect').value = cita.mascota_id;
    document.getElementById('servicioSelect').value = cita.servicio_id;
    document.getElementById('sucursalSelect').value = cita.sucursal_id || '';
    document.getElementById('fechaCita').value = fechaFormateada;
    document.getElementById('horaCita').value = horaFormateada;
    document.getElementById('motivoConsulta').value = cita.motivo || '';
    document.getElementById('observaciones').value = cita.observaciones || '';
    
    const botonSubmit = document.getElementById('btnAgendarCita');
    botonSubmit.innerHTML = '<i class="bi bi-check-circle me-1"></i>Actualizar Cita';
    botonSubmit.onclick = actualizarCitaEditada;
    
    const modal = new bootstrap.Modal(document.getElementById('nuevaCitaModal'));
    modal.show();
    
    document.getElementById('nuevaCitaModal').addEventListener('hidden.bs.modal', function handler() {
      restaurarModalNuevaCita();
      document.getElementById('nuevaCitaModal').removeEventListener('hidden.bs.modal', handler);
    });*/
    
  } catch (error) {
    console.error('Error al cargar cita para editar:', error);
    mostrarError('Error al cargar los datos de la cita');
  }
};

async function actualizarCitaEditada() {
  try {
    if (!citaEditando) return;
    
    ocultarErrorEnModal();
    
    if (!validarFormularioCita()) {
      return;
    }
    
    const mascotaId = document.getElementById('mascotaSelect').value;
    const servicioId = document.getElementById('servicioSelect').value;
    const sucursalId = document.getElementById('sucursalSelect').value;
    const fecha = document.getElementById('fechaCita').value;
    const hora = document.getElementById('horaCita').value;
    const motivo = document.getElementById('motivoConsulta').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();
    
    const btnActualizar = document.getElementById('btnAgendarCita');
    const btnTextOriginal = btnActualizar.innerHTML;
    btnActualizar.disabled = true;
    btnActualizar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';

    const datosActualizar = {
      fecha: fecha,
      hora: hora+":00",
      estado: citaEditando.estado,
      sucursal_id: parseInt(sucursalId),
      servicio_id: parseInt(servicioId),
      motivo: motivo,
      observaciones: observaciones
    };

    console.log(datosActualizar);

    const response = await fetch(`/api/citas/${citaEditando.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosActualizar)
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Error al actualizar la cita');
    
    const citaIndex = citasData.findIndex(c => c.id === citaEditando.id);
    if (citaIndex !== -1) {
      citasData[citaIndex] = { ...citasData[citaIndex], ...datosActualizar };
    }
    
    actualizarEstadisticas();
    mostrarCitas();
    actualizarProximaCita();
    actualizarNotificaciones();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaCitaModal'));
    if (modal) modal.hide();
    
    restaurarModalNuevaCita();
    
    mostrarExito('Cita actualizada exitosamente');

  } catch (error) {
    console.error('Error al actualizar cita:', error);
    mostrarErrorEnModal(error.message || 'Error al actualizar la cita. Por favor, intenta de nuevo.');
    
    const btnActualizar = document.getElementById('btnAgendarCita');
    btnActualizar.disabled = false;
    btnActualizar.innerHTML = '<i class="bi bi-check-circle me-1"></i>Actualizar Cita';
  }
}

function restaurarModalNuevaCita() {
  citaEditando = null;
  
  document.querySelector('#nuevaCitaModal .modal-title').innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Agendar Nueva Cita';
  
  const botonSubmit = document.getElementById('btnAgendarCita');
  botonSubmit.innerHTML = '<i class="bi bi-check-circle me-1"></i>Agendar Cita';
  botonSubmit.onclick = agendarCita;
  
  document.getElementById('formNuevaCita').reset();
}

window.cancelarCita = async function(citaId) {
  const cita = citasData.find(c => c.id === citaId);
  if (!cita) {
    mostrarError('Cita no encontrada');
    return;
  }
  
  if (cita.cliente_id !== clienteId) {
    mostrarError('No tienes permisos para cancelar esta cita');
    return;
  }
  
  if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
    return;
  }

  try {
    const response = await fetch(`/api/citas/${citaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estado: 'cancelada'
      })
    });

    if (!response.ok) throw new Error('Error al cancelar la cita');

    const citaIndex = citasData.findIndex(c => c.id === citaId);
    if (citaIndex !== -1) {
      citasData[citaIndex].estado = 'cancelada';
    }

    actualizarEstadisticas();
    mostrarCitas();
    actualizarProximaCita();
    actualizarNotificaciones();
    
    mostrarExito('Cita cancelada exitosamente');

  } catch (error) {
    console.error('Error al cancelar cita:', error);
    mostrarError('Error al cancelar la cita. Por favor, intenta de nuevo.');
  }
};

window.cerrarSesion = function() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    sessionStorage.removeItem('usuario');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = '/';
  }
};

function mostrarError(mensaje) {
  console.error('Error:', mensaje);
  
  // Usar SweetAlert2 si está disponible, sino alert
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#d33'
    });
  } else {
    alert('Error: ' + mensaje);
  }
}

function mostrarExito(mensaje) {
  console.log('Éxito:', mensaje);
  
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: mensaje,
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    alert(mensaje);
  }
}

function mostrarInfo(mensaje) {
  console.log('Info:', mensaje);
  
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'info',
      title: 'Información',
      text: mensaje
    });
  } else {
    alert(mensaje);
  }
}