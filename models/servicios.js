// models/servicios.js - Modelo completo con gestión por sucursal
import db from '../config/db.js';

// ==================== SUCURSALES ====================

export const obtenerTodasLasSucursales = (callback) => {
  const query = `
    SELECT 
      s.id, 
      s.nombre, 
      s.direccion, 
      s.telefono,
      s.municipio_id,
      m.nombre as municipio_nombre,
      m.departamento_id,
      d.nombre as departamento_nombre
    FROM sucursal s
    INNER JOIN municipio m ON s.municipio_id = m.id
    INNER JOIN departamento d ON m.departamento_id = d.id
    ORDER BY d.nombre, m.nombre, s.nombre
  `;
  
  console.log('📋 Ejecutando query: obtener todas las sucursales');
  
  db.query(query, (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerTodasLasSucursales:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} sucursales obtenidas`);
    callback(null, resultados);
  });
};

/*export const obtenerTodasLosHorariosCitas = (callback) => {
  const query = `
    SELECT 
      s.id, 
      s.nombre, 
      s.direccion, 
      s.telefono,
      s.municipio_id,
      m.nombre as municipio_nombre,
      m.departamento_id,
      d.nombre as departamento_nombre
    FROM sucursal s
    INNER JOIN municipio m ON s.municipio_id = m.id
    INNER JOIN departamento d ON m.departamento_id = d.id
    ORDER BY d.nombre, m.nombre, s.nombre
  `;
  
  console.log('📋 Ejecutando query: obtener todas las sucursales');
  
  db.query(query, (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerTodasLasSucursales:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} sucursales obtenidas`);
    callback(null, resultados);
  });
};*/

export const obtenerSucursalesPorDepartamento = (departamentoId, callback) => {
  const query = `
    SELECT 
      s.id, 
      s.nombre, 
      s.direccion, 
      s.telefono,
      s.municipio_id,
      m.nombre as municipio_nombre,
      m.departamento_id,
      d.nombre as departamento_nombre
    FROM sucursal s
    INNER JOIN municipio m ON s.municipio_id = m.id
    INNER JOIN departamento d ON m.departamento_id = d.id
    WHERE m.departamento_id = ?
    ORDER BY m.nombre, s.nombre
  `;
  
  console.log(`📍 Buscando sucursales en departamento ID: ${departamentoId}`);
  
  db.query(query, [departamentoId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerSucursalesPorDepartamento:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} sucursales encontradas en departamento ${departamentoId}`);
    callback(null, resultados);
  });
};

export const obtenerSucursalesPorMunicipio = (municipioId, callback) => {
  const query = `
    SELECT 
      s.id, 
      s.nombre, 
      s.direccion, 
      s.telefono,
      s.municipio_id,
      m.nombre as municipio_nombre,
      m.departamento_id,
      d.nombre as departamento_nombre
    FROM sucursal s
    INNER JOIN municipio m ON s.municipio_id = m.id
    INNER JOIN departamento d ON m.departamento_id = d.id
    WHERE s.municipio_id = ?
    ORDER BY s.nombre
  `;
  
  console.log(`🎯 Buscando sucursales en municipio ID: ${municipioId}`);
  
  db.query(query, [municipioId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerSucursalesPorMunicipio:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} sucursales encontradas en municipio ${municipioId}`);
    callback(null, resultados);
  });
};

export const obtenerSucursalPorId = (id, callback) => {
  const query = `
    SELECT 
      s.*, 
      m.nombre as municipio_nombre,
      m.departamento_id,
      d.nombre as departamento_nombre
    FROM sucursal s
    INNER JOIN municipio m ON s.municipio_id = m.id
    INNER JOIN departamento d ON m.departamento_id = d.id
    WHERE s.id = ?
  `;
  
  console.log(`🔍 Buscando sucursal ID: ${id}`);
  
  db.query(query, [id], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerSucursalPorId:', error);
      return callback(error, null);
    }
    
    if (resultados.length === 0) {
      console.log(`⚠️ Sucursal ID ${id} no encontrada`);
      return callback(null, null);
    }
    
    console.log(`✅ Sucursal encontrada: ${resultados[0].nombre}`);
    callback(null, resultados[0]);
  });
};

// ==================== SERVICIOS (GLOBALES) ====================

export const obtenerTodosLosServicios = (callback) => {
  const query = 'SELECT * FROM servicio ORDER BY activo DESC, nombre ASC';
  
  console.log('📋 Obteniendo todos los servicios');
  
  db.query(query, (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerTodosLosServicios:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} servicios obtenidos`);
    callback(null, resultados);
  });
};

export const obtenerServicioPorId = (id, callback) => {
  const query = 'SELECT * FROM servicio WHERE id = ?';
  
  console.log(`🔍 Buscando servicio ID: ${id}`);
  
  db.query(query, [id], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerServicioPorId:', error);
      return callback(error, null);
    }
    
    if (resultados.length === 0) {
      console.log(`⚠️ Servicio ID ${id} no encontrado`);
      return callback(null, null);
    }
    
    console.log(`✅ Servicio encontrado: ${resultados[0].nombre}`);
    callback(null, resultados[0]);
  });
};

export const crearServicio = (datos, callback) => {
  const query = `
    INSERT INTO servicio 
    (nombre, descripcion, precio, duracion_minutos, activo, icono, color) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    datos.nombre,
    datos.descripcion,
    datos.precio,
    datos.duracion_minutos,
    datos.activo,
    datos.icono,
    datos.color
  ];
  
  console.log('➕ Creando nuevo servicio:', datos.nombre);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en crearServicio:', error);
      return callback(error, null);
    }
    console.log(`✅ Servicio creado con ID: ${resultado.insertId}`);
    callback(null, { id: resultado.insertId, ...datos });
  });
};

export const actualizarServicio = (id, datos, callback) => {
  const fields = Object.keys(datos).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(datos), id];
  const query = `UPDATE servicio SET ${fields} WHERE id = ?`;
  
  console.log(`✏️ Actualizando servicio ID: ${id}`);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en actualizarServicio:', error);
      return callback(error, null);
    }
    console.log(`✅ Servicio ID ${id} actualizado`);
    callback(null, resultado);
  });
};

export const eliminarServicio = (id, callback) => {
  const query = 'DELETE FROM servicio WHERE id = ?';
  
  console.log(`🗑️ Eliminando servicio ID: ${id}`);
  
  db.query(query, [id], (error, resultado) => {
    if (error) {
      console.error('❌ Error en eliminarServicio:', error);
      return callback(error, null);
    }
    console.log(`✅ Servicio ID ${id} eliminado`);
    callback(null, resultado);
  });
};

export const toggleServicio = (id, activo, callback) => {
  const query = 'UPDATE servicio SET activo = ? WHERE id = ?';
  
  console.log(`🔄 Cambiando estado del servicio ID ${id} a: ${activo ? 'activo' : 'inactivo'}`);
  
  db.query(query, [activo, id], (error, resultado) => {
    if (error) {
      console.error('❌ Error en toggleServicio:', error);
      return callback(error, null);
    }
    console.log(`✅ Estado del servicio ID ${id} actualizado`);
    callback(null, resultado);
  });
};

// ==================== HORARIOS DE ATENCIÓN POR SUCURSAL ====================

export const obtenerHorariosPorSucursal = (sucursalId, callback) => {
  const query = `
    SELECT h.*, s.nombre as sucursal_nombre
    FROM horario_atencion h
    INNER JOIN sucursal s ON h.sucursal_id = s.id
    WHERE h.sucursal_id = ?
    ORDER BY FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
  `;
  
  console.log(`⏰ Obteniendo horarios de sucursal ID: ${sucursalId}`);
  
  db.query(query, [sucursalId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerHorariosPorSucursal:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} horarios obtenidos para sucursal ${sucursalId}`);
    callback(null, resultados);
  });
};

export const actualizarHorario = (id, datos, callback) => {
  const fields = Object.keys(datos).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(datos), id];
  const query = `UPDATE horario_atencion SET ${fields}, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = ?`;
  
  console.log(`✏️ Actualizando horario ID: ${id}`);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en actualizarHorario:', error);
      return callback(error, null);
    }
    console.log(`✅ Horario ID ${id} actualizado`);
    callback(null, resultado);
  });
};

export const actualizarHorariosMasivoPorSucursal = (sucursalId, horarios, callback) => {
  console.log(`📝 Actualizando ${horarios.length} horarios de sucursal ID: ${sucursalId}`);
  
  db.beginTransaction((err) => {
    if (err) {
      console.error('❌ Error al iniciar transacción:', err);
      return callback(err);
    }

    let completed = 0;
    let hasError = false;

    horarios.forEach((horario) => {
      const { id, hora_inicio, hora_fin, activo } = horario;
      const query = `
        UPDATE horario_atencion 
        SET hora_inicio = ?, hora_fin = ?, activo = ?, fecha_modificacion = CURRENT_TIMESTAMP 
        WHERE id = ? AND sucursal_id = ?
      `;
      
      db.query(query, [hora_inicio, hora_fin, activo, id, sucursalId], (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error('❌ Error en actualización masiva:', err);
          return db.rollback(() => callback(err));
        }

        completed++;
        if (completed === horarios.length && !hasError) {
          db.commit((err) => {
            if (err) {
              console.error('❌ Error al hacer commit:', err);
              return db.rollback(() => callback(err));
            }
            console.log(`✅ ${completed} horarios actualizados correctamente`);
            callback(null, { updated: completed });
          });
        }
      });
    });
  });
};

export const crearHorariosPorSucursal = (sucursalId, callback) => {
  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const horarioPredeterminado = {
    lunes: { inicio: '08:00:00', fin: '18:00:00', activo: 1 },
    martes: { inicio: '08:00:00', fin: '18:00:00', activo: 1 },
    miercoles: { inicio: '08:00:00', fin: '18:00:00', activo: 1 },
    jueves: { inicio: '08:00:00', fin: '18:00:00', activo: 1 },
    viernes: { inicio: '08:00:00', fin: '18:00:00', activo: 1 },
    sabado: { inicio: '08:00:00', fin: '14:00:00', activo: 1 },
    domingo: { inicio: '00:00:00', fin: '00:00:00', activo: 0 }
  };

  console.log(`➕ Creando horarios predeterminados para sucursal ID: ${sucursalId}`);

  db.beginTransaction((err) => {
    if (err) {
      console.error('❌ Error al iniciar transacción:', err);
      return callback(err);
    }

    let completed = 0;
    let hasError = false;

    diasSemana.forEach((dia) => {
      const config = horarioPredeterminado[dia];
      const query = `
        INSERT INTO horario_atencion (dia_semana, hora_inicio, hora_fin, activo, sucursal_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.query(query, [dia, config.inicio, config.fin, config.activo, sucursalId], (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error('❌ Error al crear horarios:', err);
          return db.rollback(() => callback(err));
        }

        completed++;
        if (completed === diasSemana.length && !hasError) {
          db.commit((err) => {
            if (err) {
              console.error('❌ Error al hacer commit:', err);
              return db.rollback(() => callback(err));
            }
            console.log(`✅ ${completed} horarios creados correctamente`);
            callback(null, { created: completed });
          });
        }
      });
    });
  });
};

// ==================== HORARIOS ESPECIALES POR SUCURSAL ====================

export const obtenerHorariosEspecialesPorSucursal = (sucursalId, callback) => {
  const query = `
    SELECT he.*, s.nombre as sucursal_nombre
    FROM horarios_especiales he
    INNER JOIN sucursal s ON he.sucursal_id = s.id
    WHERE he.sucursal_id = ? AND he.fecha >= CURDATE()
    ORDER BY he.fecha ASC
  `;
  
  console.log(`📅 Obteniendo horarios especiales de sucursal ID: ${sucursalId}`);
  
  db.query(query, [sucursalId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerHorariosEspecialesPorSucursal:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} horarios especiales obtenidos`);
    callback(null, resultados);
  });
};

export const obtenerHorarioEspecialPorFecha = (fecha, sucursalId, callback) => {
  const query = `
    SELECT * FROM horarios_especiales 
    WHERE fecha = ? AND sucursal_id = ?
    LIMIT 1
  `;
  
  console.log(`🔍 Buscando horario especial para fecha: ${fecha}, sucursal: ${sucursalId}`);
  
  db.query(query, [fecha, sucursalId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerHorarioEspecialPorFecha:', error);
      return callback(error, null);
    }
    
    const resultado = resultados.length > 0 ? resultados[0] : null;
    console.log(resultado ? '✅ Horario especial encontrado' : 'ℹ️ No hay horario especial para esa fecha');
    callback(null, resultado);
  });
};

export const crearHorarioEspecial = (datos, callback) => {
  const query = `
    INSERT INTO horarios_especiales 
    (fecha, hora_inicio, hora_fin, descripcion, sucursal_id) 
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    datos.fecha,
    datos.hora_inicio,
    datos.hora_fin,
    datos.descripcion,
    datos.sucursal_id
  ];
  
  console.log(`➕ Creando horario especial para fecha: ${datos.fecha}`);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en crearHorarioEspecial:', error);
      return callback(error, null);
    }
    console.log(`✅ Horario especial creado con ID: ${resultado.insertId}`);
    callback(null, { id: resultado.insertId, ...datos });
  });
};

export const actualizarHorarioEspecial = (id, datos, callback) => {
  const fields = Object.keys(datos).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(datos), id];
  const query = `UPDATE horarios_especiales SET ${fields} WHERE id = ?`;
  
  console.log(`✏️ Actualizando horario especial ID: ${id}`);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en actualizarHorarioEspecial:', error);
      return callback(error, null);
    }
    console.log(`✅ Horario especial ID ${id} actualizado`);
    callback(null, resultado);
  });
};

export const eliminarHorarioEspecial = (id, callback) => {
  const query = 'DELETE FROM horarios_especiales WHERE id = ?';
  
  console.log(`🗑️ Eliminando horario especial ID: ${id}`);
  
  db.query(query, [id], (error, resultado) => {
    if (error) {
      console.error('❌ Error en eliminarHorarioEspecial:', error);
      return callback(error, null);
    }
    console.log(`✅ Horario especial ID ${id} eliminado`);
    callback(null, resultado);
  });
};

// ==================== DÍAS NO LABORABLES POR SUCURSAL ====================

export const obtenerDiasNoLaborablesPorSucursal = (sucursalId, callback) => {
  const query = `
    SELECT dnl.*, s.nombre as sucursal_nombre
    FROM dias_no_laborables dnl
    INNER JOIN sucursal s ON dnl.sucursal_id = s.id
    WHERE dnl.sucursal_id = ? AND dnl.fecha >= CURDATE()
    ORDER BY dnl.fecha ASC
  `;
  
  console.log(`🚫 Obteniendo días no laborables de sucursal ID: ${sucursalId}`);
  
  db.query(query, [sucursalId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en obtenerDiasNoLaborablesPorSucursal:', error);
      return callback(error, null);
    }
    console.log(`✅ ${resultados.length} días no laborables obtenidos`);
    callback(null, resultados);
  });
};

export const verificarDiaNoLaborable = (fecha, sucursalId, callback) => {
  const query = `
    SELECT * FROM dias_no_laborables 
    WHERE fecha = ? AND sucursal_id = ?
    LIMIT 1
  `;
  
  console.log(`🔍 Verificando si ${fecha} es día no laborable en sucursal ${sucursalId}`);
  
  db.query(query, [fecha, sucursalId], (error, resultados) => {
    if (error) {
      console.error('❌ Error en verificarDiaNoLaborable:', error);
      return callback(error, null);
    }
    
    const resultado = resultados.length > 0 ? resultados[0] : null;
    console.log(resultado ? '⚠️ Es día no laborable' : '✅ Es día laborable');
    callback(null, resultado);
  });
};

export const crearDiaNoLaborable = (datos, callback) => {
  const query = `
    INSERT INTO dias_no_laborables 
    (fecha, descripcion, sucursal_id) 
    VALUES (?, ?, ?)
  `;
  const values = [
    datos.fecha,
    datos.descripcion,
    datos.sucursal_id
  ];
  
  console.log(`➕ Creando día no laborable para fecha: ${datos.fecha}`);
  
  db.query(query, values, (error, resultado) => {
    if (error) {
      console.error('❌ Error en crearDiaNoLaborable:', error);
      return callback(error, null);
    }
    console.log(`✅ Día no laborable creado con ID: ${resultado.insertId}`);
    callback(null, { id: resultado.insertId, ...datos });
  });
};

export const eliminarDiaNoLaborable = (id, callback) => {
  const query = 'DELETE FROM dias_no_laborables WHERE id = ?';
  
  console.log(`🗑️ Eliminando día no laborable ID: ${id}`);
  
  db.query(query, [id], (error, resultado) => {
    if (error) {
      console.error('❌ Error en eliminarDiaNoLaborable:', error);
      return callback(error, null);
    }
    console.log(`✅ Día no laborable ID ${id} eliminado`);
    callback(null, resultado);
  });
};