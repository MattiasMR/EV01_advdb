require('dotenv').config();
const { connect } = require('../db');
const { v4: uuidv4 } = require('uuid');

const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';

exports.createMedico = async (req, res) => {
  try {
    const { nombre, especialidad, estado = 'ACTIVO' } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta nombre del medico' 
      });
    }
    if (!especialidad) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta especialidad del medico' 
      });
    }

    const db = await connect();
    const idMedico = uuidv4();
    
    await db.execute(`
      INSERT INTO ${MEDICOTABLE} (idMedico, nombre, especialidad, estado) 
      VALUES (?, ?, ?, ?)
    `, [idMedico, nombre, especialidad, estado]);

    res.status(201).json({ 
      ok: true,
      message: 'Medico Creado', 
      data: { idMedico, nombre, especialidad, estado }
    });
  } catch (error) {
    console.error('Error creando médico:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.getMedicos = async (req, res) => {
  try {
    const db = await connect();
    
    const result = await db.execute(`SELECT * FROM ${MEDICOTABLE}`);
    const medicos = result.rows.map(row => ({
      idMedico: row.idmedico.toString(),
      nombre: row.nombre,
      especialidad: row.especialidad,
      estado: row.estado
    }));
    
    res.json({ 
      ok: true,
      data: medicos,
      total: medicos.length
    });
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.getMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    
    const result = await db.execute(`
      SELECT * FROM ${MEDICOTABLE} WHERE idMedico = ?
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    const medico = result.rows[0];
    res.json({ 
      ok: true,
      data: {
        idMedico: medico.idmedico.toString(),
        nombre: medico.nombre,
        especialidad: medico.especialidad,
        estado: medico.estado
      }
    });
  } catch (error) {
    console.error('Error obteniendo médico:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.updateMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, especialidad, estado } = req.body;
    
    const db = await connect();
    
    const existsResult = await db.execute(`
      SELECT idMedico FROM ${MEDICOTABLE} WHERE idMedico = ?
    `, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    await db.execute(`
      UPDATE ${MEDICOTABLE} 
      SET nombre = ?, especialidad = ?, estado = ?
      WHERE idMedico = ?
    `, [nombre, especialidad, estado, id]);

    const updatedResult = await db.execute(`
      SELECT * FROM ${MEDICOTABLE} WHERE idMedico = ?
    `, [id]);
    
    const updatedMedico = updatedResult.rows[0];

    res.json({ 
      ok: true,
      message: 'Médico actualizado exitosamente',
      data: {
        idMedico: updatedMedico.idmedico.toString(),
        nombre: updatedMedico.nombre,
        especialidad: updatedMedico.especialidad,
        estado: updatedMedico.estado
      }
    });
  } catch (error) {
    console.error('Error actualizando médico:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.updateEstadoMedico = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await connect();
    
    const medicoResult = await db.execute(`
      SELECT * FROM ${MEDICOTABLE} WHERE idMedico = ?
    `, [id]);
    
    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    const medico = medicoResult.rows[0];
    
    const nuevoEstado = medico.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    
    await db.execute(`
      UPDATE ${MEDICOTABLE} 
      SET estado = ?
      WHERE idMedico = ?
    `, [nuevoEstado, id]);

    const updatedResult = await db.execute(`
      SELECT * FROM ${MEDICOTABLE} WHERE idMedico = ?
    `, [id]);
    
    const updatedMedico = updatedResult.rows[0];
    
    res.json({ 
      ok: true,
      message: `Médico cambiado a ${nuevoEstado.toLowerCase()} exitosamente`,
      data: {
        idMedico: updatedMedico.idmedico.toString(),
        nombre: updatedMedico.nombre,
        especialidad: updatedMedico.especialidad,
        estado: updatedMedico.estado
      }
    });
  } catch (error) {
    console.error('Error actualizando estado del médico:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};
