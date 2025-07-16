// busquedas.js
require('dotenv').config();
const { connect } = require('./db');

const FICHACLINICATABLE = process.env.FICHACLINICATABLE;
const TUTORTABLE = process.env.TUTORTABLE;

exports.fichaClinicaPaciente = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const fichas = await db.collection(FICHACLINICATABLE)
    .find({ idPaciente: id })
    .sort({ fechaHora: -1 })
    .toArray();

  const tutorDoc = await db.collection(TUTORTABLE)
    .findOne({ idTutor: fichas[0]?.idTutor }, { projection: { nombre: 1 } });

  const vacunasSet = new Set();
  fichas.forEach(f => (f.vacunas || []).forEach(v => vacunasSet.add(v)));

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

  return {
    statusCode: 200,
    body: JSON.stringify({
      idPaciente: id,
      idTutor: fichas[0]?.idTutor,
      nombreTutor: tutorDoc?.nombre || null,
      vacunasAplicadas: [...vacunasSet],
      revisiones
    })
  };
};

exports.rankingProcedimientos = async (event) => {
  const limit = Number(event.queryStringParameters?.top) || 5;
  const db = await connect();

  const cursor = db.collection(FICHACLINICATABLE)
    .find({}, { projection: { procedimientos: 1 } });

  const stats = {};
  await cursor.forEach(doc => {
    (doc.procedimientos || []).forEach(proc => {
      const nombre = proc.procedimiento;
      if (!stats[nombre]) stats[nombre] = { total: 0, gasto: 0 };
      stats[nombre].total++;
      stats[nombre].gasto += proc.costo || 0;
    });
  });

  const ranking = Object.entries(stats)
    .map(([procedimiento, { total, gasto }]) => ({ procedimiento, total, gasto }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return {
    statusCode: 200,
    body: JSON.stringify(ranking)
  };
};

exports.vacunasPaciente = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const docs = await db.collection(FICHACLINICATABLE)
    .find({ idPaciente: id }, { projection: { vacunas: 1 } })
    .toArray();

  const set = new Set();
  docs.forEach(doc => (doc.vacunas || []).forEach(v => set.add(v)));

  return {
    statusCode: 200,
    body: JSON.stringify([...set])
  };
};

exports.historialPaciente = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const fichas = await db.collection(FICHACLINICATABLE)
    .find(
      { idPaciente: id },
      { projection: { idTutor: 1, fechaHora: 1, costoConsulta: 1, procedimientos: 1 } }
    )
    .sort({ fechaHora: -1 })
    .toArray();

  const idTutor = fichas[0]?.idTutor;
  const tutorDoc = await db.collection(TUTORTABLE)
    .findOne({ idTutor }, { projection: { nombre: 1 } });

  const procedimientosSet = new Set();
  const consultas = [];

  fichas.forEach(f => {
    consultas.push({
      fechaHora: f.fechaHora,
      tipo: 'Consulta',
      descripcion: 'Costo base de consulta médica',
      costo: f.costoConsulta
    });

    (f.procedimientos || []).forEach(proc => {
      procedimientosSet.add(proc.procedimiento);
      const medicosInfo = (proc.medicosAsignados || [])
        .map(m => `${m.nombre} (${m.especialidad})`)
        .join(', ');
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

  return {
    statusCode: 200,
    body: JSON.stringify({
      idPaciente: id,
      idTutor,
      nombreTutor: tutorDoc?.nombre || null,
      procedimientosRealizados: [...procedimientosSet],
      consultas
    })
  };
};
