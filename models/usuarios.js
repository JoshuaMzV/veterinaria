// /models/usuarios.js - Modelo completo de usuarios
import db from '../config/db.js';

// ==================== OBTENER USUARIO POR EMAIL ====================

export const obtenerUsuarioPorEmail = (email, callback) => {
  console.log('Buscando usuario con email:', email);
  
  const query = 'SELECT * FROM usuarios WHERE email = ?';
  
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Error en la consulta SQL:', err);
      return callback(err, null);
    }
    
    console.log('Resultado de la consulta:', result);
    console.log('Número de usuarios encontrados:', result.length);
    
    if (result.length === 0) {
      return callback(null, null); // No se encontró usuario
    }
    
    callback(null, result[0]); // Devolver el primer usuario encontrado
  });
};

// ==================== CREAR USUARIO ====================

export const crearUsuario = (datosUsuario, callback) => {
  console.log('Creando usuario:', datosUsuario);
  
  const query = `
    INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const valores = [
    datosUsuario.nombre,
    datosUsuario.email,
    datosUsuario.password,
    datosUsuario.telefono,
    datosUsuario.direccion,
    datosUsuario.rol || 'cliente' // Por defecto cliente
  ];
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al crear usuario:', err);
      return callback(err, null);
    }
    
    console.log('Usuario creado exitosamente con ID:', result.insertId);
    callback(null, { 
      id: result.insertId, 
      ...datosUsuario 
    });
  });
};

// ==================== VERIFICAR EMAIL EXISTENTE ====================

export const verificarEmailExistente = (email, callback) => {
  console.log('Verificando si el email existe:', email);
  
  const query = 'SELECT COUNT(*) as count FROM usuarios WHERE email = ?';
  
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return callback(err, null);
    }
    
    const existe = result[0].count > 0;
    console.log('Email existe:', existe);
    callback(null, existe);
  });
};

// ==================== CREAR CLIENTE ====================

export const crearCliente = (usuarioId, callback) => {
  console.log('Creando cliente para usuario ID:', usuarioId);
  
  const query = 'INSERT INTO cliente (usuario_id) VALUES (?)';
  
  db.query(query, [usuarioId], (err, result) => {
    if (err) {
      console.error('Error al crear cliente:', err);
      return callback(err, null);
    }
    
    console.log('Cliente creado exitosamente con ID:', result.insertId);
    callback(null, {
      id: result.insertId,
      usuario_id: usuarioId,
      fecha_registro: new Date()
    });
  });
};

// ==================== OBTENER TODOS LOS USUARIOS ====================

export const obtenerTodosLosUsuarios = (callback) => {
  console.log('📋 Obteniendo todos los usuarios...');
  
  const query = `
    SELECT 
      id, 
      nombre, 
      email, 
      telefono, 
      direccion, 
      rol,
      fecha_creacion
    FROM usuarios 
    ORDER BY nombre ASC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return callback(err, null);
    }
    
    console.log(`✅ ${result.length} usuarios obtenidos`);
    callback(null, result);
  });
};

// ==================== OBTENER USUARIO POR ID ====================

export const obtenerUsuarioPorIdModel = (id, callback) => {
  console.log('🔍 Buscando usuario con ID:', id);
  
  const query = `
    SELECT 
      id, 
      nombre, 
      email, 
      password,
      telefono, 
      direccion, 
      rol,
      fecha_creacion
    FROM usuarios 
    WHERE id = ?
  `;
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al obtener usuario:', err);
      return callback(err, null);
    }
    
    if (result.length === 0) {
      console.log('Usuario no encontrado');
      return callback(null, null);
    }
    
    console.log('✅ Usuario encontrado:', result[0].nombre);
    callback(null, result[0]);
  });
};

// ==================== ACTUALIZAR USUARIO ====================

export const actualizarUsuarioModel = (id, datos, callback) => {
  console.log('📝 Actualizando usuario ID:', id);
  console.log('Datos a actualizar:', datos);
  
  // Construir la query dinámicamente basado en los campos proporcionados
  const campos = [];
  const valores = [];
  
  if (datos.nombre !== undefined) {
    campos.push('nombre = ?');
    valores.push(datos.nombre);
  }
  
  if (datos.email !== undefined) {
    campos.push('email = ?');
    valores.push(datos.email);
  }
  
  if (datos.telefono !== undefined) {
    campos.push('telefono = ?');
    valores.push(datos.telefono);
  }
  
  if (datos.rol !== undefined) {
    campos.push('rol = ?');
    valores.push(datos.rol);
  }
  
  if (datos.direccion !== undefined) {
    campos.push('direccion = ?');
    valores.push(datos.direccion);
  }
  
  if (datos.passwordNueva !== undefined) {
    campos.push('password = ?');
    valores.push(datos.passwordNueva);
  }
  
  if (campos.length === 0) {
    return callback(new Error('No hay campos para actualizar'), null);
  }
  
  // Agregar el ID al final de los valores
  valores.push(id);
  
  const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
  
  console.log('Query generada:', query);
  console.log('Valores:', valores);
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al actualizar usuario:', err);
      return callback(err, null);
    }
    
    console.log(`✅ Usuario actualizado. Filas afectadas: ${result.affectedRows}`);
    callback(null, result);
  });
};

// ==================== ELIMINAR USUARIO ====================

export const eliminarUsuarioModel = (id, callback) => {
  console.log('🗑️ Eliminando usuario ID:', id);
  
  const query = 'DELETE FROM usuarios WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return callback(err, null);
    }
    
    console.log(`✅ Usuario eliminado. Filas afectadas: ${result.affectedRows}`);
    callback(null, result);
  });
};

// ==================== CONTAR USUARIOS POR ROL ====================

export const contarUsuariosPorRol = (callback) => {
  console.log('📊 Contando usuarios por rol...');
  
  const query = `
    SELECT 
      rol,
      COUNT(*) as total
    FROM usuarios
    GROUP BY rol
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al contar usuarios:', err);
      return callback(err, null);
    }
    
    console.log('✅ Conteo completado:', result);
    callback(null, result);
  });
};

// ==================== BUSCAR USUARIOS ====================

export const buscarUsuarios = (termino, callback) => {
  console.log('🔍 Buscando usuarios con término:', termino);
  
  const query = `
    SELECT 
      id, 
      nombre, 
      email, 
      telefono, 
      direccion, 
      rol,
      fecha_creacion
    FROM usuarios 
    WHERE 
      nombre LIKE ? OR 
      email LIKE ? OR 
      telefono LIKE ?
    ORDER BY nombre ASC
  `;
  
  const terminoBusqueda = `%${termino}%`;
  
  db.query(query, [terminoBusqueda, terminoBusqueda, terminoBusqueda], (err, result) => {
    if (err) {
      console.error('Error al buscar usuarios:', err);
      return callback(err, null);
    }
    
    console.log(`✅ ${result.length} usuarios encontrados`);
    callback(null, result);
  });
};

// ==================== OBTENER USUARIOS POR ROL ====================

export const obtenerUsuariosPorRol = (rol, callback) => {
  console.log('📋 Obteniendo usuarios con rol:', rol);
  
  const query = `
    SELECT 
      id, 
      nombre, 
      email, 
      telefono, 
      direccion, 
      rol,
      fecha_creacion
    FROM usuarios 
    WHERE rol = ?
    ORDER BY nombre ASC
  `;
  
  db.query(query, [rol], (err, result) => {
    if (err) {
      console.error('Error al obtener usuarios por rol:', err);
      return callback(err, null);
    }
    
    console.log(`✅ ${result.length} usuarios con rol ${rol} obtenidos`);
    callback(null, result);
  });
};