require('dotenv').config();
const { connect } = require('../db');
const { v4: uuidv4 } = require('uuid');

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';

exports.createTutor = async (req, res) => {
  try {
    const { nombre, email, telefono, direccion } = req.body;
    
    if (!nombre || !email || !telefono) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos requeridos: nombre, email, telefono'
      });
    }

    const db = await connect();
    const idTutor = uuidv4();
    
    await db.execute(`
      INSERT INTO ${TUTORTABLE} (idTutor, nombre, email, telefono, direccion) 
      VALUES (?, ?, ?, ?, ?)
    `, [idTutor, nombre, email, telefono, direccion || null]);

    res.status(201).json({
      ok: true,
      message: 'Tutor creado exitosamente',
      data: { idTutor, nombre, email, telefono, direccion }
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
    
    // En Cassandra necesitamos hacer un scan completo
    const result = await db.execute(`SELECT * FROM ${TUTORTABLE}`);
    const tutores = result.rows.map(row => ({
      idTutor: row.idtutor.toString(),
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      direccion: row.direccion
    }));
    
    tutores.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
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
    
    const result = await db.execute(`
      SELECT * FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Tutor no encontrado'
      });
    }

    const tutor = result.rows[0];
    res.json({
      ok: true,
      data: {
        idTutor: tutor.idtutor.toString(),
        nombre: tutor.nombre,
        email: tutor.email,
        telefono: tutor.telefono,
        direccion: tutor.direccion
      }
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
    const { nombre, email, telefono, direccion } = req.body;
    
    const db = await connect();
    
    const existsResult = await db.execute(`
      SELECT idTutor FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [id]);
    
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Tutor no encontrado'
      });
    }

    await db.execute(`
      UPDATE ${TUTORTABLE} 
      SET nombre = ?, email = ?, telefono = ?, direccion = ?
      WHERE idTutor = ?
    `, [nombre, email, telefono, direccion, id]);

    const updatedResult = await db.execute(`
      SELECT * FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [id]);
    
    const updatedTutor = updatedResult.rows[0];

    res.json({
      ok: true,
      message: 'Tutor actualizado exitosamente',
      data: {
        idTutor: updatedTutor.idtutor.toString(),
        nombre: updatedTutor.nombre,
        email: updatedTutor.email,
        telefono: updatedTutor.telefono,
        direccion: updatedTutor.direccion
      }
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
    const tutorResult = await db.execute(`
      SELECT idTutor FROM ${TUTORTABLE} WHERE idTutor = ?
    `, [id]);
    
    if (tutorResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Tutor no encontrado' 
      });
    }

    const pacientesResult = await db.execute(`
      SELECT idPaciente, nombre, sexo, raza FROM ${PACIENTETABLE} WHERE idTutor = ?
    `, [id]);

    const pacientes = pacientesResult.rows.map(row => ({
      idPaciente: row.idpaciente,
      nombre: row.nombre,
      sexo: row.sexo,
      raza: row.raza
    }));

    res.status(200).json({ 
      ok: true,
      data: pacientes,
      total: pacientes.length
    });
  } catch (error) {
    console.error('Error al obtener pacientes del tutor:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error al ejecutar la consulta para obtener pacientes del tutor' 
    });
  }
};
