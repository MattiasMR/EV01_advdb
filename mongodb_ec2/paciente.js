// paciente.js
require('dotenv').config();
const { connect } = require('./db');
const { v4: uuidv4 } = require('uuid');

const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';

exports.createPaciente = async (req, res) => {
  try {
    const { idTutor, nombre, especie, raza, sexo } = req.body;
    
    if (!idTutor) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta tutor del paciente' 
      });
    }
    if (!nombre) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta nombre del paciente' 
      });
    }
    if (!especie) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta especie del paciente' 
      });
    }
    if (!raza) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta raza del paciente' 
      });
    }
    if (!sexo) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Falta sexo del paciente' 
      });
    }

    const db = await connect();
    
    // Verificar que el tutor existe
    const tutor = await db.collection(TUTORTABLE).findOne({ idTutor });
    if (!tutor) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Tutor no encontrado' 
      });
    }

    const idPaciente = uuidv4();
    await db.collection(PACIENTETABLE).insertOne({
      idPaciente, 
      idTutor, 
      nombre,
      especie, 
      raza, 
      sexo
    });

    res.status(201).json({ 
      ok: true,
      message: 'Paciente Creado', 
      data: { idPaciente, nombre, especie, raza, sexo, tutor: tutor.nombre }
    });
  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.getPacientes = async (req, res) => {
  try {
    const db = await connect();
    const items = await db.collection(PACIENTETABLE).find().toArray();
    
    res.json({ 
      ok: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.getPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    const paciente = await db.collection(PACIENTETABLE).findOne({ idPaciente: id });
    
    if (!paciente) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Paciente no encontrado' 
      });
    }

    // Obtener datos del tutor
    const tutor = await db.collection(TUTORTABLE).findOne({ idTutor: paciente.idTutor });

    res.json({ 
      ok: true,
      data: {
        ...paciente,
        tutor: tutor ? tutor.nombre : 'No encontrado'
      }
    });
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

exports.updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, especie, raza, sexo } = req.body;
    
    const db = await connect();
    const result = await db.collection(PACIENTETABLE).updateOne(
      { idPaciente: id },
      { $set: { nombre, especie, raza, sexo } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Paciente no encontrado' 
      });
    }

    const updatedPaciente = await db.collection(PACIENTETABLE).findOne({ idPaciente: id });
    
    res.json({ 
      ok: true,
      message: 'Paciente actualizado exitosamente',
      data: updatedPaciente
    });
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};
