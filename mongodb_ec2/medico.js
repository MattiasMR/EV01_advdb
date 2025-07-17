// medico.js
require('dotenv').config();
const { connect } = require('./db');
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
    
    await db.collection(MEDICOTABLE).insertOne({ 
      idMedico, 
      nombre, 
      especialidad, 
      estado 
    });

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
    const items = await db.collection(MEDICOTABLE).find().toArray();
    
    res.json({ 
      ok: true,
      data: items,
      total: items.length
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
    const item = await db.collection(MEDICOTABLE).findOne({ idMedico: id });
    
    if (!item) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    res.json({ 
      ok: true,
      data: item
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
    const result = await db.collection(MEDICOTABLE).updateOne(
      { idMedico: id },
      { $set: { nombre, especialidad, estado } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    const updatedMedico = await db.collection(MEDICOTABLE).findOne({ idMedico: id });
    
    res.json({ 
      ok: true,
      message: 'Médico actualizado exitosamente',
      data: updatedMedico
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
    const { estado } = req.body;
    
    if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Estado debe ser ACTIVO o INACTIVO' 
      });
    }
    
    const db = await connect();
    const result = await db.collection(MEDICOTABLE).updateOne(
      { idMedico: id },
      { $set: { estado } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Médico no encontrado' 
      });
    }

    const updatedMedico = await db.collection(MEDICOTABLE).findOne({ idMedico: id });
    
    res.json({ 
      ok: true,
      message: `Médico ${estado.toLowerCase()} exitosamente`,
      data: updatedMedico
    });
  } catch (error) {
    console.error('Error actualizando estado del médico:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};
