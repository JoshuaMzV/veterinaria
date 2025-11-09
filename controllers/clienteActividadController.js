// controllers/clienteActividadController.js
import db from '../config/db.js';

// Registrar actividad del usuario (antes cliente)
export const registrarActividad = (req, res) => {
  const { cliente_id } = req.body;

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Insertar actividad del día (ignorar si ya existe)
  const queryInsert = `
    INSERT IGNORE INTO cliente_actividad (cliente_id, fecha_actividad, ultima_conexion)
    VALUES (?, ?, NOW())
  `;

  db.query(queryInsert, [cliente_id, fechaHoy], (err, result) => {
    if (err) {
      console.error('Error al registrar actividad:', err);
      return res.status(500).json({ error: 'Error al registrar actividad' });
    }

    // Actualizar última conexión si ya existía el registro
    const queryUpdate = `
      UPDATE cliente_actividad 
      SET ultima_conexion = NOW() 
      WHERE cliente_id = ? AND fecha_actividad = ?
    `;

    db.query(queryUpdate, [cliente_id, fechaHoy], (updateErr) => {
      if (updateErr) {
        console.error('Error al actualizar última conexión:', updateErr);
      }

      console.log('Actividad registrada/actualizada para usuario:', cliente_id);
      res.json({ 
        message: 'Actividad registrada correctamente',
        fecha: fechaHoy
      });
    });
  });
};

// Obtener días activos del usuario
export const obtenerDiasActivos = (req, res) => {
  const { cliente_id } = req.params;

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  const query = `
    SELECT 
      COUNT(DISTINCT fecha_actividad) as dias_activos,
      MIN(fecha_actividad) as primera_actividad,
      MAX(ultima_conexion) as ultima_conexion
    FROM cliente_actividad 
    WHERE cliente_id = ?
  `;

  db.query(query, [cliente_id], (err, results) => {
    if (err) {
      console.error('Error al obtener días activos:', err);
      return res.status(500).json({ error: 'Error al obtener días activos' });
    }

    const resultado = results[0] || {
      dias_activos: 0,
      primera_actividad: null,
      ultima_conexion: null
    };

    res.json(resultado);
  });
};

// Obtener historial de actividad del usuario
export const obtenerHistorialActividad = (req, res) => {
  const { cliente_id } = req.params;
  const { limite = 30 } = req.query; // Últimos 30 días por defecto

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  const query = `
    SELECT 
      fecha_actividad,
      ultima_conexion,
      DAYNAME(fecha_actividad) as dia_semana
    FROM cliente_actividad 
    WHERE cliente_id = ? 
    ORDER BY fecha_actividad DESC 
    LIMIT ?
  `;

  db.query(query, [cliente_id, parseInt(limite)], (err, results) => {
    if (err) {
      console.error('Error al obtener historial de actividad:', err);
      return res.status(500).json({ error: 'Error al obtener historial de actividad' });
    }

    res.json(results);
  });
};

// Obtener estadísticas de actividad
export const obtenerEstadisticasActividad = (req, res) => {
  const { cliente_id } = req.params;

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  const query = `
    SELECT 
      COUNT(DISTINCT fecha_actividad) as total_dias_activos,
      COUNT(DISTINCT YEAR(fecha_actividad), MONTH(fecha_actividad)) as meses_activos,
      MIN(fecha_actividad) as primera_actividad,
      MAX(fecha_actividad) as ultima_actividad,
      MAX(ultima_conexion) as ultima_conexion,
      AVG(
        CASE 
          WHEN fecha_actividad >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 
          ELSE 0 
        END
      ) * 7 as dias_activos_ultima_semana,
      COUNT(
        CASE 
          WHEN fecha_actividad = CURDATE() THEN 1 
        END
      ) as activo_hoy
    FROM cliente_actividad 
    WHERE cliente_id = ?
  `;

  db.query(query, [cliente_id], (err, results) => {
    if (err) {
      console.error('Error al obtener estadísticas de actividad:', err);
      return res.status(500).json({ error: 'Error al obtener estadísticas de actividad' });
    }

    const estadisticas = results[0] || {
      total_dias_activos: 0,
      meses_activos: 0,
      primera_actividad: null,
      ultima_actividad: null,
      ultima_conexion: null,
      dias_activos_ultima_semana: 0,
      activo_hoy: 0
    };

    res.json(estadisticas);
  });
};