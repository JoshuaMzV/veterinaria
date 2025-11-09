// /routes/clienteRoutes.js
import express from 'express';
import { obtenerClientesController, agregarClienteController } from '../controllers/clienteController.js';

const router = express.Router();

// Ruta para obtener todos los clientes
router.get('/clientes', obtenerClientesController);

// Ruta para agregar un nuevo cliente
router.post('/clientes', agregarClienteController);

export default router;
