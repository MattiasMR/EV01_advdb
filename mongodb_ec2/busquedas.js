// busquedas.js - Lógica exacta de DynamoDB en MongoDB
require('dotenv').config();
const { connect } = require('./db');

const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';
const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';

/* ------------------------------------------------------------------
 * 1) FICHA CLINICA DE UNA MASCOTA - LÓGICA EXACTA DE DYNAMODB
 *    - Ficha médica completa con datos clásicos de revisión médica
 *    - Incluye peso, presión, temperatura, fechaHora, médico
 *    - Vacunas, procedimientos con medicamentos
 *    GET /paciente/{id}/fichaClinica
 * -----------------------------------------------------------------*/

exports.fichaClinicaPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    
    // Query equivalente a DynamoDB - ordenado por fechaHora descendente
    const fichas = await db.collection(FICHACLINICATABLE)
      .find({ idPaciente: id })
      .sort({ fechaHora: -1 })
      .toArray();

    if (fichas.length === 0) {
      return res.json({
        idPaciente: id,
        idTutor: null,
        nombreTutor: null,
        vacunasAplicadas: [],
        revisiones: []
      });
    }

    // Obtener información del tutor - equivalente a DynamoDB get
    const tutorData = await db.collection(TUTORTABLE)
      .findOne({ idTutor: fichas[0]?.idTutor }, { projection: { nombre: 1 } });

    // Reunir todas las vacunas aplicadas - LÓGICA EXACTA
    const vacunasSet = new Set();
    fichas.forEach(f => {
      (f.vacunas || []).forEach(v => vacunasSet.add(v));
    });

    // Procesar revisiones - ESTRUCTURA EXACTA DE DYNAMODB
    const revisiones = fichas.map(f => ({
      fechaHora: f.fechaHora,
      datosPaciente: {
        pesoKg: f.pesoKg,
        presion: f.presion,
        tempC: f.tempC
      },
      costoConsulta: f.costoConsulta,
      procedimientos: f.procedimientos || []
    }));

    res.json({
      idPaciente: id,
      idTutor: fichas[0]?.idTutor,
      nombreTutor: tutorData?.nombre || null,
      vacunasAplicadas: [...vacunasSet],
      revisiones: revisiones
    });

  } catch (error) {
    console.error('Error en fichaClinicaPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ------------------------------------------------------------------
 * 2) RANKING DE PROCEDIMIENTOS - LÓGICA EXACTA DE DYNAMODB
 *    - Agrega en memoria equivalente a como DynamoDB hace GROUP BY
 *    - Usa el mismo algoritmo de scan y agregación
 *    GET /procedimientos/ranking?top=5
 * -----------------------------------------------------------------*/
exports.rankingProcedimientos = async (req, res) => {
  try {
    const limit = Number(req.query.top) || 5;
    const stats = {};
    const db = await connect();

    // Equivalente al scan de DynamoDB con ProjectionExpression
    const fichas = await db.collection(FICHACLINICATABLE)
      .find({}, { projection: { procedimientos: 1 } })
      .toArray();

    // MISMA LÓGICA QUE DYNAMODB - agregación en memoria
    fichas.forEach(({ procedimientos = [] }) => {
      procedimientos.forEach(({ procedimiento, costo = 0 }) => {
        if (procedimiento) { // Filtrar valores null/undefined
          if (!stats[procedimiento]) stats[procedimiento] = { total: 0, gasto: 0 };
          stats[procedimiento].total += 1;
          stats[procedimiento].gasto += costo;
        }
      });
    });

    const ranking = Object.entries(stats)
      .map(([nombre, { total, gasto }]) => ({ procedimiento: nombre, total, gasto }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    res.json(ranking);

  } catch (error) {
    console.error('Error en rankingProcedimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ------------------------------------------------------------------
 * 3) VACUNAS AL DÍA DEL PACIENTE - LÓGICA EXACTA DE DYNAMODB
 *    - Devuelve conjunto único de vacunas aplicadas (strings simples)
 *    GET /paciente/{id}/vacunas
 * -----------------------------------------------------------------*/
exports.vacunasPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();
    
    // Query equivalente a DynamoDB con ProjectionExpression
    const fichas = await db.collection(FICHACLINICATABLE)
      .find({ idPaciente: id }, { projection: { vacunas: 1 } })
      .toArray();

    // MISMA LÓGICA QUE DYNAMODB
    const set = new Set();
    fichas.forEach(f => (f.vacunas || []).forEach(v => set.add(v)));

    res.json([...set]);

  } catch (error) {
    console.error('Error en vacunasPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ------------------------------------------------------------------
 * 4) HISTORIAL DEL PACIENTE - LÓGICA EXACTA DE DYNAMODB  
 *    - Devuelve tanto el listado de todos los procedimientos y consultas médicas del paciente, como el costo pagado por el tutor de cada una
 *    GET /paciente/{id}/historial
 * -----------------------------------------------------------------*/

exports.historialPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connect();

    // Query equivalente a DynamoDB con ProjectionExpression y orden descendente
    const fichas = await db.collection(FICHACLINICATABLE)
      .find(
        { idPaciente: id },
        { projection: { idTutor: 1, fechaHora: 1, costoConsulta: 1, procedimientos: 1 } }
      )
      .sort({ fechaHora: -1 })
      .toArray();

    if (fichas.length === 0) {
      return res.json({
        idPaciente: id,
        idTutor: null,
        nombreTutor: null,
        procedimientosRealizados: [],
        consultas: []
      });
    }

    // Obtener información del tutor - equivalente a DynamoDB get
    const idTutor = fichas[0]?.idTutor;
    const tutorData = await db.collection(TUTORTABLE)
      .findOne({ idTutor: idTutor }, { projection: { nombre: 1 } });

    // Crear set de procedimientos únicos - LÓGICA EXACTA
    const procedimientosSet = new Set();
    
    // Procesar consultas con costos separados - ESTRUCTURA EXACTA DE DYNAMODB
    const consultas = [];
    
    fichas.forEach(f => {
      // Agregar entrada para el costo de consulta
      consultas.push({
        fechaHora: f.fechaHora,
        tipo: 'Consulta',
        descripcion: 'Costo base de consulta médica',
        costo: f.costoConsulta
      });

      // Agregar entradas para cada procedimiento
      (f.procedimientos || []).forEach(proc => {
        procedimientosSet.add(proc.procedimiento);
        
        const medicosInfo = proc.medicosAsignados.map(m => 
          `${m.nombre} (${m.especialidad})`
        ).join(', ');

        consultas.push({
          fechaHora: f.fechaHora,
          tipo: 'Procedimiento',
          descripcion: proc.procedimiento,
          costo: proc.costo,
          medicamentos: proc.medicamentos,
          medicos: medicosInfo
        });
      });
    });

    res.json({
      idPaciente: id,
      idTutor: idTutor,
      nombreTutor: tutorData?.nombre || null,
      procedimientosRealizados: [...procedimientosSet],
      consultas: consultas
    });

  } catch (error) {
    console.error('Error en historialPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
