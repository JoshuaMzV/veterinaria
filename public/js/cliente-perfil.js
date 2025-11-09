// cliente-perfil.js

let usuarioActual = null;
let clienteId = null;
let datosOriginales = {};

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    inicializarPerfil();
    configurarEventListeners();
});

// Inicializar perfil
async function inicializarPerfil() {
    try {
        // Verificar autenticación
        usuarioActual = obtenerUsuarioActual();
        if (!usuarioActual) {
            window.location.href = '/';
            return;
        }

        console.log('Usuario autenticado:', usuarioActual);

        // Actualizar nombre en navbar
        actualizarNombreUsuario();

        // Cargar datos del perfil
        await cargarDatosPerfil();
        await cargarEstadisticas();

    } catch (error) {
        console.error('Error al inicializar perfil:', error);
        mostrarAlerta('Error al cargar los datos del perfil', 'danger');
    }
}

// Obtener usuario actual
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

// Actualizar nombre en navbar
function actualizarNombreUsuario() {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = usuarioActual.nombre;
    });
}

// Cargar datos del perfil
async function cargarDatosPerfil() {
    try {
        // Mostrar datos básicos del usuario
        document.getElementById('profileName').textContent = usuarioActual.nombre;
        document.getElementById('profileEmail').textContent = usuarioActual.email;
        document.getElementById('profileTelefono').textContent = usuarioActual.telefono || 'No disponible';
        document.getElementById('profileDireccion').textContent = usuarioActual.direccion || 'No disponible';

        // Cargar cliente para obtener fecha de registro
        await cargarClienteInfo();

        // Llenar formulario de edición
        document.getElementById('editNombre').value = usuarioActual.nombre;
        document.getElementById('editEmail').value = usuarioActual.email;
        document.getElementById('editTelefono').value = usuarioActual.telefono || '';
        document.getElementById('editDireccion').value = usuarioActual.direccion || '';

        // Guardar datos originales
        datosOriginales = {
            nombre: usuarioActual.nombre,
            telefono: usuarioActual.telefono,
            direccion: usuarioActual.direccion
        };

    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
    }
}

// Cargar información del cliente
async function cargarClienteInfo() {
    try {
        const response = await fetch('/api/clientes');
        if (!response.ok) throw new Error('Error al obtener clientes');
        
        const clientes = await response.json();
        const cliente = clientes.find(c => c.usuario_id === usuarioActual.id);
        
        if (cliente) {
            clienteId = cliente.id;
            
            // Formatear fecha de registro
            if (cliente.fecha_registro) {
                const fecha = new Date(cliente.fecha_registro);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                document.getElementById('profileFechaRegistro').textContent = `Miembro desde ${fechaFormateada}`;
            }
        }
    } catch (error) {
        console.error('Error al cargar info del cliente:', error);
    }
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        if (!clienteId) {
            await cargarClienteInfo();
        }

        // Cargar citas
        let citasResponse = await fetch(`/api/citas/cliente/${clienteId}`);
        if (!citasResponse.ok) {
            citasResponse = await fetch('/api/citas');
        }
        
        const citas = citasResponse.ok ? await citasResponse.json() : [];
        const citasCliente = citas.filter ? citas.filter(c => c.cliente_id === clienteId) : citas;
        const citasConfirmadas = citasCliente.filter(c => c.estado === 'confirmada');
        
        document.getElementById('statCitas').textContent = citasConfirmadas.length;

        // Cargar mascotas
        let mascotasResponse = await fetch(`/api/mascotas/cliente/${clienteId}`);
        if (!mascotasResponse.ok) {
            mascotasResponse = await fetch('/api/mascotas');
        }
        
        const mascotas = mascotasResponse.ok ? await mascotasResponse.json() : [];
        const mascotasCliente = mascotas.filter ? mascotas.filter(m => m.cliente_id === clienteId) : mascotas;
        
        document.getElementById('statMascotas').textContent = mascotasCliente.length;

        // Cargar días activos
        const actividadResponse = await fetch(`/api/cliente-actividad/${clienteId}`);
        if (actividadResponse.ok) {
            const actividad = await actividadResponse.json();
            document.getElementById('statDias').textContent = actividad.dias_activos || 1;
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Formulario de editar perfil
    document.getElementById('editarPerfilForm').addEventListener('submit', handleEditarPerfil);

    // Botón cancelar edición
    document.getElementById('cancelarEdicionBtn').addEventListener('click', cancelarEdicion);

    // Formulario cambiar contraseña
    document.getElementById('cambiarPasswordForm').addEventListener('submit', handleCambiarPassword);

    // Botón eliminar cuenta
    document.getElementById('eliminarCuentaBtn').addEventListener('click', handleEliminarCuenta);

    // Botón cerrar sesión
    document.getElementById('cerrarSesionBtn').addEventListener('click', handleCerrarSesion);
}

// Manejar edición de perfil
async function handleEditarPerfil(e) {
    e.preventDefault();

    const nombre = document.getElementById('editNombre').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const direccion = document.getElementById('editDireccion').value.trim();

    // Validar teléfono
    if (!/^[0-9]{8}$/.test(telefono)) {
        mostrarAlerta('El teléfono debe tener exactamente 8 dígitos', 'danger');
        return;
    }

    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                telefono,
                direccion
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar perfil');
        }

        // Actualizar datos en sessionStorage
        usuarioActual.nombre = nombre;
        usuarioActual.telefono = telefono;
        usuarioActual.direccion = direccion;
        sessionStorage.setItem('usuario', JSON.stringify(usuarioActual));

        // Recargar datos del perfil
        await cargarDatosPerfil();
        actualizarNombreUsuario();

        mostrarAlerta('Perfil actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarAlerta(error.message, 'danger');
    }
}

// Cancelar edición
function cancelarEdicion() {
    document.getElementById('editNombre').value = datosOriginales.nombre;
    document.getElementById('editTelefono').value = datosOriginales.telefono;
    document.getElementById('editDireccion').value = datosOriginales.direccion;
    
    mostrarAlerta('Cambios cancelados', 'info');
}

// Manejar cambio de contraseña
async function handleCambiarPassword(e) {
    e.preventDefault();

    const passwordActual = document.getElementById('passwordActual').value;
    const passwordNueva = document.getElementById('passwordNueva').value;
    const passwordConfirmar = document.getElementById('passwordConfirmar').value;

    // Validar que las contraseñas coincidan
    if (passwordNueva !== passwordConfirmar) {
        mostrarAlerta('Las contraseñas nuevas no coinciden', 'danger');
        return;
    }

    // Validar formato de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(passwordNueva)) {
        mostrarAlerta('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial', 'danger');
        return;
    }

    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                passwordActual,
                passwordNueva
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cambiar contraseña');
        }

        // Limpiar formulario
        document.getElementById('cambiarPasswordForm').reset();
        
        mostrarAlerta('Contraseña cambiada correctamente', 'success');

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarAlerta(error.message, 'danger');
    }
}

// Manejar eliminación de cuenta
function handleEliminarCuenta() {
    const confirmacion = confirm(
        '¿Estás completamente seguro de que deseas eliminar tu cuenta?\n\n' +
        'Esta acción es PERMANENTE y no se puede deshacer.\n' +
        'Se eliminarán todos tus datos, incluyendo:\n' +
        '- Información personal\n' +
        '- Historial de citas\n' +
        '- Información de tus mascotas\n\n' +
        'Escribe "ELIMINAR" para confirmar.'
    );

    if (confirmacion) {
        const confirmacionTexto = prompt('Escribe "ELIMINAR" para confirmar la eliminación de tu cuenta:');
        
        if (confirmacionTexto === 'ELIMINAR') {
            eliminarCuenta();
        } else {
            mostrarAlerta('Eliminación cancelada', 'info');
        }
    }
}

// Eliminar cuenta
async function eliminarCuenta() {
    try {
        const response = await fetch(`/api/usuarios/${usuarioActual.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar cuenta');
        }

        mostrarAlerta('Cuenta eliminada correctamente. Redirigiendo...', 'success');
        
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = '/';
        }, 2000);

    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        mostrarAlerta(error.message, 'danger');
    }
}

// Manejar cerrar sesión
function handleCerrarSesion(e) {
    e.preventDefault();
    
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = '/';
    }
}

// Mostrar alerta
function mostrarAlerta(mensaje, tipo) {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}