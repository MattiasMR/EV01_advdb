require('dotenv').config();
const { getClient } = require('../app');
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

    const db = getClient();
    
    const tutorResult = await db.execute(`
      SELECT nombre FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [idTutor]);
    
    if (tutorResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Tutor no encontrado' 
      });
    }

    const idPaciente = uuidv4();
    await db.execute(`
      INSERT INTO ${PACIENTETABLE} (idPaciente, idTutor, nombre, especie, raza, sexo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [idPaciente, idTutor, nombre, especie, raza, sexo]);

    res.status(201).json({ 
      ok: true,
      message: 'Paciente Creado', 
      data: { 
        idPaciente, 
        nombre, 
        especie, 
        raza, 
        sexo, 
        tutor: tutorResult.rows[0].nombre 
      }
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
    const db = getClient();
    
    const result = await db.execute(`SELECT * FROM ${PACIENTETABLE}`);
    const pacientes = result.rows.map(row => ({
      idPaciente: row.idpaciente.toString(),
      idTutor: row.idtutor.toString(),
      nombre: row.nombre,
      especie: row.especie,
      raza: row.raza,
      sexo: row.sexo
    }));
    
    res.json({ 
      ok: true,
      data: pacientes,
      total: pacientes.length
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
    const db = getClient();
    
    const pacienteResult = await db.execute(`
      SELECT * FROM ${PACIENTETABLE} WHERE idPaciente = ?
    `, [id]);
    
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Paciente no encontrado' 
      });
    }

    const paciente = pacienteResult.rows[0];

    const tutorResult = await db.execute(`
      SELECT nombre FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [paciente.idtutor.toString()]);

    res.json({ 
      ok: true,
      data: {
        idPaciente: paciente.idpaciente.toString(),
        idTutor: paciente.idtutor.toString(),
        nombre: paciente.nombre,
        especie: paciente.especie,
        raza: paciente.raza,
        sexo: paciente.sexo,
        tutor: tutorResult.rows.length > 0 ? tutorResult.rows[0].nombre : 'No encontrado'
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
    
    const db = getClient();
    
    const existsResult = await db.execute(`
      SELECT idPaciente FROM ${PACIENTETABLE} WHERE idPaciente = ?
    `, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Paciente no encontrado' 
      });
    }

    await db.execute(`
      UPDATE ${PACIENTETABLE} 
      SET nombre = ?, especie = ?, raza = ?, sexo = ?
      WHERE idPaciente = ?
    `, [nombre, especie, raza, sexo, id]);

    const updatedResult = await db.execute(`
      SELECT * FROM ${PACIENTETABLE} WHERE idPaciente = ?
    `, [id]);
    
    const updatedPaciente = updatedResult.rows[0];

    res.json({ 
      ok: true,
      message: 'Paciente actualizado exitosamente',
      data: {
        idPaciente: updatedPaciente.idpaciente.toString(),
        idTutor: updatedPaciente.idtutor.toString(),
        nombre: updatedPaciente.nombre,
        especie: updatedPaciente.especie,
        raza: updatedPaciente.raza,
        sexo: updatedPaciente.sexo
      }
    });
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};
