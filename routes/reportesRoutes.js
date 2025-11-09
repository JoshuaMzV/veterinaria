// routes/reportesRoutes.js
import express from 'express';
import { resumen, serviciosTop, sucursalesTop, mensual } from '../controllers/reportesController.js';

const router = express.Router();

// GET /api/reportes/resumen
router.get('/reportes/resumen', resumen);

// GET /api/reportes/servicios-top?limit=5
router.get('/reportes/servicios-top', serviciosTop);

// GET /api/reportes/sucursales-top?limit=5
router.get('/reportes/sucursales-top', sucursalesTop);

// GET /api/reportes/mensual?months=6
router.get('/reportes/mensual', mensual);

export default router;
