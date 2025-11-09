// /controllers/usuariosController.js - Controlador completo de usuarios
import { 
  obtenerUsuarioPorEmail, 
  crearUsuario, 
  verificarEmailExistente, 
  crearCliente,
  obtenerTodosLosUsuarios as obtenerUsuariosModel,
  obtenerUsuarioPorIdModel,
  actualizarUsuarioModel,
  eliminarUsuarioModel
} from '../models/usuarios.js';
import { obtenerMunicipioPorId } from '../models/municipio.js';

// ==================== INICIAR SESIÓN ====================

export const loginUsuario = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Correo recibido:', email);
    console.log('Contraseña recibida:', password);

    // Verificar que los campos requeridos estén presentes
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos',
        received: { email: !!email, password: !!password }
      });
    }

    // Buscar el usuario por correo electrónico
    obtenerUsuarioPorEmail(email, (err, usuario) => {
      if (err) {
        console.error('Error en la base de datos:', err);
        return res.status(500).json({ error: 'Error al buscar el usuario en la base de datos' });
      }
      
      console.log('Usuario encontrado:', usuario);
      
      if (!usuario) {
        console.log('Usuario no encontrado para email:', email);
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
      }

      console.log('Contraseña en BD:', usuario.password);
      console.log('Contraseña proporcionada:', password);

      // Validar la contraseña (sin encriptar por ahora)
      if (usuario.password !== password) {
        console.log('Contraseña incorrecta');
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
      }

      console.log('Login exitoso para usuario:', usuario.email, 'con rol:', usuario.rol);

      // Determinar la página de redirección basada en el rol
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
        default:
          redirectUrl = '/dashboard.html';
      }

      console.log('Redirigiendo a:', redirectUrl);

      // Responder con la información del usuario y su rol
      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
        redirectUrl: redirectUrl
      });
    });
    
  } catch (error) {
    console.error('Error general en loginUsuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== REGISTRAR NUEVO USUARIO ====================

export const registrarUsuario = (req, res) => {
  try {
    const { 
      nombre, 
      apellido, 
      email, 
      telefono, 
      password, 
      calle, 
      numeroCasa, 
      municipioId, 
      departamentoId,
      rol // Opcional, para cuando el admin crea usuarios
    } = req.body;

    console.log('Datos recibidos para registro:', {
      nombre, apellido, email, telefono, rol
    });

    // Validar campos requeridos básicos
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        error: 'Nombre, email y contraseña son requeridos' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido' 
      });
    }

    // Validar teléfono si se proporciona
    if (telefono) {
      const telefonoRegex = /^[0-9]{8}$/;
      if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ 
          error: 'El teléfono debe tener exactamente 8 dígitos' 
        });
      }
    }

    // Validar contraseña segura
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial' 
      });
    }

    // Verificar que el email no exista
    verificarEmailExistente(email.toLowerCase(), (err, existe) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({ error: 'Error al verificar el email' });
      }

      if (existe) {
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
      }

      // Si tiene apellido, formatear nombre completo
      let nombreCompleto = nombre;
      if (apellido) {
        nombreCompleto = formatearNombre(nombre) + ' ' + formatearNombre(apellido);
      } else {
        nombreCompleto = formatearNombre(nombre);
      }
      
      // Construir dirección si se proporcionan los datos
      let direccionCompleta = '';
      if (calle && numeroCasa && municipioId) {
        // Verificar municipio si se proporciona
        obtenerMunicipioPorId(municipioId, (err, municipio) => {
          if (err || !municipio) {
            direccionCompleta = `${calle}, ${numeroCasa}`;
          } else {
            direccionCompleta = `${calle}, ${numeroCasa}, ${municipio.nombre}, ${municipio.departamento_nombre}`;
          }
          
          continuarRegistro();
        });
      } else {
        continuarRegistro();
      }

      function continuarRegistro() {
        // Preparar datos del usuario
        const datosUsuario = {
          nombre: nombreCompleto,
          email: email.toLowerCase(),
          password: password, // En producción deberías encriptar esto
          telefono: telefono || null,
          direccion: direccionCompleta || null,
          rol: rol || 'cliente' // Por defecto cliente
        };

        // Crear el usuario
        crearUsuario(datosUsuario, (err, usuarioCreado) => {
          if (err) {
            console.error('Error al crear usuario:', err);
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
            }
            return res.status(500).json({ error: 'Error al crear el usuario' });
          }

          console.log('Usuario creado exitosamente:', usuarioCreado);

          // Si el rol es cliente, crear registro en tabla cliente
          if (datosUsuario.rol === 'cliente') {
            crearCliente(usuarioCreado.id, (err, clienteCreado) => {
              if (err) {
                console.error('Error al crear cliente:', err);
                // El usuario ya está creado, solo advertir
                return res.status(201).json({
                  message: 'Usuario creado pero con advertencia en registro de cliente',
                  usuario: {
                    id: usuarioCreado.id,
                    nombre: usuarioCreado.nombre,
                    email: usuarioCreado.email,
                    rol: usuarioCreado.rol
                  }
                });
              }

              console.log('Cliente creado exitosamente:', clienteCreado);

              // Respuesta exitosa
              res.status(201).json({
                message: 'Usuario registrado exitosamente',
                usuario: {
                  id: usuarioCreado.id,
                  nombre: usuarioCreado.nombre,
                  email: usuarioCreado.email,
                  rol: usuarioCreado.rol
                },
                cliente: {
                  id: clienteCreado.id,
                  usuario_id: clienteCreado.usuario_id,
                  fecha_registro: clienteCreado.fecha_registro
                }
              });
            });
          } else {
            // Para vendedores y admins, solo responder con el usuario
            res.status(201).json({
              message: 'Usuario registrado exitosamente',
              usuario: {
                id: usuarioCreado.id,
                nombre: usuarioCreado.nombre,
                email: usuarioCreado.email,
                rol: usuarioCreado.rol
              }
            });
          }
        });
      }
    });

  } catch (error) {
    console.error('Error general en registrarUsuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== OBTENER TODOS LOS USUARIOS ====================

export const obtenerTodosUsuarios = (req, res) => {
  try {
    console.log('📋 Obteniendo todos los usuarios...');

    obtenerUsuariosModel((err, usuarios) => {
      if (err) {
        console.error('Error al obtener usuarios:', err);
        return res.status(500).json({ error: 'Error al obtener los usuarios' });
      }

      console.log(`✅ ${usuarios.length} usuarios obtenidos`);
      res.status(200).json(usuarios);
    });

  } catch (error) {
    console.error('Error general en obtenerTodosUsuarios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== OBTENER USUARIO POR ID ====================

export const obtenerUsuarioPorId = (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Buscando usuario con ID:', id);

    obtenerUsuarioPorIdModel(id, (err, usuario) => {
      if (err) {
        console.error('Error al obtener usuario:', err);
        return res.status(500).json({ error: 'Error al obtener el usuario' });
      }

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('✅ Usuario encontrado:', usuario.nombre);
      res.status(200).json(usuario);
    });

  } catch (error) {
    console.error('Error general en obtenerUsuarioPorId:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== ACTUALIZAR USUARIO ====================

export const actualizarUsuario = (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, rol, direccion, passwordActual, passwordNueva } = req.body;

    console.log('📝 Actualizando usuario ID:', id);
    console.log('Datos recibidos:', { nombre, email, telefono, rol, direccion, passwordActual, passwordNueva});

    // Validar que al menos un campo esté presente
    if (!nombre && !email && !telefono && !rol && !direccion && !passwordActual && !passwordNueva) {
      return res.status(400).json({ 
        error: 'Debe proporcionar al menos un campo para actualizar' 
      });
    }

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }
    }

    // Validar teléfono si se proporciona
    if (telefono) {
      const telefonoRegex = /^[0-9]{8}$/;
      if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ 
          error: 'El teléfono debe tener exactamente 8 dígitos' 
        });
      }
    }

    // Validar rol si se proporciona
    if (rol && !['cliente', 'vendedor', 'admin'].includes(rol)) {
      return res.status(400).json({ 
        error: 'Rol inválido. Debe ser: cliente, vendedor o admin' 
      });
    }

    const datosActualizacion = {};
    if (nombre) datosActualizacion.nombre = formatearNombre(nombre);
    if (email) datosActualizacion.email = email.toLowerCase();
    if (telefono) datosActualizacion.telefono = telefono;
    if (rol) datosActualizacion.rol = rol;
    if (direccion !== undefined) datosActualizacion.direccion = direccion;
    if (passwordActual) datosActualizacion.passwordActual = passwordActual;
    if (passwordNueva) datosActualizacion.passwordNueva = passwordNueva;

    actualizarUsuarioModel(id, datosActualizacion, (err, resultado) => {
      if (err) {
        console.error('Error al actualizar usuario:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
        }
        return res.status(500).json({ error: 'Error al actualizar el usuario' });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('✅ Usuario actualizado exitosamente');
      res.status(200).json({ 
        message: 'Usuario actualizado correctamente',
        id: id,
        cambios: datosActualizacion
      });
    });

  } catch (error) {
    console.error('Error general en actualizarUsuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== ELIMINAR USUARIO ====================

export const eliminarUsuario = (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Eliminando usuario ID:', id);

    // Verificar que el usuario existe antes de eliminar
    obtenerUsuarioPorIdModel(id, (err, usuario) => {
      if (err) {
        console.error('Error al verificar usuario:', err);
        return res.status(500).json({ error: 'Error al verificar el usuario' });
      }

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Eliminar el usuario
      eliminarUsuarioModel(id, (err, resultado) => {
        if (err) {
          console.error('Error al eliminar usuario:', err);
          
          // Verificar si hay restricciones de clave foránea
          if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
              error: 'No se puede eliminar el usuario porque tiene registros asociados (citas, mascotas, etc.)' 
            });
          }
          
          return res.status(500).json({ error: 'Error al eliminar el usuario' });
        }

        if (resultado.affectedRows === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('✅ Usuario eliminado exitosamente');
        res.status(200).json({ 
          message: 'Usuario eliminado correctamente',
          id: id,
          usuario: usuario.nombre
        });
      });
    });

  } catch (error) {
    console.error('Error general en eliminarUsuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// ==================== PERFIL DEL USUARIO (SENCILLO) ====================

// Obtener perfil: admite header X-User-Id o query ?userId, por defecto 1 (entorno dev)
export const obtenerPerfil = (req, res) => {
  try {
    const userId = req.header('X-User-Id') || req.query.userId || 1;
    console.log('Obtener perfil para userId:', userId);

    obtenerUsuarioPorIdModel(userId, (err, usuario) => {
      if (err) {
        console.error('Error al obtener perfil:', err);
        return res.status(500).json({ error: 'Error al obtener el perfil' });
      }
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ success: true, data: usuario });
    });
  } catch (error) {
    console.error('Excepción en obtenerPerfil:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// Actualizar perfil: permite nombre, email, telefono, direccion y cambio de contraseña
export const actualizarPerfil = (req, res) => {
  try {
    const userId = req.header('X-User-Id') || req.query.userId || 1;
    const { nombre, email, telefono, direccion, passwordActual, passwordNueva } = req.body;
    console.log('Actualizar perfil userId:', userId, 'datos:', { nombre, email, telefono, direccion, passwordActual, passwordNueva });

    // Compilar datos a actualizar
    const datos = {};
    if (nombre) datos.nombre = formatearNombre(nombre);
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) return res.status(400).json({ error: 'Formato de email inválido' });
      datos.email = email.toLowerCase();
    }
    if (telefono) {
      const telefonoRegex = /^[0-9]{8}$/;
      if (!telefonoRegex.test(telefono)) return res.status(400).json({ error: 'El teléfono debe tener 8 dígitos' });
      datos.telefono = telefono;
    }
    if (direccion !== undefined) datos.direccion = direccion;

    if (passwordNueva) {
      // Validar contraseña actual y nueva
      if (!passwordActual) return res.status(400).json({ error: 'Se requiere la contraseña actual para cambiarla' });
      // Obtener usuario para verificar contraseña actual
      obtenerUsuarioPorIdModel(userId, (err, usuario) => {
        if (err) return res.status(500).json({ error: 'Error al verificar contraseña' });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        console.log('🔍 Verificando contraseña:');
        console.log('  Contraseña en BD:', usuario.password);
        console.log('  Contraseña recibida:', passwordActual);
        console.log('  ¿Coinciden?:', usuario.password === passwordActual);
        
        if (usuario.password !== passwordActual) {
          console.log('❌ Contraseñas no coinciden');
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Validar fuerza de nueva contraseña
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passRegex.test(passwordNueva)) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas y números' });

        datos.passwordNueva = passwordNueva;
        // Ejecutar la actualización
        actualizarUsuarioModel(userId, datos, (err2, resultado) => {
          if (err2) {
            console.error('Error al actualizar perfil:', err2);
            return res.status(500).json({ error: 'Error al actualizar el perfil' });
          }
          res.json({ success: true, message: 'Perfil actualizado correctamente' });
        });
      });
      return;
    }

    // Si no hay cambio de contraseña, actualizar directamente
    if (Object.keys(datos).length === 0) return res.status(400).json({ error: 'No hay datos para actualizar' });

    actualizarUsuarioModel(userId, datos, (err, resultado) => {
      if (err) {
        console.error('Error al actualizar perfil:', err);
        return res.status(500).json({ error: 'Error al actualizar' });
      }
      res.json({ success: true, message: 'Perfil actualizado correctamente' });
    });

  } catch (error) {
    console.error('Excepción en actualizarPerfil:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ==================== FUNCIONES AUXILIARES ====================

function formatearNombre(texto) {
  return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).trim();
}