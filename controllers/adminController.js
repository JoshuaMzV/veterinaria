// /controllers/adminController.js
import db from '../config/db.js';

// ==================== ESTADÍSTICAS GENERALES ====================

export const obtenerEstadisticasGenerales = (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM cita) as total_citas,
      (SELECT COUNT(*) FROM cita WHERE estado = 'pendiente') as citas_pendientes,
      (SELECT COUNT(*) FROM cita WHERE estado = 'confirmada') as citas_confirmadas,
      (SELECT COUNT(*) FROM cita WHERE estado = 'completada') as citas_completadas,
      (SELECT COUNT(*) FROM cita WHERE estado = 'cancelada') as citas_canceladas,
      (SELECT COUNT(*) FROM cita WHERE fecha = CURDATE()) as citas_hoy,
      (SELECT COUNT(*) FROM cita WHERE fecha = CURDATE() AND (estado = 'pendiente' OR estado = 'confirmada')) as citas_hoy_activas,
      (SELECT COUNT(*) FROM mascota) as total_mascotas,
      (SELECT COUNT(*) FROM cliente) as total_clientes,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') as usuarios_cliente,
      (SELECT COUNT(*) FROM servicio) as total_servicios,
      (SELECT COUNT(*) FROM sucursal) as total_sucursales,
      (SELECT COUNT(*) FROM cita WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()) AND estado = 'completada') as completadas_mes_actual,
      (SELECT COUNT(*) FROM cita WHERE MONTH(fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND estado = 'completada') as completadas_mes_anterior
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener estadísticas generales:', err);
      return res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    console.log('✅ Estadísticas generales obtenidas');
    res.json(results[0]);
  });
};

// ==================== ESTADÍSTICAS POR FECHA ====================

export const obtenerEstadisticasPorFecha = (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ 
      error: 'Se requieren parámetros: fechaInicio y fechaFin',
      ejemplo: '/api/admin/estadisticas/fechas?fechaInicio=2024-01-01&fechaFin=2024-01-31'
    });
  }

  const query = `
    SELECT 
      fecha,
      COUNT(*) as total_citas,
      SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
      SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
      SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas
    FROM cita
    WHERE fecha BETWEEN ? AND ?
    GROUP BY fecha
    ORDER BY fecha ASC
  `;

  db.query(query, [fechaInicio, fechaFin], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener estadísticas por fecha:', err);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }

    console.log(`✅ Estadísticas obtenidas para ${fechaInicio} - ${fechaFin}`);
    res.json(results);
  });
};

// ==================== REPORTE MENSUAL ====================

export const obtenerReporteMensual = (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(c.fecha, '%Y-%m-%d') as fecha,
      DATE_FORMAT(c.fecha, '%d/%m') as fecha_corta,
      COUNT(*) as total_citas,
      s.nombre as servicio,
      COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas,
      COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as canceladas,
      COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as pendientes,
      COUNT(CASE WHEN c.estado = 'confirmada' THEN 1 END) as confirmadas
    FROM cita c
    LEFT JOIN servicio s ON c.servicio_id = s.id
    WHERE MONTH(c.fecha) = MONTH(CURDATE()) 
      AND YEAR(c.fecha) = YEAR(CURDATE())
    GROUP BY DATE_FORMAT(c.fecha, '%Y-%m-%d'), s.nombre, fecha_corta
    ORDER BY fecha DESC, s.nombre
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener reporte mensual:', err);
      return res.status(500).json({ error: 'Error al obtener reporte' });
    }

    // Agrupar por fecha para mejor visualización
    const reporteAgrupado = results.reduce((acc, row) => {
      if (!acc[row.fecha]) {
        acc[row.fecha] = {
          fecha: row.fecha,
          fecha_corta: row.fecha_corta,
          servicios: [],
          total_citas: 0,
          completadas: 0,
          canceladas: 0,
          pendientes: 0,
          confirmadas: 0
        };
      }
      
      acc[row.fecha].servicios.push({
        nombre: row.servicio,
        total: row.total_citas,
        completadas: row.completadas,
        canceladas: row.canceladas
      });
      
      acc[row.fecha].total_citas += parseInt(row.total_citas);
      acc[row.fecha].completadas += parseInt(row.completadas);
      acc[row.fecha].canceladas += parseInt(row.canceladas);
      acc[row.fecha].pendientes += parseInt(row.pendientes);
      acc[row.fecha].confirmadas += parseInt(row.confirmadas);
      
      return acc;
    }, {});

    console.log('✅ Reporte mensual obtenido');
    res.json({
      mes: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      reporte: Object.values(reporteAgrupado)
    });
  });
};

// ==================== TOP CLIENTES ====================

export const obtenerTopClientes = (req, res) => {
  const limite = parseInt(req.query.limite) || 10;

  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.telefono,
      COUNT(c.id) as total_citas,
      SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas,
      SUM(CASE WHEN c.estado = 'pendiente' OR c.estado = 'confirmada' THEN 1 ELSE 0 END) as citas_activas,
      MAX(c.fecha) as ultima_cita,
      MIN(c.fecha) as primera_cita
    FROM usuarios u
    LEFT JOIN cita c ON u.id = c.cliente_id
    WHERE u.rol = 'cliente'
    GROUP BY u.id, u.nombre, u.email, u.telefono
    HAVING total_citas > 0
    ORDER BY total_citas DESC, citas_completadas DESC
    LIMIT ?
  `;

  db.query(query, [limite], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener top clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }

    console.log(`✅ Top ${results.length} clientes obtenidos`);
    res.json(results);
  });
};

// ==================== SERVICIOS POPULARES ====================

export const obtenerServiciosPopulares = (req, res) => {
  const query = `
    SELECT 
      s.id,
      s.nombre,
      s.descripcion,
      s.precio,
      COUNT(c.id) as total_solicitudes,
      COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas,
      COUNT(CASE WHEN c.estado = 'pendiente' OR c.estado = 'confirmada' THEN 1 END) as activas,
      COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as canceladas,
      ROUND(COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(c.id), 0), 2) as tasa_completadas
    FROM servicio s
    LEFT JOIN cita c ON s.id = c.servicio_id
    GROUP BY s.id, s.nombre, s.descripcion, s.precio
    ORDER BY total_solicitudes DESC, completadas DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener servicios populares:', err);
      return res.status(500).json({ error: 'Error al obtener servicios' });
    }

    console.log('✅ Servicios populares obtenidos');
    res.json(results);
  });
};

// ==================== ACTIVIDAD RECIENTE ====================

export const obtenerActividadReciente = (req, res) => {
  const limite = parseInt(req.query.limite) || 20;

  const query = `
    SELECT 
      c.id,
      c.fecha,
      c.hora,
      c.estado,
      u.nombre as cliente_nombre,
      m.nombre as mascota_nombre,
      s.nombre as servicio_nombre,
      suc.nombre as sucursal_nombre,
      CASE 
        WHEN c.fecha = CURDATE() THEN 'Hoy'
        WHEN c.fecha = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Mañana'
        ELSE DATE_FORMAT(c.fecha, '%d/%m/%Y')
      END as fecha_legible
    FROM cita c
    LEFT JOIN usuarios u ON c.cliente_id = u.id
    LEFT JOIN mascota m ON c.mascota_id = m.id
    LEFT JOIN servicio s ON c.servicio_id = s.id
    LEFT JOIN sucursal suc ON c.sucursal_id = suc.id
    ORDER BY c.fecha DESC, c.hora DESC
    LIMIT ?
  `;

  db.query(query, [limite], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener actividad reciente:', err);
      return res.status(500).json({ error: 'Error al obtener actividad' });
    }

    console.log(`✅ ${results.length} actividades recientes obtenidas`);
    res.json(results);
  });
};

// ==================== DASHBOARD COMPLETO ====================

export const obtenerDashboardCompleto = (req, res) => {
  // Query para obtener todo en una sola consulta
  const queries = {
    estadisticas: `
      SELECT 
        (SELECT COUNT(*) FROM cita) as total_citas,
        (SELECT COUNT(*) FROM cita WHERE estado = 'pendiente') as citas_pendientes,
        (SELECT COUNT(*) FROM cita WHERE estado = 'confirmada') as citas_confirmadas,
        (SELECT COUNT(*) FROM cita WHERE estado = 'completada') as citas_completadas,
        (SELECT COUNT(*) FROM cita WHERE estado = 'cancelada') as citas_canceladas,
        (SELECT COUNT(*) FROM cita WHERE fecha = CURDATE()) as citas_hoy,
        (SELECT COUNT(*) FROM mascota) as total_mascotas,
        (SELECT COUNT(*) FROM cliente) as total_clientes,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') as usuarios_cliente,
        (SELECT COUNT(*) FROM servicio) as total_servicios
    `,
    topClientes: `
      SELECT 
        u.id, u.nombre, u.email,
        COUNT(c.id) as total_citas,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) as citas_completadas
      FROM usuarios u
      LEFT JOIN cita c ON u.id = c.cliente_id
      WHERE u.rol = 'cliente'
      GROUP BY u.id, u.nombre, u.email
      HAVING total_citas > 0
      ORDER BY total_citas DESC
      LIMIT 5
    `,
    serviciosPopulares: `
      SELECT 
        s.nombre,
        COUNT(c.id) as total_solicitudes,
        COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas
      FROM servicio s
      LEFT JOIN cita c ON s.id = c.servicio_id
      GROUP BY s.id, s.nombre
      ORDER BY total_solicitudes DESC
      LIMIT 5
    `
  };

  // Ejecutar todas las queries en paralelo
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.estadisticas, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.topClientes, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.serviciosPopulares, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
  .then(([estadisticas, topClientes, serviciosPopulares]) => {
    console.log('✅ Dashboard completo obtenido');
    res.json({
      estadisticas,
      topClientes,
      serviciosPopulares,
      timestamp: new Date().toISOString()
    });
  })
  .catch(error => {
    console.error('❌ Error al obtener dashboard completo:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  });
};