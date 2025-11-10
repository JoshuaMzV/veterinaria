// Variables globales
let usuarioActual = null;

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Inicializando página de perfil...');
  cargarPerfil();
  configurarEventos();
});

// Cargar perfil del usuario
function cargarPerfil() {
  const usuario = sessionStorage.getItem('usuario');
  if (!usuario) {
    console.warn('❌ No hay usuario en sesión');
    window.location.href = '/login.html';
    return;
  }
  
  try {
    usuarioActual = JSON.parse(usuario);
    console.log('👤 Usuario encontrado:', usuarioActual.nombre, 'Rol:', usuarioActual.rol);
    
    // Llenar formulario con datos del usuario
    document.getElementById('nombre').value = usuarioActual.nombre || '';
    document.getElementById('email').value = usuarioActual.email || '';
    document.getElementById('telefono').value = usuarioActual.telefono || '';
    document.getElementById('rol').value = usuarioActual.rol || '';
    document.getElementById('direccion').value = usuarioActual.direccion || '';
    
    console.log('✅ Perfil cargado correctamente');
  } catch (error) {
    console.error('❌ Error al cargar perfil:', error);
    window.location.href = '/login.html';
  }
}

// Configurar eventos
function configurarEventos() {
  const btnGuardar = document.getElementById('btnGuardarPerfil');
  const btnCambiar = document.getElementById('btnCambiarPassword');
  const btnVolver = document.getElementById('btnVolver');
  
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarPerfil);
  }
  
  if (btnCambiar) {
    btnCambiar.addEventListener('click', cambiarPassword);
  }
  
  if (btnVolver) {
    btnVolver.addEventListener('click', volver);
  }
  
  // Toggle contraseña
  const toggleBtns = document.querySelectorAll('.btn-toggle-password');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.previousElementSibling;
      togglePassword(input);
    });
  });
  
  console.log('✅ Eventos configurados');
}

// Toggle visibilidad de contraseña
function togglePassword(input) {
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// Guardar cambios del perfil
function guardarPerfil() {
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  
  // Validaciones
  if (!nombre || !email) {
    alert('⚠️ Nombre y email son requeridos');
    return;
  }
  
  if (!email.includes('@')) {
    alert('⚠️ Ingresa un email válido');
    return;
  }
  
  if (telefono && telefono.length !== 8) {
    alert('⚠️ El teléfono debe tener 8 dígitos');
    return;
  }
  
  const datos = {
    nombre,
    email,
    telefono: telefono || null,
    direccion: direccion || null
  };
  
  console.log('📝 Guardando perfil:', datos);
  
  // Desabilitar botón
  const btnGuardar = document.getElementById('btnGuardarPerfil');
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  
  fetch('/api/usuarios/perfil', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos)
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Respuesta:', data);
    
    if (data.success || data.message) {
      alert('✅ Perfil actualizado correctamente');
      
      // Actualizar sessionStorage
      usuarioActual.nombre = nombre;
      usuarioActual.email = email;
      usuarioActual.telefono = telefono;
      usuarioActual.direccion = direccion;
      sessionStorage.setItem('usuario', JSON.stringify(usuarioActual));
      
      console.log('✅ SessionStorage actualizado');
    } else {
      alert('❌ Error: ' + (data.error || 'Error desconocido'));
    }
  })
  .catch(err => {
    console.error('❌ Error al guardar perfil:', err);
    alert('❌ Error al guardar: ' + err.message);
  })
  .finally(() => {
    btnGuardar.disabled = false;
    btnGuardar.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Cambios';
  });
}

// Cambiar contraseña
function cambiarPassword() {
  const passwordActual = document.getElementById('passwordActual')?.value;
  const passwordNueva = document.getElementById('passwordNueva')?.value;
  const passwordConfirmar = document.getElementById('passwordConfirmar')?.value;
  
  // Validaciones
  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    alert('⚠️ Completa todos los campos de contraseña');
    return;
  }
  
  if (passwordNueva.length < 6) {
    alert('⚠️ La nueva contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  if (passwordNueva !== passwordConfirmar) {
    alert('⚠️ Las contraseñas nuevas no coinciden');
    return;
  }
  
  if (passwordActual === passwordNueva) {
    alert('⚠️ La nueva contraseña debe ser diferente a la actual');
    return;
  }
  
  const datos = {
    passwordActual,
    passwordNueva
  };
  
  console.log('🔐 Cambiando contraseña...');
  
  // Desabilitar botón
  const btnCambiar = document.getElementById('btnCambiarPassword');
  btnCambiar.disabled = true;
  btnCambiar.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
  
  fetch('/api/usuarios/cambiar-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos)
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Respuesta:', data);
    
    if (data.success || data.message || r.ok) {
      alert('✅ Contraseña cambiada correctamente');
      
      // Limpiar formulario
      document.getElementById('passwordActual').value = '';
      document.getElementById('passwordNueva').value = '';
      document.getElementById('passwordConfirmar').value = '';
      
      console.log('✅ Formulario limpiado');
    } else {
      alert('❌ Error: ' + (data.error || 'Error desconocido'));
    }
  })
  .catch(err => {
    console.error('❌ Error al cambiar contraseña:', err);
    alert('❌ Error: ' + err.message);
  })
  .finally(() => {
    btnCambiar.disabled = false;
    btnCambiar.innerHTML = '<i class="bi bi-key"></i> Cambiar Contraseña';
  });
}

// Volver al dashboard
function volver() {
  window.location.href = '/vendedor-dashboard.html';
}

console.log('✅ vendedor-perfil.js cargado');
