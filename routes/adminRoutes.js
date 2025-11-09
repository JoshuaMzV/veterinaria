// routes/adminRoutes.js - Rutas para el dashboard de administración
import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// I
// ==================== MIDDLEWARE DE DEBUG ====================
router.use((req, res, next) => {
  console.log(`[ADMIN] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== ESTADÍSTICAS GENERALES ====================
router.get('/estadisticas', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del sistema...');

    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    
    // Primer día del mes actual
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    
    // Primer día del mes anterior
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0];

    // Consultas en paralelo
    const [citasHoy, citasPendientes, citasConfirmadas, completadasMesActual, completadasMesAnterior, usuariosCliente] = await Promise.all([
      // Citas de hoy
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM cita WHERE fecha = ?',
          [fechaHoy],
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      }),
      
      // Citas pendientes
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM cita WHERE estado = "pendiente"',
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      }),
      
      // Citas confirmadas
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM cita WHERE estado = "confirmada"',
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      }),
      
      // Completadas mes actual
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM cita WHERE estado = "completada" AND fecha >= ?',
          [inicioMesActual],
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      }),
      
      // Completadas mes anterior
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM cita WHERE estado = "completada" AND fecha BETWEEN ? AND ?',
          [inicioMesAnterior, finMesAnterior],
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      }),
      
      // Usuarios cliente
      new Promise((resolve, reject) => {
        db.query(
          'SELECT COUNT(*) as total FROM usuarios WHERE rol = "cliente"',
          (err, results) => err ? reject(err) : resolve(results[0].total)
        );
      })
    ]);

    const estadisticas = {
      citas_hoy: citasHoy,
      citas_pendientes: citasPendientes,
      citas_confirmadas: citasConfirmadas,
      completadas_mes_actual: completadasMesActual,
      completadas_mes_anterior: completadasMesAnterior,
      usuarios_cliente: usuariosCliente,
      fecha_consulta: fechaHoy
    };

    console.log('✅ Estadísticas obtenidas:', estadisticas);
    res.json(estadisticas);

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      detalles: error.message 
    });
  }
});

// ==================== ACTIVIDAD RECIENTE ====================
router.get('/actividad-reciente', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    
    console.log(`📋 Obteniendo actividad reciente (límite: ${limite})...`);

    const query = `
      SELECT 
        c.id,
        c.fecha,
        c.hora,
        c.estado,
        u.nombre as cliente_nombre,
        m.nombre as mascota_nombre,
        s.nombre as servicio_nombre,
        DATE_FORMAT(c.fecha, '%d/%m/%Y') as fecha_legible
      FROM cita c
      LEFT JOIN usuarios u ON c.cliente_id = u.id
      LEFT JOIN mascota m ON c.mascota_id = m.id
      LEFT JOIN servicio s ON c.servicio_id = s.id
      ORDER BY c.fecha DESC, c.hora DESC
      LIMIT ?
    `;

    db.query(query, [limite], (err, results) => {
      if (err) {
        console.error('❌ Error al obtener actividad:', err);
        return res.status(500).json({ 
          error: 'Error al obtener actividad reciente',
          detalles: err.message 
        });
      }

      console.log(`✅ ${results.length} actividades obtenidas`);
      res.json(results);
    });

  } catch (error) {
    console.error('❌ Error al obtener actividad reciente:', error);
    res.status(500).json({ 
      error: 'Error al obtener actividad reciente',
      detalles: error.message 
    });
  }
});

// ==================== EXPORTAR ====================
export default router;