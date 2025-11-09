// /routes/citaRoutes.js - AJUSTADO PARA FUNCIONAR CON EL NUEVO INDEX.JS
import express from 'express';
import { 
  obtenerCitas, 
  obtenerCitasPorCliente,
  obtenerCitaPorId,
  crearCita, 
  actualizarCita,
  eliminarCita,
  obtenerEstadisticasCitas,
  obtenerCitasPorFecha,
  actualizarCitasPasadasManual,
  actualizarCitasPasadasPorCliente
} from '../controllers/citaController.js';

const router = express.Router();

// ==================== MIDDLEWARE DE DEBUGGING ====================
if (process.env.NODE_ENV !== 'production') {
  router.use((req, res, next) => {
    console.log('\n=== CITAS ROUTES DEBUG ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Método:', req.method);
    console.log('URL completa:', req.originalUrl);
    console.log('Parámetros:', req.params);
    console.log('Query:', req.query);
    console.log('========================\n');
    next();
  });
}

// ==================== RUTAS DE PRUEBA ====================
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Rutas de citas funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/citas - Obtener todas las citas',
      'GET /api/citas/:id - Obtener cita por ID',
      'GET /api/citas/cliente/:cliente_id - Obtener citas por cliente',
      'GET /api/citas/fecha/:fecha - Obtener citas por fecha',
      'GET /api/citas/estadisticas/:cliente_id - Obtener estadísticas',
      'POST /api/citas - Crear nueva cita',
      'POST /api/citas/actualizar-pasadas - Actualizar citas pasadas',
      'POST /api/citas/actualizar-cliente/:clienteId - Actualizar citas de cliente',
      'PUT /api/citas/:id - Actualizar cita',
      'PATCH /api/citas/:id - Actualizar cita parcial',
      'DELETE /api/citas/:id - Eliminar cita'
    ]
  });
});

// ==================== RUTAS ESPECÍFICAS (GET) ====================
// NOTA: Ya no llevan /citas porque index.js ya lo agrega

// Obtener estadísticas de citas por cliente
router.get('/estadisticas/:cliente_id', obtenerEstadisticasCitas);

// Obtener citas por cliente
router.get('/cliente/:usuario_id', obtenerCitasPorCliente);

// Obtener citas por fecha
router.get('/fecha/:fecha', obtenerCitasPorFecha);

// ==================== RUTAS GENERALES (GET) ====================

// Obtener todas las citas
router.get('/', obtenerCitas);

// Obtener una cita por ID (ÚLTIMA, para no capturar las anteriores)
router.get('/:id', obtenerCitaPorId);

// ==================== RUTAS POST ====================

// Actualizar manualmente todas las citas pasadas
router.post('/actualizar-pasadas', actualizarCitasPasadasManual);

// Actualizar citas pasadas de un cliente específico
router.post('/actualizar-cliente/:clienteId', actualizarCitasPasadasPorCliente);

// Crear una nueva cita
router.post('/', crearCita);

// ==================== RUTAS PUT/PATCH ====================

// Actualizar una cita (completa)
router.put('/:id', actualizarCita);

// Actualizar una cita (parcial)
router.patch('/:id', actualizarCita);

// ==================== RUTAS DELETE ====================

// Eliminar una cita
router.delete('/:id', eliminarCita);

export default router;