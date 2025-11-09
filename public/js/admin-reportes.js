// public/js/admin-reportes.js
// Lógica frontend para la página de reportes del admin
document.addEventListener('DOMContentLoaded', () => {
  cargarResumen();
  cargarTopServicios();
  cargarTopSucursales();
  cargarMensual();
  cargarCitasRecientes();
});

async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Error en API: ' + res.status);
  return res.json();
}

function crearCard(title, value, subtitle, iconClass = 'bg-primary') {
  return `
    <div class="col-6 col-md-3">
      <div class="stat-card-mini">
        <div class="stat-icon ${iconClass}"><i class="bi bi-clipboard-data"></i></div>
        <div class="stat-info">
          <h3>${value}</h3>
          <p class="mb-0 text-muted">${title}${subtitle ? ' · ' + subtitle : ''}</p>
        </div>
      </div>
    </div>
  `;
}

async function cargarResumen() {
  try {
    const r = await apiGet('/api/reportes/resumen');
    if (!r.success) throw new Error('Respuesta inválida');
    const d = r.data;
    const container = document.getElementById('resumenCards');
    container.innerHTML = '';
    container.innerHTML += crearCard('Total citas', d.totalCitas, '', 'bg-primary');
    container.innerHTML += crearCard('Pendientes', d.pendientes, '', 'bg-warning');
    container.innerHTML += crearCard('Completadas', d.completadas, '', 'bg-success');
    container.innerHTML += crearCard('Servicios', d.servicios, '', 'bg-info');
  } catch (err) {
    console.error('cargarResumen:', err);
  }
}

async function cargarTopServicios() {
  try {
    const r = await apiGet('/api/reportes/servicios-top?limit=10');
    if (!r.success) return;
    const ul = document.getElementById('topServicios');
    ul.innerHTML = '';
    r.data.forEach(s => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${s.nombre}</span><span class="badge bg-primary rounded-pill">${s.total}</span>`;
      ul.appendChild(li);
    });
  } catch (err) { console.error('cargarTopServicios:', err); }
}

async function cargarTopSucursales() {
  try {
    const r = await apiGet('/api/reportes/sucursales-top?limit=10');
    if (!r.success) return;
    const ul = document.getElementById('topSucursales');
    ul.innerHTML = '';
    r.data.forEach(s => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${s.nombre}</span><span class="badge bg-success rounded-pill">${s.total}</span>`;
      ul.appendChild(li);
    });
  } catch (err) { console.error('cargarTopSucursales:', err); }
}

let chartMensual = null;
async function cargarMensual() {
  try {
    const r = await apiGet('/api/reportes/mensual?months=6');
    if (!r.success) return;
    const labels = r.data.map(x => x.ym);
    const data = r.data.map(x => x.total);
    const ctx = document.getElementById('chartMensual');
    if (chartMensual) chartMensual.destroy();
    chartMensual = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Citas',
          data,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.1)'
        }]
      },
      options: { responsive: true }
    });
  } catch (err) { console.error('cargarMensual:', err); }
}

async function cargarCitasRecientes() {
  try {
    // Usamos endpoint de citas para obtener las últimas 15 citas
    const res = await apiGet('/api/citas');
    // algunas APIs devuelven data en .data
    const citas = res.data || res;
    const recent = Array.isArray(citas) ? citas.slice(0,15) : [];
    const container = document.getElementById('tablaCitas');
    if (!recent.length) {
      container.innerHTML = '<p class="text-muted">No hay citas para mostrar.</p>';
      return;
    }
    let html = '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>ID</th><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Sucursal</th><th>Estado</th></tr></thead><tbody>';
    recent.forEach(c => {
      html += `<tr>
        <td>${c.id || ''}</td>
        <td>${c.fecha || ''}</td>
        <td>${c.hora || ''}</td>
        <td>${(c.cliente_nombre || c.cliente || '')}</td>
        <td>${(c.servicio_nombre || c.servicio || '')}</td>
        <td>${(c.sucursal_nombre || c.sucursal || '')}</td>
        <td>${c.estado || ''}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (err) { console.error('cargarCitasRecientes:', err); }
}
