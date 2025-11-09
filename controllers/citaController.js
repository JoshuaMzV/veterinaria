// /controllers/citaController.js
import * as Cita from '../models/cita.js';

// Obtener todas las citas
export const obtenerCitas = (req, res) => {
  Cita.obtenerCitas((err, resultados) => {
    if (err) {
      console.error('Error al obtener citas:', err);
      return res.status(500).json({ error: 'Error al obtener las citas' });
    }
    res.json(resultados);
  });
};

// Obtener citas por cliente
export const obtenerCitasPorCliente = (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de cliente requerido' });
  }

  Cita.obtenerCitasPorCliente(usuario_id, (err, resultados) => {
    if (err) {
      console.error('Error al obtener citas del cliente:', err);
      return res.status(500).json({ error: 'Error al obtener las citas del cliente' });
    }
    res.json(resultados);
  });
};

// Obtener una cita por ID
export const obtenerCitaPorId = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de cita requerido' });
  }

  Cita.obtenerCitaPorId(id, (err, resultado) => {
    if (err) {
      console.error('Error al obtener cita:', err);
      return res.status(500).json({ error: 'Error al obtener la cita' });
    }
    
    if (!resultado) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json(resultado);
  });
};

// Crear nueva cita con validaciones
export const crearCita = (req, res) => {
  const { 
    cliente_id, 
    mascota_id, 
    servicio_id, 
    sucursal_id,
    fecha, 
    hora, 
    estado ,
    motivo,
    observaciones
  } = req.body;

  console.log('Datos recibidos para crear cita:', {
    cliente_id, mascota_id, servicio_id, sucursal_id, fecha, hora, motivo, observaciones
  });

  // Validar campos requeridos
  if (!cliente_id || !mascota_id || !servicio_id || !sucursal_id || !fecha || !hora) {
    return res.status(400).json({ 
      error: 'Los campos cliente_id, mascota_id, servicio_id, sucursal_id, fecha y hora son requeridos',
      received: { cliente_id, mascota_id, servicio_id, sucursal_id, fecha, hora }
    });
  }

  // Validar formato de fecha
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha)) {
    return res.status(400).json({ 
      error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
    });
  }

  // Validar formato de hora
  const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!horaRegex.test(hora)) {
    return res.status(400).json({ 
      error: 'Formato de hora inválido. Use HH:MM' 
    });
  }

  // Validar que la fecha no sea en el pasado
  const fechaCita = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (fechaCita < hoy) {
    return res.status(400).json({ 
      error: 'No se pueden agendar citas en fechas pasadas' 
    });
  }

  // Función para ejecutar validaciones en cascada
  const validaciones = [
    // Verificar que la mascota pertenezca al cliente
    (callback) => {
      Cita.verificarMascotaCliente(mascota_id, cliente_id, (err, pertenece) => {
        if (err) return callback(err);
        if (!pertenece) {
          return callback(new Error('La mascota no pertenece al cliente especificado'));
        }
        callback(null);
      });
    },
    
    // Verificar que existe el servicio
    (callback) => {
      Cita.verificarServicio(servicio_id, (err, existe) => {
        if (err) return callback(err);
        if (!existe) {
          return callback(new Error('El servicio especificado no existe'));
        }
        callback(null);
      });
    },
    
    // Verificar que existe la sucursal
    (callback) => {
      Cita.verificarSucursal(sucursal_id, (err, existe) => {
        if (err) return callback(err);
        if (!existe) {
          return callback(new Error('La sucursal especificada no existe'));
        }
        callback(null);
      });
    },
    
    // Verificar disponibilidad de horario
    (callback) => {
      Cita.verificarDisponibilidad(fecha, hora, sucursal_id, (err, disponible) => {
        if (err) return callback(err);
        if (!disponible) {
          return callback(new Error('El horario seleccionado no está disponible en esta sucursal'));
        }
        callback(null);
      });
    }
  ];

  // Ejecutar validaciones secuencialmente
  let validacionIndex = 0;
  
  function ejecutarSiguienteValidacion(err) {
    if (err) {
      console.error('Error en validación:', err.message);
      return res.status(400).json({ error: err.message });
    }
    
    if (validacionIndex >= validaciones.length) {
      // Todas las validaciones pasaron, crear la cita
      crearCitaFinal();
      return;
    }
    
    validaciones[validacionIndex](ejecutarSiguienteValidacion);
    validacionIndex++;
  }
  
  function crearCitaFinal() {
    const datosCita = {
      cliente_id: parseInt(cliente_id),
      mascota_id: parseInt(mascota_id),
      servicio_id: parseInt(servicio_id),
      sucursal_id: parseInt(sucursal_id),
      fecha,
      hora,
      estado: estado || 'pendiente',
      motivo,
      observaciones
    };

    Cita.crearCita(datosCita, (err, result) => {
      if (err) {
        console.error('Error al crear cita:', err);
        return res.status(500).json({ error: 'Error al crear la cita' });
      }
      
      // Obtener la cita creada con todos los datos
      Cita.obtenerCitaPorId(result.insertId, (err, citaCreada) => {
        if (err) {
          console.error('Error al obtener cita creada:', err);
          return res.status(201).json({ 
            message: 'Cita creada exitosamente', 
            data: { id: result.insertId, ...datosCita } 
          });
        }
        
        res.status(201).json({ 
          message: 'Cita creada exitosamente', 
          data: citaCreada 
        });
      });
    });
  }
  
  // Iniciar validaciones
  ejecutarSiguienteValidacion();
};

// Actualizar cita
export const actualizarCita = (req, res) => {
  const { id } = req.params;
  const datosActualizar = req.body;

  console.log('Actualizando cita ID:', id, 'con datos:', datosActualizar);

  if (!id) {
    return res.status(400).json({ error: 'ID de cita requerido' });
  }

  // Verificar que la cita existe
  Cita.obtenerCitaPorId(id, (err, citaExistente) => {
    if (err) {
      console.error('Error al verificar cita:', err);
      return res.status(500).json({ error: 'Error al verificar la cita' });
    }

    if (!citaExistente) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // No permitir modificar citas completadas, salvo que se envíe `force: true` (uso administrativo)
    if (citaExistente.estado === 'completada') {
      // Aceptar si viene force=true en el body o si la petición viene con cabecera administrativa
      const hasForce = datosActualizar && (datosActualizar.force === true || datosActualizar.force === 'true');
      const isAdminHeader = req.get('X-Admin') === '1' || req.get('X-Admin') === 'true' || (req.get('Referer') || '').includes('/admin');
      if (!(hasForce || isAdminHeader)) {
        return res.status(400).json({ 
          error: 'No se puede modificar una cita completada (usar force=true o cabecera X-Admin)'
        });
      }
      // eliminar flag force para evitar persistirlo
      if (datosActualizar && datosActualizar.force) delete datosActualizar.force;
    }

    // No permitir modificar citas confirmadas (solo cancelar o cambiar estado administrativamente)
    if (citaExistente.estado === 'confirmada' && datosActualizar.estado && datosActualizar.estado !== 'cancelada') {
      const isAdminRequest = req.get('X-Admin') === '1' || req.get('X-Admin') === 'true' || (req.get('Referer') || '').includes('/admin');
      const hasForce = datosActualizar && (datosActualizar.force === true || datosActualizar.force === 'true');
      
      if (!(isAdminRequest || hasForce)) {
        return res.status(400).json({ 
          error: 'No se puede modificar una cita confirmada, solo se puede cancelar' 
        });
      }
    }

    // Validar fecha si se está actualizando
    if (datosActualizar.fecha) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(datosActualizar.fecha)) {
        return res.status(400).json({ 
          error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
        });
      }

      const fechaCita = new Date(datosActualizar.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaCita < hoy && datosActualizar.estado !== 'cancelada') {
        return res.status(400).json({ 
          error: 'No se pueden agendar citas en fechas pasadas' 
        });
      }
    }

    // Validar hora si se está actualizando
    if (datosActualizar.hora) {
      const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!horaRegex.test(datosActualizar.hora)) {
        return res.status(400).json({ 
          error: 'Formato de hora inválido. Use HH:MM:SS' 
        });
      }
    }

    const fechaFormateada = new Date(citaExistente.fecha).toISOString().split('T')[0];
    // Si se está cambiando fecha u hora, verificar disponibilidad
    if ((datosActualizar.fecha && datosActualizar.fecha !== fechaFormateada) || (datosActualizar.hora && datosActualizar.hora !== citaExistente.hora)) {
      
      const fechaFinal = datosActualizar.fecha || fechaFormateada;
      const horaFinal = datosActualizar.hora || citaExistente.hora;
      const sucursalFinal = datosActualizar.sucursal_id || citaExistente.sucursal_id;
      
      Cita.verificarDisponibilidad(fechaFinal, horaFinal, sucursalFinal, (err, disponible) => {
        if (err) {
          console.error('Error al verificar disponibilidad:', err);
          return res.status(500).json({ error: 'Error al verificar disponibilidad' });
        }

        if (!disponible) {
          return res.status(409).json({ 
            error: 'El nuevo horario seleccionado no está disponible '+fechaFormateada+'-'+citaExistente.hora
          });
        }

        procederConActualizacion();
      });
    } else {
      procederConActualizacion();
    }

    function procederConActualizacion() {
      Cita.actualizarCita(id, datosActualizar, (err, result) => {
        if (err) {
          console.error('Error al actualizar cita:', err);
          return res.status(500).json({ error: 'Error al actualizar la cita' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Cita no encontrada' });
        }

        // Obtener la cita actualizada
        Cita.obtenerCitaPorId(id, (err, citaActualizada) => {
          if (err) {
            console.error('Error al obtener cita actualizada:', err);
            return res.status(200).json({ 
              message: 'Cita actualizada exitosamente' 
            });
          }
          
          res.json({ 
            message: 'Cita actualizada exitosamente', 
            data: citaActualizada 
          });
        });
      });
    }
  });
};

// Eliminar cita
export const eliminarCita = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID de cita requerido' });
  }

  // Verificar que la cita existe
  Cita.obtenerCitaPorId(id, (err, cita) => {
    if (err) {
      console.error('Error al verificar cita:', err);
      return res.status(500).json({ error: 'Error al verificar la cita' });
    }

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // No permitir eliminar citas confirmadas o completadas (solo cancelar)
    if (cita.estado === 'confirmada' || cita.estado === 'completada') {
      return res.status(400).json({ 
        error: 'No se pueden eliminar citas confirmadas o completadas. Usa cancelar en su lugar.' 
      });
    }

    Cita.eliminarCita(id, (err, result) => {
      if (err) {
        console.error('Error al eliminar cita:', err);
        return res.status(500).json({ error: 'Error al eliminar la cita' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      res.json({ message: 'Cita eliminada exitosamente' });
    });
  });
};

// Obtener estadísticas de citas por cliente
export const obtenerEstadisticasCitas = (req, res) => {
  const { cliente_id } = req.params;

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de cliente requerido' });
  }

  Cita.obtenerEstadisticasPorCliente(cliente_id, (err, estadisticas) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
    
    res.json(estadisticas);
  });
};

// Obtener citas por fecha
export const obtenerCitasPorFecha = (req, res) => {
  const { fecha } = req.params;

  if (!fecha) {
    return res.status(400).json({ error: 'Fecha requerida' });
  }

  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha)) {
    return res.status(400).json({ 
      error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
    });
  }

  Cita.obtenerCitasPorFecha(fecha, (err, resultados) => {
    if (err) {
      console.error('Error al obtener citas por fecha:', err);
      return res.status(500).json({ error: 'Error al obtener citas por fecha' });
    }
    
    res.json(resultados);
  });
};


export const actualizarCitasPasadasManual = (req, res) => {
  console.log('Ejecutando actualización manual de citas pasadas...');
  
  Cita.actualizarCitasPasadas((err, result) => {
    if (err) {
      console.error('Error al actualizar citas pasadas:', err);
      return res.status(500).json({ error: 'Error al actualizar citas' });
    }
    
    res.json({ 
      message: 'Citas actualizadas exitosamente',
      citasActualizadas: result.affectedRows,
      timestamp: new Date()
    });
  });
};

export const actualizarCitasPasadasPorCliente = (req, res) => {
  const { clienteId } = req.params;
  
  if (!clienteId) {
    return res.status(400).json({ 
      error: 'ID de cliente requerido' 
    });
  }
  
  console.log(`Actualizando citas pasadas del cliente ${clienteId}...`);
  
  Cita.actualizarCitasPasadasPorCliente(clienteId, (err, result) => {
    if (err) {
      console.error(`Error al actualizar citas del cliente ${clienteId}:`, err);
      return res.status(500).json({ 
        error: 'Error al actualizar citas del cliente' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Citas del cliente actualizadas exitosamente',
      citasActualizadas: result.affectedRows,
      clienteId: parseInt(clienteId),
      timestamp: new Date()
    });
  });
};