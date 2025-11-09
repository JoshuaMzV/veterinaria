// public/js/admin-perfil.js
document.addEventListener('DOMContentLoaded', () => {
  cargarPerfil();
  document.getElementById('formPerfil').addEventListener('submit', guardarPerfil);
  document.getElementById('formPassword').addEventListener('submit', cambiarPassword);
});

async function apiGet(path) {
  const headers = {};
  const usuario = sessionStorage.getItem('usuario');
  if (usuario) {
    try {
      const u = JSON.parse(usuario);
      if (u.id) headers['X-User-Id'] = u.id;
    } catch (e) {}
  }
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error('API Error ' + res.status);
  return res.json();
}

async function apiPut(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const usuario = sessionStorage.getItem('usuario');
  if (usuario) {
    try {
      const u = JSON.parse(usuario);
      if (u.id) headers['X-User-Id'] = u.id;
    } catch (e) {}
  }

  const res = await fetch(path, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('API Error ' + res.status + ' - ' + txt);
  }
  return res.json();
}

async function cargarPerfil() {
  try {
    const r = await apiGet('/api/usuarios/perfil');
    if (!r.success) return;
    const d = r.data;
    document.getElementById('nombre').value = d.nombre || '';
    document.getElementById('email').value = d.email || '';
    document.getElementById('telefono').value = d.telefono || '';
    document.getElementById('direccion').value = d.direccion || '';
    document.getElementById('perfilNombre').textContent = d.nombre || 'Mi Perfil';
    document.getElementById('perfilRol').textContent = d.rol ? (d.rol.charAt(0).toUpperCase()+d.rol.slice(1)) : 'Administrador';
    // Inicial avatar letra
    const avatar = document.getElementById('perfilAvatar');
    if (avatar && d.nombre) avatar.textContent = d.nombre.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  } catch (err) {
    console.error('cargarPerfil:', err);
  }
}

async function guardarPerfil(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('nombre').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    direccion: document.getElementById('direccion').value.trim()
  };
  const btn = document.getElementById('btnGuardar');
  const spin = document.getElementById('spinGuardar');
  try {
    btn.disabled = true; spin.style.display = 'inline-block';
    await apiPut('/api/usuarios/perfil', payload);
    showToast('Perfil actualizado correctamente', 'success');
  } catch (err) {
    console.error('guardarPerfil:', err);
    showToast('Error al guardar: ' + err.message, 'danger');
  } finally {
    btn.disabled = false; spin.style.display = 'none';
  }
}

async function cambiarPassword(e) {
  e.preventDefault();
  const payload = {
    passwordActual: document.getElementById('passwordActual').value,
    passwordNueva: document.getElementById('passwordNueva').value
  };
  const btn = document.getElementById('btnCambiar');
  const spin = document.getElementById('spinPwd');
  try {
    btn.disabled = true; spin.style.display = 'inline-block';
    await apiPut('/api/usuarios/perfil', payload);
    showToast('Contraseña cambiada correctamente', 'success');
    document.getElementById('passwordActual').value = '';
    document.getElementById('passwordNueva').value = '';
  } catch (err) {
    console.error('cambiarPassword:', err);
    showToast('Error al cambiar contraseña: ' + err.message, 'danger');
  } finally {
    btn.disabled = false; spin.style.display = 'none';
  }
}

// Toast helper local
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) { alert(message); return; }
  const id = 't'+Date.now();
  const html = `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-dismiss="toast" aria-label="Close" onclick="document.getElementById('${id}').remove()"></button>
      </div>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = html;
  container.appendChild(div);
  setTimeout(() => { try { const el = document.getElementById(id); if (el) el.remove(); } catch(e){} }, 4000);
}
