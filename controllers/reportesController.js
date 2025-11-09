// controllers/reportesController.js
import db from '../config/db.js';

// Resumen general: totales y por estado
export const resumen = (req, res) => {
  try {
    const queries = {
      totalCitas: 'SELECT COUNT(*) as total FROM cita',
      pendientes: `SELECT COUNT(*) as total FROM cita WHERE estado = 'pendiente'`,
      confirmadas: `SELECT COUNT(*) as total FROM cita WHERE estado = 'confirmada'`,
      completadas: `SELECT COUNT(*) as total FROM cita WHERE estado = 'completada'`,
      canceladas: `SELECT COUNT(*) as total FROM cita WHERE estado = 'cancelada'`,
      servicios: 'SELECT COUNT(*) as total FROM servicio',
      clientes: "SELECT COUNT(*) as total FROM usuarios WHERE rol = 'cliente'"
    };

    const tasks = Object.keys(queries).map(key => {
      return new Promise((resolve, reject) => {
        db.query(queries[key], (err, results) => {
          if (err) return reject(err);
          resolve({ [key]: results[0].total });
        });
      });
    });

    Promise.all(tasks).then(parts => {
      const data = parts.reduce((acc, item) => Object.assign(acc, item), {});
      res.json({ success: true, data });
    }).catch(err => {
      console.error('Error al generar resumen de reportes:', err);
      res.status(500).json({ success: false, error: 'Error interno al generar resumen' });
    });

  } catch (error) {
    console.error('Excepción en resumen reportes:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};

// Top servicios por número de citas
export const serviciosTop = (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const q = `
    SELECT s.id, s.nombre, COALESCE(COUNT(c.id),0) AS total
    FROM servicio s
    LEFT JOIN cita c ON c.servicio_id = s.id
    GROUP BY s.id
    ORDER BY total DESC
    LIMIT ?
  `;

  db.query(q, [limit], (err, results) => {
    if (err) {
      console.error('Error al obtener servicios top:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener servicios top' });
    }
    res.json({ success: true, data: results });
  });
};

// Top sucursales por número de citas
export const sucursalesTop = (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const q = `
    SELECT su.id, su.nombre, COALESCE(COUNT(c.id),0) AS total
    FROM sucursal su
    LEFT JOIN cita c ON c.sucursal_id = su.id
    GROUP BY su.id
    ORDER BY total DESC
    LIMIT ?
  `;

  db.query(q, [limit], (err, results) => {
    if (err) {
      console.error('Error al obtener sucursales top:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener sucursales top' });
    }
    res.json({ success: true, data: results });
  });
};

// Evolución mensual de citas en los últimos N meses
export const mensual = (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const q = `
    SELECT DATE_FORMAT(fecha, '%Y-%m') as ym, COUNT(*) as total
    FROM cita
    WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY ym
    ORDER BY ym ASC
  `;

  db.query(q, [months], (err, results) => {
    if (err) {
      console.error('Error al obtener datos mensuales:', err);
      return res.status(500).json({ success: false, error: 'Error al obtener datos mensuales' });
    }
    res.json({ success: true, data: results });
  });
};
