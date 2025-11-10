document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginSpinner = document.getElementById('loginSpinner');
  const btnText = document.getElementById('btnText');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Funciones para mostrar mensajes
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('d-none');
    successMessage.classList.add('d-none');
    
    // Scroll suave al mensaje
    errorMessage.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('d-none');
    errorMessage.classList.add('d-none');
  }

  function hideMessages() {
    errorMessage.classList.add('d-none');
    successMessage.classList.add('d-none');
  }

  // Función para manejar el estado de carga
  function setLoading(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      loginSpinner.classList.remove('d-none');
      btnText.innerHTML = '<i class="bi bi-hourglass-split"></i> Verificando...';
    } else {
      loginBtn.disabled = false;
      loginSpinner.classList.add('d-none');
      btnText.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';
    }
  }

  // Validación de email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Manejar el envío del formulario
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideMessages();

    // Obtener valores de los inputs
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validaciones del frontend
    if (!email || !password) {
      showError('Por favor, completa todos los campos.');
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError('Por favor, ingresa un correo electrónico válido.');
      emailInput.focus();
      return;
    }

    if (password.length < 3) {
      showError('La contraseña debe tener al menos 3 caracteres.');
      passwordInput.focus();
      return;
    }

    // Activar estado de carga
    setLoading(true);

    try {
      // Realizar petición al servidor
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso
        console.log('✅ Response OK');
        console.log('📥 Datos recibidos:', data);
        console.log('📥 Usuario:', data.usuario);
        console.log('📥 Rol:', data.usuario?.rol);
        
        showSuccess(`¡Bienvenido ${data.usuario.nombre}! Redirigiendo...`);
        
        // Guardar información del usuario en sessionStorage
        const usuarioJSON = JSON.stringify(data.usuario);
        console.log('💾 Guardando en sessionStorage:', usuarioJSON);
        sessionStorage.setItem('usuario', usuarioJSON);
        sessionStorage.setItem('isLoggedIn', 'true');
        
        console.log('✅ SessionStorage actualizado');
        console.log('🔄 Rol en sessionStorage:', sessionStorage.getItem('usuario'));
        
        // Redirigir después de un breve delay
        const redirectUrl = data.redirectUrl || '/dashboard.html';
        console.log('📍 Redirigiendo a:', redirectUrl);
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);

      } else {
        // Error en el login
        showError(data.error || 'Error desconocido al iniciar sesión');
        
        // Focus en el campo apropiado según el error
        if (data.error && data.error.toLowerCase().includes('email')) {
          emailInput.focus();
        } else {
          passwordInput.focus();
        }
      }

    } catch (error) {
      console.error('Error de red:', error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error de conexión. ';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += 'No se pudo conectar al servidor. Verifica tu conexión.';
      } else if (error.message.includes('JSON')) {
        errorMessage += 'Error en la respuesta del servidor.';
      } else {
        errorMessage += 'Por favor, intenta de nuevo.';
      }
      
      showError(errorMessage);
      
    } finally {
      // Desactivar estado de carga
      setLoading(false);
    }
  });

  // Limpiar mensajes cuando el usuario empiece a escribir
  emailInput.addEventListener('input', hideMessages);
  passwordInput.addEventListener('input', hideMessages);

  // Manejar tecla Enter en los inputs
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  // Efectos visuales para los inputs
  const inputs = [emailInput, passwordInput];
  
  inputs.forEach(input => {
    // Efecto de focus
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    // Efecto de blur
    input.addEventListener('blur', function() {
      if (!this.value.trim()) {
        this.parentElement.classList.remove('focused');
      }
    });

    // Verificar si ya tiene valor al cargar la página
    if (input.value.trim()) {
      input.parentElement.classList.add('focused');
    }
  });

  // Verificar si el usuario ya está logueado
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    
    if (usuario.rol) {
      // Redirigir automáticamente si ya está logueado
      let redirectUrl = '/dashboard.html';
      
      switch (usuario.rol.toLowerCase()) {
        case 'cliente':
          redirectUrl = '/cliente-dashboard.html';
          break;
        case 'vendedor':
          redirectUrl = '/vendedor-dashboard.html';
          break;
        case 'admin':
          redirectUrl = '/admin-dashboard.html';
          break;
      }
      
      window.location.href = redirectUrl;
    }
  }

  // Log para debugging (solo en desarrollo)
  console.log('Login form initialized successfully');
});