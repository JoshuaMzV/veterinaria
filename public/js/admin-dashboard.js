// admin-dashboard.js - VERSIÓN CON DIAGNÓSTICO

// Variables globales
let usuarioActual = null;
let citasData = [];
let updateInterval = null;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async function() {
  await verificarAutenticacion();
  await cargarDatosDashboard();
  iniciarActualizacionAutomatica();
  configurarEventListeners();
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
    usuarioActual = JSON.parse(usuario);
    
    if (usuarioActual.rol !== 'admin') {
      alert('No tiene permisos para acceder a esta sección');
      window.location.href = '/';
      return;
    }

    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = usuarioActual.nombre;
    });
    
    const adminNombre = document.getElementById('adminNombre');
    const adminNombreTitle = document.getElementById('adminNombreTitle');
    
    if (adminNombre) adminNombre.textContent = usuarioActual.nombre;
    if (adminNombreTitle) adminNombreTitle.textContent = usuarioActual.nombre;

    console.log('✅ Admin autenticado:', usuarioActual.nombre);
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
    window.location.href = '/';
  }
}

// ==================== CARGA DE DATOS ====================

async function cargarDatosDashboard() {
  try {
    console.log('🚀 Iniciando carga del dashboard...');

    // Mostrar fecha actual
    const hoy = new Date();
    const elementoFecha = document.getElementById('fechaHoy');
    if (elementoFecha) {
      elementoFecha.textContent = hoy.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Actualizar citas pasadas primero
    await actualizarCitasPasadas();

    // Cargar datos en paralelo
    await Promise.all([
      cargarKPIs(),
      cargarCitasProximas(),
      cargarEstadisticasRapidas(),
      cargarActividadReciente()
    ]);

    actualizarHoraActualizacion();
    console.log('✅ Dashboard cargado completamente');
    
  } catch (error) {
    console.error('❌ Error al cargar dashboard:', error);
    mostrarError('Error al cargar los datos del dashboard. Por favor, recargue la página.');
  }
}

// ==================== ACTUALIZACIÓN DE CITAS PASADAS ====================

async function actualizarCitasPasadas() {
  try {
    console.log('🔄 Actualizando citas pasadas...');
    
    const response = await fetch('/api/citas/actualizar-pasadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${result.citasActualizadas || 0} cita(s) actualizada(s)`);
      
      if (result.citasActualizadas > 0) {
        mostrarNotificacionBadge(result.citasActualizadas);
      }
    }
  } catch (error) {
    console.error('⚠️ Error al actualizar citas pasadas:', error);
  }
}

// ==================== KPIs ====================

async function cargarKPIs() {
  try {
    console.log('📊 Cargando KPIs...');
    
    // Intentar primero el endpoint de admin
    let response = await fetch('/api/admin/estadisticas');
    
    if (response.ok) {
      const stats = await response.json();
      console.log('📈 Estadísticas de /api/admin/estadisticas:', stats);
      
      actualizarKPI('kpiCitasHoy', stats.citas_hoy || 0);
      actualizarTendencia('kpiTrendHoy', stats.citas_hoy, 'hoy');

      actualizarKPI('kpiCompletadasMes', stats.completadas_mes_actual || 0);
      actualizarTendencia('kpiCompletadasTrend', stats.completadas_mes_actual, 'mes', stats.completadas_mes_anterior);

      const pendientes = (stats.citas_pendientes || 0) + (stats.citas_confirmadas || 0);
      actualizarKPI('kpiPendientes', pendientes);
      actualizarTendencia('kpiPendientesTrend', pendientes, 'pendientes');

      actualizarKPI('kpiUsuarios', stats.usuarios_cliente || 0);
      actualizarTendencia('kpiUsuariosTrend', stats.usuarios_cliente, 'usuarios');

      const resumenHoy = document.getElementById('resumenHoy');
      if (resumenHoy) {
        resumenHoy.textContent = `${stats.citas_hoy || 0} citas hoy • ${pendientes} pendientes`;
      }
    } else {
      // Fallback: calcular desde /api/citas y /api/usuarios
      console.log('⚠️ Usando fallback para KPIs');
      await cargarKPIsFallback();
    }

    console.log('✅ KPIs cargados correctamente');

  } catch (error) {
    console.error('❌ Error al cargar KPIs:', error);
    await cargarKPIsFallback();
  }
}

async function cargarKPIsFallback() {
  try {
    const [citasRes, usuariosRes] = await Promise.all([
      fetch('/api/citas'),
      fetch('/api/usuarios')
    ]);

    const citas = await citasRes.json();
    const usuarios = await usuariosRes.json();

    console.log('📊 Fallback - Total citas:', citas.length);
    console.log('📊 Fallback - Total usuarios:', usuarios.length);

    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const citasHoy = citas.filter(c => c.fecha === hoy).length;
    const completadasMes = citas.filter(c => c.estado === 'completada' && c.fecha >= inicioMes).length;
    const pendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
    const clientesCount = usuarios.filter(u => u.rol === 'cliente').length;

    actualizarKPI('kpiCitasHoy', citasHoy);
    actualizarKPI('kpiCompletadasMes', completadasMes);
    actualizarKPI('kpiPendientes', pendientes);
    actualizarKPI('kpiUsuarios', clientesCount);

    const resumenHoy = document.getElementById('resumenHoy');
    if (resumenHoy) {
      resumenHoy.textContent = `${citasHoy} citas hoy • ${pendientes} pendientes`;
    }
  } catch (error) {
    console.error('❌ Error en fallback de KPIs:', error);
  }
}

function actualizarKPI(elementId, valor) {
  const elemento = document.getElementById(elementId);
  if (elemento) {
    elemento.textContent = valor;
    elemento.style.transform = 'scale(1.1)';
    setTimeout(() => elemento.style.transform = 'scale(1)', 200);
  }
}

function actualizarTendencia(elementId, valorActual, tipo, valorAnterior = null) {
  const elemento = document.getElementById(elementId);
  if (!elemento) return;

  let texto = '';
  let clase = 'stat-change neutral';

  switch(tipo) {
    case 'hoy':
      texto = valorActual > 0 ? 'Activas hoy' : 'Sin citas hoy';
      clase = valorActual > 0 ? 'stat-change positive' : 'stat-change neutral';
      break;
    case 'mes':
      if (valorAnterior !== null && valorAnterior !== undefined) {
        if (valorAnterior === 0) {
          texto = valorActual > 0 ? '+100% vs mes anterior' : 'Sin datos anteriores';
          clase = valorActual > 0 ? 'stat-change positive' : 'stat-change neutral';
        } else {
          const porcentaje = ((valorActual - valorAnterior) / valorAnterior * 100).toFixed(0);
          texto = `${porcentaje > 0 ? '+' : ''}${porcentaje}% vs mes anterior`;
          clase = porcentaje >= 0 ? 'stat-change positive' : 'stat-change negative';
        }
      } else {
        texto = `${valorActual} este mes`;
      }
      break;
    case 'pendientes':
      texto = valorActual > 0 ? 'Requiere atención' : 'Todo al día';
      clase = valorActual > 0 ? 'stat-change warning' : 'stat-change positive';
      break;
    case 'usuarios':
      texto = 'Total activos';
      break;
  }

  elemento.textContent = texto;
  elemento.className = clase;
}

// ==================== CITAS PRÓXIMAS ====================

async function cargarCitasProximas() {
  try {
    console.log('📅 Cargando citas próximas...');
    const response = await fetch('/api/citas');
    
    if (!response.ok) throw new Error('Error al obtener citas');
    
    const citas = await response.json();
    console.log('📅 Total de citas recibidas:', citas.length);

    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    citasData = citas
      .filter(c => {
        const fechaCita = new Date(c.fecha);
        fechaCita.setHours(0, 0, 0, 0);
        return fechaCita >= ahora && (c.estado === 'pendiente' || c.estado === 'confirmada');
      })
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fechaB = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fechaA - fechaB;
      })
      .slice(0, 10);

    mostrarCitasProximas(citasData);
    console.log(`✅ ${citasData.length} citas próximas cargadas`);
    
  } catch (error) {
    console.error('❌ Error al cargar citas próximas:', error);
    document.getElementById('citasProximasContainer').innerHTML = 
      '<div class="alert alert-danger m-3">Error al cargar las citas próximas</div>';
  }
}

function mostrarCitasProximas(citas) {
  const container = document.getElementById('citasProximasContainer');

  if (citas.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
        <p class="mt-3 mb-0">No hay citas próximas programadas</p>
      </div>
    `;
    return;
  }

  let html = '<div class="table-responsive"><table class="table table-hover align-middle">';
  html += `
    <thead class="table-light">
      <tr>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Cliente</th>
        <th>Mascota</th>
        <th>Servicio</th>
        <th>Estado</th>
        <th class="text-center">Acción</th>
      </tr>
    </thead>
    <tbody>
  `;

  citas.forEach(cita => {
    const fecha = new Date(cita.fecha);
    const esHoy = fecha.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    const estadoBadge = obtenerBadgeEstado(cita.estado);
    
    html += `
      <tr ${esHoy ? 'class="table-warning"' : ''}>
        <td>
          ${esHoy ? '<span class="badge bg-warning text-dark me-2">HOY</span>' : ''}
          <strong>${fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</strong>
        </td>
        <td><span class="badge bg-primary">${cita.hora}</span></td>
        <td><i class="bi bi-person-circle me-1"></i>${cita.cliente_nombre || 'N/A'}</td>
        <td><i class="bi bi-heart-fill text-danger me-1"></i>${cita.mascota_nombre || 'N/A'}</td>
        <td><small>${cita.servicio_nombre || 'N/A'}</small></td>
        <td>${estadoBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary" onclick="verDetalleCita(${cita.id})" title="Ver detalles">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function obtenerBadgeEstado(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
    'confirmada': '<span class="badge bg-success">Confirmada</span>',
    'completada': '<span class="badge bg-secondary">Completada</span>',
    'cancelada': '<span class="badge bg-danger">Cancelada</span>'
  };
  return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

window.verDetalleCita = function(id) {
  window.location.href = `admin-citas.html?id=${id}`;
};

// ==================== ESTADÍSTICAS RÁPIDAS ====================

async function cargarEstadisticasRapidas() {
  try {
    console.log('📊 Cargando estadísticas rápidas...');
    
    const endpoints = [
      '/api/citas',
      '/api/mascotas',
      '/api/clientes',
      '/api/servicios'
    ];

    console.log('📡 Consultando endpoints:', endpoints);

    const [citasRes, mascotasRes, clientesRes, serviciosRes] = await Promise.all([
      fetch('/api/citas'),
      fetch('/api/mascotas'),
      fetch('/api/clientes'),
      fetch('/api/servicios')
    ]);

    console.log('📡 Respuestas:', {
      citas: citasRes.status,
      mascotas: mascotasRes.status,
      clientes: clientesRes.status,
      servicios: serviciosRes.status
    });

    if (!citasRes.ok) {
      console.error('❌ Error en /api/citas:', citasRes.status, citasRes.statusText);
    }
    if (!mascotasRes.ok) {
      console.error('❌ Error en /api/mascotas:', mascotasRes.status, mascotasRes.statusText);
    }
    if (!clientesRes.ok) {
      console.error('❌ Error en /api/clientes:', clientesRes.status, clientesRes.statusText);
    }
    if (!serviciosRes.ok) {
      console.error('❌ Error en /api/servicios:', serviciosRes.status, serviciosRes.statusText);
    }

    const citas = citasRes.ok ? await citasRes.json() : [];
    const mascotas = mascotasRes.ok ? await mascotasRes.json() : [];
    const clientes = clientesRes.ok ? await clientesRes.json() : [];
    const servicios = serviciosRes.ok ? await serviciosRes.json() : [];

    console.log('📊 Datos recibidos:', {
      citas: citas.length,
      mascotas: mascotas.length,
      clientes: clientes.length,
      servicios: servicios.length
    });

    // Citas confirmadas
    const confirmadas = citas.filter(c => c.estado === 'confirmada').length;
    actualizarEstadisticaRapida('statConfirmadas', confirmadas, 'progressConfirmadas', citas.length);

    // Mascotas
    actualizarEstadisticaRapida('statMascotas', mascotas.length, 'progressMascotas', 85);

    // Clientes
    actualizarEstadisticaRapida('statClientesActivos', clientes.length, 'progressClientes', 70);

    // Servicios
    actualizarEstadisticaRapida('statServicios', servicios.length, 'progressServicios', 90);

    console.log('✅ Estadísticas rápidas cargadas');

  } catch (error) {
    console.error('❌ Error al cargar estadísticas rápidas:', error);
    console.error('Stack:', error.stack);
  }
}

function actualizarEstadisticaRapida(statId, valor, progressId, porcentaje) {
  const statElement = document.getElementById(statId);
  const progressElement = document.getElementById(progressId);
  
  if (statElement) {
    statElement.textContent = valor;
    console.log(`✅ Actualizado ${statId}: ${valor}`);
  } else {
    console.warn(`⚠️ No se encontró elemento: ${statId}`);
  }
  
  if (progressElement) {
    const porcentajeCalculado = typeof porcentaje === 'number' && porcentaje <= 100 
      ? porcentaje 
      : Math.min((valor / 100) * 100, 100);
    
    progressElement.style.width = `${porcentajeCalculado}%`;
  } else {
    console.warn(`⚠️ No se encontró elemento: ${progressId}`);
  }
}

// ==================== ACTIVIDAD RECIENTE ====================

async function cargarActividadReciente() {
  try {
    console.log('🕐 Cargando actividad reciente...');
    
    // Intentar endpoint de admin primero
    let response = await fetch('/api/admin/actividad-reciente?limite=8');
    
    if (!response.ok) {
      console.log('⚠️ Endpoint admin no disponible, usando fallback');
      // Fallback: obtener citas directamente
      response = await fetch('/api/citas');
    }
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    let actividades = await response.json();
    console.log('📊 Actividades recibidas:', actividades.length);

    // Si vienen de /api/citas, ordenar y limitar
    if (Array.isArray(actividades) && actividades.length > 0 && !actividades[0].fecha_legible) {
      actividades = actividades
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora || '00:00'}`);
          const fechaB = new Date(`${b.fecha}T${b.hora || '00:00'}`);
          return fechaB - fechaA;
        })
        .slice(0, 8);
    }

    if (actividades.length === 0) {
      document.getElementById('actividadRecienteContainer').innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-clock-history" style="font-size: 3rem;"></i>
          <p class="mt-3">No hay actividad reciente</p>
        </div>
      `;
      return;
    }

    let html = '<div class="activity-list">';

    actividades.forEach(act => {
      const icono = obtenerIconoActividad(act.estado);
      const color = obtenerColorActividad(act.estado);
      const fechaLegible = act.fecha_legible || new Date(act.fecha).toLocaleDateString('es-ES');
      
      html += `
        <div class="activity-item">
          <div class="activity-icon ${color}">
            ${icono}
          </div>
          <div class="activity-content flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <p class="mb-1">
                  <strong>${act.cliente_nombre || 'Cliente'}</strong> - ${act.servicio_nombre || 'Servicio'}
                </p>
                <small class="text-muted">
                  ${fechaLegible} a las ${act.hora || '--:--'}
                  • Mascota: ${act.mascota_nombre || 'N/A'}
                </small>
              </div>
              <span class="badge ${obtenerClassBadge(act.estado)}">${act.estado}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    document.getElementById('actividadRecienteContainer').innerHTML = html;
    
    console.log(`✅ ${actividades.length} actividades cargadas`);

  } catch (error) {
    console.error('❌ Error al cargar actividad reciente:', error);
    console.error('Stack:', error.stack);
    document.getElementById('actividadRecienteContainer').innerHTML = 
      '<div class="alert alert-danger m-3">Error al cargar la actividad reciente</div>';
  }
}

function obtenerIconoActividad(estado) {
  const iconos = {
    'pendiente': '<i class="bi bi-clock"></i>',
    'confirmada': '<i class="bi bi-check-circle"></i>',
    'completada': '<i class="bi bi-check-all"></i>',
    'cancelada': '<i class="bi bi-x-circle"></i>'
  };
  return iconos[estado] || '<i class="bi bi-circle"></i>';
}

function obtenerColorActividad(estado) {
  const colores = {
    'pendiente': 'warning',
    'confirmada': 'success',
    'completada': 'secondary',
    'cancelada': 'danger'
  };
  return colores[estado] || 'secondary';
}

function obtenerClassBadge(estado) {
  const classes = {
    'pendiente': 'bg-warning text-dark',
    'confirmada': 'bg-success',
    'completada': 'bg-secondary',
    'cancelada': 'bg-danger'
  };
  return classes[estado] || 'bg-secondary';
}

// ==================== ACTUALIZACIÓN AUTOMÁTICA ====================

function iniciarActualizacionAutomatica() {
  updateInterval = setInterval(async () => {
    console.log('🔄 Actualización automática...');
    
    try {
      await actualizarCitasPasadas();
      await cargarKPIs();
      await cargarCitasProximas();
      await cargarEstadisticasRapidas();
      
      actualizarHoraActualizacion();
      console.log('✅ Actualización completada');
    } catch (error) {
      console.error('⚠️ Error en actualización automática:', error);
    }
    
  }, 120000);

  console.log('✅ Actualización automática iniciada (cada 2 minutos)');
}

function actualizarHoraActualizacion() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  const elemento = document.getElementById('ultimaActualizacion');
  if (elemento) {
    elemento.textContent = hora;
  }
}

// ==================== EVENT LISTENERS ====================

function configurarEventListeners() {
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', cerrarSesion);
  }

  const btnMiPerfil = document.getElementById('btnMiPerfil');
  if (btnMiPerfil) {
    btnMiPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      irAlPerfil();
    });
  }

  const btnActualizar = document.getElementById('btnActualizarCitas');
  if (btnActualizar) {
    btnActualizar.addEventListener('click', async (e) => {
      e.preventDefault();
      btnActualizar.disabled = true;
      btnActualizar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Actualizando...';
      
      try {
        await actualizarCitasPasadas();
        await cargarCitasProximas();
        await cargarKPIs();
        
        mostrarMensajeExito('Citas actualizadas correctamente');
      } catch (error) {
        console.error('Error al actualizar:', error);
        mostrarError('Error al actualizar las citas');
      } finally {
        btnActualizar.disabled = false;
        btnActualizar.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Actualizar';
      }
    });
  }

  const btnReporte = document.getElementById('btnGenerarReporteRapido');
  if (btnReporte) {
    btnReporte.addEventListener('click', generarReporteRapido);
  }

  console.log('✅ Event listeners configurados');
}

function cerrarSesion(e) {
  e.preventDefault();
  
  if (confirm('¿Está seguro de cerrar sesión?')) {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    sessionStorage.clear();
    window.location.href = '/';
  }
}


// ==================== GENERAR REPORTE VISUAL DEL DÍA ====================

async function generarReporteRapido() {
  try {
    const btn = document.getElementById('btnGenerarReporteRapido');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generando...';

    // Obtener datos del día
    const response = await fetch('/api/citas');
    if (!response.ok) throw new Error('Error al obtener citas');
    
    const todasCitas = await response.json();
    
    // CORREGIDO: Obtener fecha de hoy en formato local (no UTC)
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${anio}-${mes}-${dia}`;
    
    console.log('═══════════════════════════════════');
    console.log('📅 DIAGNÓSTICO DE FECHAS');
    console.log('═══════════════════════════════════');
    console.log('Fecha de hoy calculada:', fechaHoy);
    console.log('Total de citas en sistema:', todasCitas.length);
    console.log('───────────────────────────────────');
    
    // Mostrar todas las fechas únicas en el sistema
    const fechasUnicas = [...new Set(todasCitas.map(c => c.fecha))].sort();
    console.log('Fechas únicas en el sistema:', fechasUnicas);
    console.log('───────────────────────────────────');
    
    // Filtrar citas de hoy con diagnóstico detallado
    const citasHoy = todasCitas.filter(c => {
      const match = c.fecha === fechaHoy;
      if (match) {
        console.log(`✅ MATCH: ${c.fecha} === ${fechaHoy} | Cliente: ${c.cliente_nombre} | Hora: ${c.hora}`);
      }
      return match;
    });
    
    console.log('───────────────────────────────────');
    console.log('📊 Citas encontradas para hoy:', citasHoy.length);
    console.log('═══════════════════════════════════');

    if (citasHoy.length === 0) {
      // Buscar citas cercanas para ayudar al usuario
      const citasCercanas = todasCitas
        .filter(c => {
          const fechaCita = new Date(c.fecha + 'T00:00:00');
          const diff = Math.abs(fechaCita - hoy) / (1000 * 60 * 60 * 24);
          return diff <= 2; // Mostrar citas de +/- 2 días
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      
      let mensaje = `No hay citas programadas para HOY (${fechaHoy}).\n\n`;
      mensaje += `Total de citas en sistema: ${todasCitas.length}\n`;
      
      if (citasCercanas.length > 0) {
        mensaje += `\nCitas cercanas a hoy:\n`;
        citasCercanas.forEach(c => {
          mensaje += `• ${c.fecha} a las ${c.hora} - ${c.cliente_nombre}\n`;
        });
      }
      
      if (fechasUnicas.length > 0) {
        mensaje += `\nFechas con citas: ${fechasUnicas.join(', ')}`;
      }
      
      alert(mensaje);
      return;
    }

    // Calcular estadísticas
    const stats = {
      total: citasHoy.length,
      pendientes: citasHoy.filter(c => c.estado === 'pendiente').length,
      confirmadas: citasHoy.filter(c => c.estado === 'confirmada').length,
      completadas: citasHoy.filter(c => c.estado === 'completada').length,
      canceladas: citasHoy.filter(c => c.estado === 'cancelada').length
    };

    // Agrupar por servicio
    const porServicio = {};
    citasHoy.forEach(cita => {
      const servicio = cita.servicio_nombre || 'Sin especificar';
      if (!porServicio[servicio]) {
        porServicio[servicio] = { total: 0, completadas: 0 };
      }
      porServicio[servicio].total++;
      if (cita.estado === 'completada') {
        porServicio[servicio].completadas++;
      }
    });

    // Agrupar por hora (franjas horarias)
    const porHora = {};
    citasHoy.forEach(cita => {
      if (cita.hora) {
        const hora = cita.hora.split(':')[0] + ':00';
        porHora[hora] = (porHora[hora] || 0) + 1;
      }
    });

    // Mostrar reporte visual
    mostrarModalReporte({
      fecha: new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      fechaISO: fechaHoy,
      stats,
      porServicio,
      porHora,
      citas: citasHoy
    });

  } catch (error) {
    console.error('❌ Error al generar reporte:', error);
    mostrarError('Error al generar el reporte');
  } finally {
    const btn = document.getElementById('btnGenerarReporteRapido');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-file-earmark-bar-graph me-1"></i>Generar Reporte del Día';
  }
}

function mostrarModalReporte(data, mensajeVacio = null) {
  // Eliminar modal previo si existe
  const modalPrevio = document.getElementById('modalReporte');
  if (modalPrevio) {
    modalPrevio.remove();
  }

  if (mensajeVacio) {
    alert(mensajeVacio);
    return;
  }

  const modalHTML = `
    <div class="modal fade" id="modalReporte" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-file-earmark-bar-graph me-2"></i>
              Reporte del Día - ${data.fecha}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="reporteContent">
            
            <!-- Resumen General -->
            <div class="row mb-4">
              <div class="col-12">
                <h4 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-bar-chart-fill text-primary me-2"></i>
                  Resumen General
                </h4>
              </div>
              <div class="col-md-3 col-6 mb-3">
                <div class="card text-center border-primary">
                  <div class="card-body">
                    <i class="bi bi-calendar-check text-primary" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">${data.stats.total}</h3>
                    <small class="text-muted">Total de Citas</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6 mb-3">
                <div class="card text-center border-warning">
                  <div class="card-body">
                    <i class="bi bi-clock-history text-warning" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">${data.stats.pendientes}</h3>
                    <small class="text-muted">Pendientes</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6 mb-3">
                <div class="card text-center border-success">
                  <div class="card-body">
                    <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">${data.stats.confirmadas}</h3>
                    <small class="text-muted">Confirmadas</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3 col-6 mb-3">
                <div class="card text-center border-secondary">
                  <div class="card-body">
                    <i class="bi bi-check-all text-secondary" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">${data.stats.completadas}</h3>
                    <small class="text-muted">Completadas</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Gráfico de Estado -->
            <div class="row mb-4">
              <div class="col-12">
                <h5 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-pie-chart-fill text-info me-2"></i>
                  Distribución por Estado
                </h5>
              </div>
              <div class="col-md-6">
                <div class="progress" style="height: 30px;">
                  <div class="progress-bar bg-warning" style="width: ${(data.stats.pendientes/data.stats.total*100).toFixed(1)}%" title="Pendientes: ${data.stats.pendientes}">
                    ${data.stats.pendientes > 0 ? data.stats.pendientes : ''}
                  </div>
                  <div class="progress-bar bg-success" style="width: ${(data.stats.confirmadas/data.stats.total*100).toFixed(1)}%" title="Confirmadas: ${data.stats.confirmadas}">
                    ${data.stats.confirmadas > 0 ? data.stats.confirmadas : ''}
                  </div>
                  <div class="progress-bar bg-secondary" style="width: ${(data.stats.completadas/data.stats.total*100).toFixed(1)}%" title="Completadas: ${data.stats.completadas}">
                    ${data.stats.completadas > 0 ? data.stats.completadas : ''}
                  </div>
                  <div class="progress-bar bg-danger" style="width: ${(data.stats.canceladas/data.stats.total*100).toFixed(1)}%" title="Canceladas: ${data.stats.canceladas}">
                    ${data.stats.canceladas > 0 ? data.stats.canceladas : ''}
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="d-flex justify-content-around">
                  <div><span class="badge bg-warning">Pendientes: ${((data.stats.pendientes/data.stats.total)*100).toFixed(1)}%</span></div>
                  <div><span class="badge bg-success">Confirmadas: ${((data.stats.confirmadas/data.stats.total)*100).toFixed(1)}%</span></div>
                  <div><span class="badge bg-secondary">Completadas: ${((data.stats.completadas/data.stats.total)*100).toFixed(1)}%</span></div>
                </div>
              </div>
            </div>

            <!-- Por Servicio -->
            <div class="row mb-4">
              <div class="col-12">
                <h5 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-clipboard-pulse text-success me-2"></i>
                  Citas por Servicio
                </h5>
              </div>
              <div class="col-12">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>Servicio</th>
                        <th class="text-center">Total</th>
                        <th class="text-center">Completadas</th>
                        <th class="text-center">Tasa</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.entries(data.porServicio).map(([servicio, datos]) => `
                        <tr>
                          <td><i class="bi bi-check-square me-2 text-primary"></i>${servicio}</td>
                          <td class="text-center"><span class="badge bg-primary">${datos.total}</span></td>
                          <td class="text-center"><span class="badge bg-success">${datos.completadas}</span></td>
                          <td class="text-center">
                            <div class="progress" style="height: 20px; width: 100px; margin: 0 auto;">
                              <div class="progress-bar bg-success" style="width: ${(datos.completadas/datos.total*100).toFixed(0)}%">
                                ${(datos.completadas/datos.total*100).toFixed(0)}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Distribución por Hora -->
            <div class="row mb-4">
              <div class="col-12">
                <h5 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-clock text-warning me-2"></i>
                  Distribución Horaria
                </h5>
              </div>
              <div class="col-12">
                <div class="row g-2">
                  ${Object.entries(data.porHora).sort().map(([hora, cantidad]) => `
                    <div class="col-md-2 col-4">
                      <div class="card text-center">
                        <div class="card-body p-2">
                          <small class="text-muted">${hora}</small>
                          <h5 class="mb-0">${cantidad}</h5>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Lista Detallada -->
            <div class="row">
              <div class="col-12">
                <h5 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-list-ul text-info me-2"></i>
                  Detalle de Citas (${data.citas.length})
                </h5>
              </div>
              <div class="col-12">
                <div class="table-responsive">
                  <table class="table table-sm table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>Hora</th>
                        <th>Cliente</th>
                        <th>Mascota</th>
                        <th>Servicio</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${data.citas.sort((a, b) => (a.hora || '').localeCompare(b.hora || '')).map(cita => `
                        <tr>
                          <td><span class="badge bg-primary">${cita.hora || '--:--'}</span></td>
                          <td><i class="bi bi-person-circle me-1"></i>${cita.cliente_nombre || 'N/A'}</td>
                          <td><i class="bi bi-heart-fill text-danger me-1"></i>${cita.mascota_nombre || 'N/A'}</td>
                          <td><small>${cita.servicio_nombre || 'N/A'}</small></td>
                          <td>${obtenerBadgeEstadoReporte(cita.estado)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="bi bi-x-circle me-1"></i>Cerrar
            </button>
            <button type="button" class="btn btn-success" onclick="imprimirReporte()">
              <i class="bi bi-printer me-1"></i>Imprimir
            </button>
            <button type="button" class="btn btn-primary" onclick="descargarReportePDF()">
              <i class="bi bi-download me-1"></i>Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insertar modal en el DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Mostrar modal usando Bootstrap
  const modal = new bootstrap.Modal(document.getElementById('modalReporte'));
  modal.show();

  // Limpiar al cerrar
  document.getElementById('modalReporte').addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

function obtenerBadgeEstadoReporte(estado) {
  const badges = {
    'pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
    'confirmada': '<span class="badge bg-success">Confirmada</span>',
    'completada': '<span class="badge bg-secondary">Completada</span>',
    'cancelada': '<span class="badge bg-danger">Cancelada</span>'
  };
  return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

// ==================== IMPRIMIR REPORTE ====================

window.imprimirReporte = function() {
  const contenido = document.getElementById('reporteContent').innerHTML;
  const ventana = window.open('', '_blank');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte del Día - Veterinaria</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
      <style>
        body { padding: 20px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="text-center mb-4">
          <h2>🐾 Reporte del Día - Veterinaria</h2>
          <p class="text-muted">Generado: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        ${contenido}
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 100);
        }
      </script>
    </body>
    </html>
  `);
  ventana.document.close();
};

// ==================== DESCARGAR PDF (usando jsPDF) ====================

window.descargarReportePDF = async function() {
  try {
    // Verificar si jsPDF está disponible
    if (typeof window.jspdf === 'undefined') {
      alert('Para descargar PDF, necesitas incluir la librería jsPDF.\n\nPor ahora, usa la opción "Imprimir" y selecciona "Guardar como PDF".');
      imprimirReporte();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte del Día - Veterinaria', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 105, 30, { align: 'center' });

    // Aquí puedes agregar más contenido al PDF
    // Por ahora, esto es un placeholder básico

    doc.save(`reporte-${new Date().toISOString().split('T')[0]}.pdf`);
    
    mostrarMensajeExito('Reporte descargado correctamente');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar PDF. Usa la opción "Imprimir" y selecciona "Guardar como PDF".');
    imprimirReporte();
  }
};
// ==================== UTILIDADES ====================

function mostrarError(mensaje) {
  console.error('❌', mensaje);
  
  const toastHtml = `
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div class="toast show bg-danger text-white" role="alert">
        <div class="toast-header bg-danger text-white">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong class="me-auto">Error</strong>
          <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast').remove()"></button>
        </div>
        <div class="toast-body">
          ${mensaje}
        </div>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = toastHtml;
  document.body.appendChild(div);
  
  setTimeout(() => div.remove(), 5000);
}

function mostrarMensajeExito(mensaje) {
  console.log('✅', mensaje);
  
  const toastHtml = `
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div class="toast show bg-success text-white" role="alert">
        <div class="toast-header bg-success text-white">
          <i class="bi bi-check-circle me-2"></i>
          <strong class="me-auto">Éxito</strong>
          <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast').remove()"></button>
        </div>
        <div class="toast-body">
          ${mensaje}
        </div>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = toastHtml;
  document.body.appendChild(div);
  
  setTimeout(() => div.remove(), 3000);
}

function mostrarNotificacionBadge(cantidad) {
  const badge = document.getElementById('adminNotifBadge');
  if (badge && cantidad > 0) {
    badge.textContent = cantidad;
    badge.style.display = 'block';
    
    setTimeout(() => {
      badge.style.display = 'none';
    }, 5000);
  }
}

// ==================== LIMPIEZA ====================

window.addEventListener('beforeunload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    console.log('🧹 Limpieza: interval detenido');
  }
});

// ==================== NAVEGACIÓN ====================

function irAlPerfil() {
  window.location.href = '/admin-perfil.html';
}