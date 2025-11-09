// /models/mascota.js
import db from '../config/db.js';

export const obtenerMascotas = (callback) => {
  const query = `
    SELECT 
      m.*,
      u.nombre as dueno_nombre,
      u.email as dueno_email,
      u.telefono as dueno_telefono,
      tm.nombre as tipo_nombre,
      tm.emoji as tipo_emoji
    FROM mascota m
    LEFT JOIN usuarios u ON m.cliente_id = u.id
    LEFT JOIN tipo_mascota tm ON m.tipo_mascota_id = tm.id
    ORDER BY m.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener mascotas:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

export const obtenerMascotasPorCliente = (usuario_id, callback) => {
  const query = `
    SELECT 
      m.*,
      tm.nombre as tipo_nombre,
      tm.emoji as tipo_emoji
    FROM mascota m
    LEFT JOIN tipo_mascota tm ON m.tipo_mascota_id = tm.id
    WHERE m.cliente_id = ?
    ORDER BY m.created_at DESC
  `;
  
  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener mascotas por usuario:', err);
      return callback(err);
    }
    callback(null, results);
  });
};

// Función para obtener una mascota específica por ID
export const obtenerMascotaPorId = (mascotaId, callback) => {
  console.log('Obteniendo mascota ID:', mascotaId);
  
  const query = 'SELECT * FROM mascota WHERE id = ?';
  
  db.query(query, [mascotaId], (err, result) => {
    if (err) {
      console.error('Error en la consulta SQL:', err);
      return callback(err, null);
    }
    
    console.log('Mascota encontrada:', result.length > 0);
    if (result.length === 0) {
      return callback(null, null);
    }
    
    callback(null, result[0]);
  });
};

// Función para crear una nueva mascota
export const crearMascota = (datosMascota, callback) => {
  const query = `
    INSERT INTO mascota (
      nombre, raza, edad, peso, observaciones,
      usuario_id, tipo_mascota_id, imagen,
      fecha_nacimiento, color, genero, estado_salud,
      microchip, especie
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const valores = [
    datosMascota.nombre,
    datosMascota.raza || null,
    datosMascota.edad || null,
    datosMascota.peso || null,
    datosMascota.observaciones || null,
    datosMascota.usuario_id, // ← Cambio de cliente_id a usuario_id
    datosMascota.tipo_mascota_id || null,
    datosMascota.imagen || null,
    datosMascota.fecha_nacimiento || null,
    datosMascota.color || null,
    datosMascota.genero || null,
    datosMascota.estado_salud || 'bueno',
    datosMascota.microchip || null,
    datosMascota.especie || null
  ];
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al crear mascota:', err);
      return callback(err);
    }
    callback(null, result);
  });
};

// Función para actualizar una mascota
export const actualizarMascota = (mascotaId, datosMascota, callback) => {
  console.log('Actualizando mascota ID:', mascotaId, 'con datos:', datosMascota);
  
  const query = `
    UPDATE mascota 
    SET nombre = ?, especie = ?, raza = ?, edad = ?, peso = ?, observaciones = ?
    WHERE id = ?
  `;
  
  const valores = [
    datosMascota.nombre,
    datosMascota.especie,
    datosMascota.raza,
    datosMascota.edad,
    datosMascota.peso,
    datosMascota.observaciones,
    mascotaId
  ];
  
  db.query(query, valores, (err, result) => {
    if (err) {
      console.error('Error al actualizar mascota:', err);
      return callback(err, null);
    }
    
    console.log('Mascota actualizada, filas afectadas:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return callback(new Error('Mascota no encontrada'), null);
    }
    
    // Obtener la mascota actualizada
    obtenerMascotaPorId(mascotaId, (err, mascotaActualizada) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, mascotaActualizada);
    });
  });
};

// Función para eliminar una mascota
export const eliminarMascota = (mascotaId, callback) => {
  console.log('Eliminando mascota ID:', mascotaId);
  
  // Primero obtener la mascota para confirmar que existe
  obtenerMascotaPorId(mascotaId, (err, mascota) => {
    if (err) {
      return callback(err, null);
    }
    
    if (!mascota) {
      return callback(new Error('Mascota no encontrada'), null);
    }
    
    const query = 'DELETE FROM mascota WHERE id = ?';
    
    db.query(query, [mascotaId], (err, result) => {
      if (err) {
        console.error('Error al eliminar mascota:', err);
        return callback(err, null);
      }
      
      console.log('Mascota eliminada, filas afectadas:', result.affectedRows);
      
      if (result.affectedRows === 0) {
        return callback(new Error('No se pudo eliminar la mascota'), null);
      }
      
      callback(null, { 
        message: 'Mascota eliminada exitosamente',
        mascotaEliminada: mascota 
      });
    });
  });
};

// Función para obtener estadísticas de mascotas por cliente
export const obtenerEstadisticasPorCliente = (clienteId, callback) => {
  console.log('Obteniendo estadísticas para cliente ID:', clienteId);
  
  const query = `
    SELECT 
      COUNT(*) as total_mascotas,
      COUNT(CASE WHEN raza IS NOT NULL AND raza != '' THEN 1 END) as con_raza,
      COUNT(CASE WHEN observaciones IS NOT NULL AND observaciones != '' THEN 1 END) as con_observaciones,
      COUNT(CASE WHEN peso IS NOT NULL THEN 1 END) as con_peso,
      COUNT(CASE WHEN edad IS NOT NULL THEN 1 END) as con_edad,
      AVG(CASE WHEN edad IS NOT NULL THEN edad END) as edad_promedio,
      AVG(CASE WHEN peso IS NOT NULL THEN peso END) as peso_promedio
    FROM mascota 
    WHERE cliente_id = ?
  `;
  
  db.query(query, [clienteId], (err, result) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err);
      return callback(err, null);
    }
    
    console.log('Estadísticas obtenidas:', result[0]);
    callback(null, result[0]);
  });
};

// Función para verificar si una mascota pertenece a un cliente específico
export const verificarPropietarioMascota = (mascotaId, clienteId, callback) => {
  console.log('Verificando propietario de mascota ID:', mascotaId, 'para cliente:', clienteId);
  
  const query = 'SELECT COUNT(*) as count FROM mascota WHERE id = ? AND cliente_id = ?';
  
  db.query(query, [mascotaId, clienteId], (err, result) => {
    if (err) {
      console.error('Error al verificar propietario:', err);
      return callback(err, null);
    }
    
    const esPropietario = result[0].count > 0;
    console.log('Es propietario:', esPropietario);
    callback(null, esPropietario);
  });
};

// Función para obtener todas las mascotas (admin use)
export const obtenerTodasLasMascotas = (callback) => {
  console.log('Obteniendo todas las mascotas');
  
  const query = `
    SELECT 
      m.*,
      u.id as cliente_id,
      u.nombre as propietario_nombre,
      u.email as propietario_email
    FROM mascota m
    INNER JOIN usuarios u ON m.cliente_id = u.id
    ORDER BY m.nombre ASC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error en la consulta SQL:', err);
      return callback(err, null);
    }
    
    console.log('Total de mascotas encontradas:', result.length);
    callback(null, result);
  });
};  