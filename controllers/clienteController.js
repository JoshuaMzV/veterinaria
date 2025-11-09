// /controllers/clienteController.js
import * as Cliente from '../models/cliente.js';

// Obtener todos los clientes
export const obtenerClientesController = (req, res) => {
  Cliente.obtenerClientes((err, resultados) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los clientes' });
    }
    res.json(resultados);
  });
};

// Agregar un nuevo cliente
export const agregarClienteController = (req, res) => {
  const { usuario_id } = req.body;

  Cliente.agregarCliente(usuario_id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al agregar el cliente' });
    }
    res.status(201).json({ message: 'Cliente agregado exitosamente', data: result });
  });
};
