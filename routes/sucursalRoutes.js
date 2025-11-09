// routes/sucursalRoutes.js - CORREGIDO
import express from 'express';
import {
  obtenerTodasLasSucursales,
  obtenerSucursalesPorDepartamento,
  obtenerSucursalesPorMunicipio,
  obtenerSucursalPorId
} from '../models/servicios.js';

const router = express.Router();

// ==================== MIDDLEWARE DEBUG ====================
router.use((req, res, next) => {
  console.log(`[SUCURSALES] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== RUTAS ====================
// IMPORTANTE: Estas rutas se montan en /api, así que:
// /sucursales → se accede como /api/sucursales

// ORDEN IMPORTANTE: Rutas específicas primero, luego las genéricas

// Obtener sucursales filtradas (PRIMERO - ruta específica)
router.get('/sucursales/filtrar', (req, res) => {
  try {
    const { departamento_id, municipio_id } = req.query;
    
    console.log('🔍 Filtrar sucursales:', { departamento_id, municipio_id });
    
    if (municipio_id) {
      obtenerSucursalesPorMunicipio(municipio_id, (err, sucursales) => {
        if (err) {
          console.error('❌ Error:', err);
          return res.status(500).json({ error: 'Error al obtener sucursales' });
        }
        console.log(`✅ ${sucursales.length} sucursales en municipio ${municipio_id}`);
        res.status(200).json(sucursales);
      });
    } else if (departamento_id) {
      obtenerSucursalesPorDepartamento(departamento_id, (err, sucursales) => {
        if (err) {
          console.error('❌ Error:', err);
          return res.status(500).json({ error: 'Error al obtener sucursales' });
        }
        console.log(`✅ ${sucursales.length} sucursales en departamento ${departamento_id}`);
        res.status(200).json(sucursales);
      });
    } else {
      obtenerTodasLasSucursales((err, sucursales) => {
        if (err) {
          console.error('❌ Error:', err);
          return res.status(500).json({ error: 'Error al obtener sucursales' });
        }
        console.log(`✅ ${sucursales.length} sucursales (sin filtro)`);
        res.status(200).json(sucursales);
      });
    }
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las sucursales (SEGUNDO)
router.get('/sucursales', (req, res) => {
  try {
    console.log('🏢 Obteniendo todas las sucursales');
    
    obtenerTodasLasSucursales((err, sucursales) => {
      if (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: 'Error al obtener sucursales' });
      }
      
      console.log(`✅ ${sucursales.length} sucursales encontradas`);
      res.status(200).json(sucursales);
    });
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las Horarios Citas
/*router.get('/sucursales/HorasCitas', (req, res) => {
  try {
    console.log('🏢 Obteniendo todas los Horarios Citas');
    
    obtenerTodasLosHorariosCitas((err, horariosCitas) => {
      if (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: 'Error al obtener Horarios Citas' });
      }
      
      console.log(`✅ ${horariosCitas.length} Horarios Citas encontradas`);
      res.status(200).json(horariosCitas);
    });
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});*/

// Obtener sucursal por ID (ÚLTIMO - ruta dinámica)
router.get('/sucursales/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando sucursal:', id);
    
    obtenerSucursalPorId(id, (err, sucursal) => {
      if (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ error: 'Error al obtener sucursal' });
      }
      
      if (!sucursal) {
        console.log('⚠️ Sucursal no encontrada');
        return res.status(404).json({ error: 'Sucursal no encontrada' });
      }
      
      console.log('✅ Sucursal encontrada:', sucursal.nombre);
      res.status(200).json(sucursal);
    });
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

console.log('✅ Rutas de sucursales cargadas correctamente');

export default router;