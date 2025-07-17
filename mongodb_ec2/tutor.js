// tutor.js
require('dotenv').config();
const { connect } = require('./db');
const { v4: uuidv4 } = require('uuid');

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';

exports.createTutor = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.body;
    
    if (!nombre || !email || !telefono) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos requeridos: nombre, email, telefono'
      });
    }

    const db = await connect();
    const idTutor = uuidv4();
    
    await db.collection(TUTORTABLE).insertOne({
      idTutor,
      nombre,
      email,
      telefono
    });

    res.status(201).json({
      ok: true,
      message: 'Tutor creado exitosamente',
      data: { idTutor, nombre, email, telefono }
    });
  } catch (error) {
    console.error('Error creando tutor:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};

exports.getTutores = async (req, res) => {
  try {
    const db = await connect();
    const tutores = await db.collection(TUTORTABLE).find().sort({ nombre: 1 }).toArray();
    
    res.json({
      ok: true,
      data: tutores,
      total: tutores.length
    });
  } catch (error) {
    console.error('Error obteniendo tutores:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};

exports.getTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const tutor = await db.collection(TUTORTABLE).findOne({ idTutor: id });
    
    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: 'Tutor no encontrado'
      });
    }

    res.json({
      ok: true,
      data: tutor
    });
  } catch (error) {
    console.error('Error obteniendo tutor:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};

exports.updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono } = req.body;
    
    const db = await connect();
    const result = await db.collection(TUTORTABLE).updateOne(
      { idTutor: id },
      { $set: { nombre, email, telefono } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Tutor no encontrado'
      });
    }

    const updatedTutor = await db.collection(TUTORTABLE).findOne({ idTutor: id });

    res.json({
      ok: true,
      message: 'Tutor actualizado exitosamente',
      data: updatedTutor
    });
  } catch (error) {
    console.error('Error actualizando tutor:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};

exports.getPacientesByTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    
    // Verificar que el tutor existe
    const tutor = await db.collection(TUTORTABLE).findOne({ idTutor: id });
    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: 'Tutor no encontrado'
      });
    }

    const pacientes = await db.collection(PACIENTETABLE).find({ idTutor: id }).toArray();
    
    res.json({
      ok: true,
      data: {
        tutor: tutor.nombre,
        pacientes,
        total: pacientes.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo pacientes del tutor:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};
