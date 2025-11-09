import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import departamentoRoutes from './routes/departamentoRoutes.js';
import municipioRoutes from './routes/municipioRoutes.js';
import zonaRoutes from './routes/zonaRoutes.js';
import sucursalRoutes from './routes/sucursalRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import servicioRoutes from './routes/servicioRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clienteRouter from './routes/clienteRoutes.js'
import clienteActividadRouter from './routes/clienteActividadRoutes.js'

import routes from './routes/index.js';

import mascotaRoutes from './routes/mascotaRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import { iniciarScheduler } from './services/citaScheduler.js';

// Cargar variables de entorno PRIMERO
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARES ====================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================

app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Servidor funcionando correctamente', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ==================== API ROUTES ====================
// ORDEN CRÍTICO: Rutas más específicas PRIMERO, genéricas ÚLTIMO

app.use('/api/admin', adminRoutes);
// 1. Usuarios (muy específica con /usuarios/perfil)
app.use('/api', usuariosRoutes);
// 2. Administración (más específica)
app.use('/api', routes);

// 4. Mascotas
app.use('/api', mascotaRoutes);

// 5. Servicios y Sucursales (manejan sus propios prefijos internos)
app.use('/api', servicioRoutes);   // Maneja /servicios/*, /sucursales/:id/horarios, etc.
app.use('/api', sucursalRoutes);   // Maneja /sucursales/* (filtros, búsqueda por ID)

// 6. Geolocalización (sin parámetros dinámicos)
app.use('/api', departamentoRoutes);
app.use('/api', municipioRoutes);
app.use('/api', zonaRoutes);

app.use('/api', clienteRouter);
app.use('/api', clienteActividadRouter);
// Rutas de reportes
app.use('/api', reportesRoutes);

// ==================== MANEJO DE 404 ====================
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.url);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.url,
    method: req.method,
    mensaje: 'La ruta solicitada no existe en el servidor'
  });
});

// ==================== MANEJO DE ERRORES ====================

app.use((err, req, res, next) => {
  console.error('❌ Error capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ==================== INICIALIZACIÓN ====================

const startServer = async () => {
  try {
    console.log('🕐 Iniciando scheduler de citas...');
    await iniciarScheduler();
    console.log('✅ Scheduler iniciado correctamente');

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('\n📋 Rutas disponibles:');
      console.log('   GET  /api/servicios - Lista todos los servicios');
      console.log('   GET  /api/sucursales - Lista todas las sucursales');
      console.log('   GET  /api/sucursales/filtrar - Filtra sucursales');
      console.log('   GET  /api/sucursales/:id - Obtiene una sucursal');
      console.log('='.repeat(60) + '\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;