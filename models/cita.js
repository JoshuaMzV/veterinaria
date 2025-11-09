// /models/cita.js - ACTUALIZADO PARA USAR cliente_id
import db from '../config/db.js';

// Obtener todas las citas con información relacionada
export const obtenerCitas = (callback) => {
  const query = `
    SELECT 
      c.*,
      m.nombre as mascota_nombre,
      m.especie as mascota_especie,
      m.raza as mascota_raza,
      s.nombre as servicio_nombre,
      s.descripcion as servicio_descripcion,
      suc.nombre as sucursal_nombre,
      suc.direccion as sucursal_direccion,
      u.nombre as cliente_nombre,
      u.telefono as cliente_telefono,
      u.email as cliente_email
    FROM cita c
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    LEFT JOIN usuarios u ON c.cliente_id = u.id
    ORDER BY c.fecha DESC, c.hora DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener citas:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

// Obtener citas por usuario (antes era por cliente)
export const obtenerCitasPorCliente = (usuario_id, callback) => {
  const query = `
    SELECT 
      c.*,
      m.nombre as mascota_nombre,
      m.especie as mascota_especie,
      m.raza as mascota_raza,
      s.nombre as servicio_nombre,
      s.descripcion as servicio_descripcion,
      suc.nombre as sucursal_nombre,
      suc.direccion as sucursal_direccion
    FROM cita c
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    WHERE c.cliente_id = ?
    ORDER BY c.fecha DESC, c.hora DESC
  `;
  
  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener citas por usuario:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

// Obtener una cita por ID
export const obtenerCitaPorId = (id, callback) => {
  const query = `
    SELECT 
      c.*,
      m.nombre as mascota_nombre,
      m.especie as mascota_especie,
      m.raza as mascota_raza,
      s.nombre as servicio_nombre,
      s.descripcion as servicio_descripcion,
      suc.nombre as sucursal_nombre,
      suc.direccion as sucursal_direccion,
      u.nombre as cliente_nombre,
      u.telefono as cliente_telefono,
      u.email as cliente_email
    FROM cita c
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    LEFT JOIN usuarios u ON c.cliente_id = u.id
    WHERE c.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener cita por ID:', err);
      return callback(err);
    }
    callback(null, results[0] || null);
  });
};

// Verificar que una mascota pertenece a un usuario
export const verificarMascotaCliente = (mascota_id, usuario_id, callback) => {
  const query = 'SELECT id FROM mascota WHERE id = ? AND cliente_id = ?';
  
  db.query(query, [mascota_id, usuario_id], (err, results) => {
    if (err) {
      console.error('Error al verificar mascota-usuario:', err);
      return callback(err);
    }
    callback(null, results.length > 0);
  });
};

// Verificar que existe un servicio
export const verificarServicio = (servicio_id, callback) => {
  const query = 'SELECT id FROM servicio WHERE id = ?';
  
  db.query(query, [servicio_id], (err, results) => {
    if (err) {
      console.error('Error al verificar servicio:', err);
      return callback(err);
    }
    callback(null, results.length > 0);
  });
};

// Verificar que existe una sucursal
export const verificarSucursal = (sucursal_id, callback) => {
  const query = 'SELECT id FROM sucursal WHERE id = ?';
  
  db.query(query, [sucursal_id], (err, results) => {
    if (err) {
      console.error('Error al verificar sucursal:', err);
      return callback(err);
    }
    callback(null, results.length > 0);
  });
};

// Crear nueva cita
export const crearCita = (datosCita, callback) => {
  const query = `
    INSERT INTO cita (
      cliente_id, 
      mascota_id, 
      servicio_id, 
      sucursal_id,
      fecha, 
      hora, 
      estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const valores = [
    datosCita.usuario_id || datosCita.cliente_id, // Acepta ambos por compatibilidad
    datosCita.mascota_id,
    datosCita.servicio_id,
    datosCita.sucursal_id,
    datosCita.fecha,
    datosCita.hora,
    datosCita.estado || 'pendiente'
  ];
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al crear cita:', err);
      return callback(err);
    }
    
    console.log('Cita creada exitosamente con ID:', result.insertId);
    callback(null, result);
  });
};

// Actualizar cita
export const actualizarCita = (id, datosActualizar, callback) => {
  const campos = [];
  const valores = [];
  
  const camposPermitidos = ['fecha', 'hora', 'estado', 'sucursal_id'];
  
  camposPermitidos.forEach(campo => {
    if (datosActualizar.hasOwnProperty(campo)) {
      campos.push(`${campo} = ?`);
      valores.push(datosActualizar[campo]);
    }
  });
  
  if (campos.length === 0) {
    return callback(new Error('No hay campos para actualizar'));
  }
  
  valores.push(id);
  const query = `UPDATE cita SET ${campos.join(', ')} WHERE id = ?`;
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al actualizar cita:', err);
      return callback(err);
    }
    
    console.log('Cita actualizada:', id);
    callback(null, result);
  });
};

// Eliminar cita
export const eliminarCita = (id, callback) => {
  const query = 'DELETE FROM cita WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar cita:', err);
      return callback(err);
    }
    
    console.log('Cita eliminada:', id);
    callback(null, result);
  });
};

// Verificar disponibilidad de horario
export const verificarDisponibilidad = (fecha, hora, sucursal_id, callback) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM cita 
    WHERE fecha = ? AND hora = ? AND sucursal_id = ? AND estado NOT IN ('cancelada')
  `;
  
  db.query(query, [fecha, hora, sucursal_id], (err, results) => {
    if (err) {
      console.error('Error al verificar disponibilidad:', err);
      return callback(err);
    }
    
    const disponible = results[0].count === 0;
    callback(null, disponible);
  });
};

// Obtener citas por fecha
export const obtenerCitasPorFecha = (fecha, callback) => {
  const query = `
    SELECT 
      c.*,
      m.nombre as mascota_nombre,
      m.especie as mascota_especie,
      s.nombre as servicio_nombre,
      suc.nombre as sucursal_nombre,
      u.nombre as cliente_nombre
    FROM cita c
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    LEFT JOIN usuarios u ON c.cliente_id = u.id
    WHERE c.fecha = ?
    ORDER BY c.hora ASC
  `;
  
  db.query(query, [fecha], (err, results) => {
    if (err) {
      console.error('Error al obtener citas por fecha:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

// Obtener estadísticas por usuario
export const obtenerEstadisticasPorCliente = (usuario_id, callback) => {
  const query = `
    SELECT 
      estado,
      COUNT(*) as cantidad,
      DATE(fecha) as fecha_grupo
    FROM cita 
    WHERE cliente_id = ?
    GROUP BY estado, DATE(fecha)
    ORDER BY fecha_grupo DESC
  `;
  
  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err);
      return callback(err);
    }
    
    const estadisticas = {
      total: 0,
      pendiente: 0,
      confirmada: 0,
      cancelada: 0,
      completada: 0,
      por_fecha: {}
    };
    
    results.forEach(row => {
      estadisticas.total += row.cantidad;
      estadisticas[row.estado] = (estadisticas[row.estado] || 0) + row.cantidad;
      
      if (!estadisticas.por_fecha[row.fecha_grupo]) {
        estadisticas.por_fecha[row.fecha_grupo] = {};
      }
      estadisticas.por_fecha[row.fecha_grupo][row.estado] = row.cantidad;
    });
    
    callback(null, estadisticas);
  });
};

// Obtener próximas citas por usuario
export const obtenerProximasCitas = (usuario_id, limite = 5, callback) => {
  const query = `
    SELECT 
      c.*,
      m.nombre as mascota_nombre,
      m.especie as mascota_especie,
      s.nombre as servicio_nombre,
      suc.nombre as sucursal_nombre
    FROM cita c
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    WHERE c.cliente_id = ? 
      AND c.fecha >= CURDATE() 
      AND c.estado IN ('pendiente', 'confirmada')
    ORDER BY c.fecha ASC, c.hora ASC
    LIMIT ?
  `;
  
  db.query(query, [usuario_id, limite], (err, results) => {
    if (err) {
      console.error('Error al obtener próximas citas:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

export const actualizarCitasPasadas = (callback) => {
  // Esta función se desactiva para evitar conflictos con cambios manuales
  // El estado de las citas debe ser controlado por el admin manualmente
  if (callback) callback(null, { affectedRows: 0 });
};

export const actualizarCitasPasadasPorCliente = (usuario_id, callback) => {
  // Esta función se desactiva para evitar conflictos con cambios manuales
  // El estado de las citas debe ser controlado por el admin manualmente
  if (callback) callback(null, { affectedRows: 0 });
};