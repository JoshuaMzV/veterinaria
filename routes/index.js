// routes/index.js - Rutas principales con mascotas y clientes
import express from 'express';
import citaRoutes from './citaRoutes.js';
import clienteActividadRoutes from './clienteActividadRoutes.js';
import db from '../config/db.js';

const router = express.Router();

// ==================== RUTAS DE CITAS ====================
router.use('/citas', citaRoutes);

// ==================== RUTAS DE ACTIVIDAD CLIENTE ====================
router.use('/cliente-actividad', clienteActividadRoutes);

// ==================== RUTAS DE MASCOTAS ====================
router.get('/mascotas', (req, res) => {
  console.log('📋 Obteniendo todas las mascotas...');
  
  const query = `
    SELECT 
      m.*,
      u.nombre as propietario_nombre,
      u.email as propietario_email
    FROM mascota m
    LEFT JOIN usuarios u ON m.cliente_id = u.id
    ORDER BY m.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener mascotas:', err);
      return res.status(500).json({ 
        error: 'Error al obtener mascotas',
        detalles: err.message 
      });
    }
    
    console.log(`✅ ${results.length} mascotas obtenidas`);
    res.json(results);
  });
});

router.get('/mascotas/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      m.*,
      u.nombre as propietario_nombre,
      u.email as propietario_email,
      u.telefono as propietario_telefono
    FROM mascota m
    LEFT JOIN usuarios u ON m.cliente_id = u.id
    WHERE m.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener mascota:', err);
      return res.status(500).json({ 
        error: 'Error al obtener mascota',
        detalles: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    
    res.json(results[0]);
  });
});

// ==================== RUTAS DE CLIENTES ====================
router.get('/clientes', (req, res) => {
  console.log('📋 Obteniendo todos los clientes...');
  
  const query = `
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.telefono,
      u.direccion,
      u.fecha_creacion,
      COUNT(DISTINCT m.id) as total_mascotas,
      COUNT(DISTINCT c.id) as total_citas
    FROM usuarios u
    LEFT JOIN mascota m ON m.cliente_id = u.id
    LEFT JOIN cita c ON c.cliente_id = u.id
    WHERE u.rol = 'cliente'
    GROUP BY u.id, u.nombre, u.email, u.telefono, u.direccion, u.fecha_creacion
    ORDER BY u.fecha_creacion DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener clientes:', err);
      return res.status(500).json({ 
        error: 'Error al obtener clientes',
        detalles: err.message 
      });
    }
    
    console.log(`✅ ${results.length} clientes obtenidos`);
    res.json(results);
  });
});

router.get('/clientes/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      u.*,
      COUNT(DISTINCT m.id) as total_mascotas,
      COUNT(DISTINCT c.id) as total_citas
    FROM usuarios u
    LEFT JOIN mascota m ON m.cliente_id = u.id
    LEFT JOIN cita c ON c.cliente_id = u.id
    WHERE u.id = ? AND u.rol = 'cliente'
    GROUP BY u.id
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener cliente:', err);
      return res.status(500).json({ 
        error: 'Error al obtener cliente',
        detalles: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(results[0]);
  });
});

// ==================== RUTA DE PRUEBA ====================
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Rutas principales funcionando correctamente',
    rutas_disponibles: [
      'GET /api/citas',
      'GET /api/mascotas',
      'GET /api/mascotas/:id',
      'GET /api/clientes',
      'GET /api/clientes/:id',
      'GET /api/cliente-actividad'
    ]
  });
});

export default router;