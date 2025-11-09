// routes/usuariosRoutes.js - Rutas completas para gestión de usuarios
import express from 'express';
import { 
  loginUsuario, 
  registrarUsuario,
  obtenerTodosUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  obtenerPerfil,
  actualizarPerfil
} from '../controllers/usuariosController.js';

const router = express.Router();

// ==================== RUTAS PÚBLICAS ====================
// IMPORTANTE: Estas rutas se acceden como /api/login y /api/registro
// porque en app.js se usa: app.use('/api', usuariosRoutes)

// Login
router.post('/login', loginUsuario);

// Registro
router.post('/registro', registrarUsuario);

// ==================== RUTAS DE ADMINISTRACIÓN ====================
// Estas rutas se acceden como /api/usuarios, /api/usuarios/:id, etc.

// Obtener todos los usuarios
router.get('/usuarios', obtenerTodosUsuarios);

// Obtener usuario por ID
// PERFIL: obtener/actualizar el perfil del usuario autenticado (simple)
router.get('/usuarios/perfil', obtenerPerfil);
router.put('/usuarios/perfil', actualizarPerfil);

// Obtener usuario por ID
router.get('/usuarios/:id', obtenerUsuarioPorId);

// Crear nuevo usuario (admin)
router.post('/usuarios', registrarUsuario);

// Actualizar usuario
router.put('/usuarios/:id', actualizarUsuario);

// Eliminar usuario
router.delete('/usuarios/:id', eliminarUsuario);

export default router;