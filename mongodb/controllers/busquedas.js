require('dotenv').config();
const { getDB } = require('../app');

const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';
const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';


exports.fichaClinicaPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    
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

    const tutorData = await db.collection(TUTORTABLE)
      .findOne({ idTutor: fichas[0]?.idTutor }, { projection: { nombre: 1 } });

    const vacunasSet = new Set();
    fichas.forEach(f => {
      (f.vacunas || []).forEach(v => vacunasSet.add(v));
    });

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


exports.rankingProcedimientos = async (req, res) => {
  try {
    const limit = Number(req.query.top) || 5;
    const stats = {};
    const db = await getDB();

    const fichas = await db.collection(FICHACLINICATABLE)
      .find({}, { projection: { procedimientos: 1 } })
      .toArray();

    fichas.forEach(({ procedimientos = [] }) => {
      procedimientos.forEach(({ procedimiento, costo = 0 }) => {
        if (procedimiento) { 
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


exports.vacunasPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();
    
    const fichas = await db.collection(FICHACLINICATABLE)
      .find({ idPaciente: id }, { projection: { vacunas: 1 } })
      .toArray();

    const set = new Set();
    fichas.forEach(f => (f.vacunas || []).forEach(v => set.add(v)));

    res.json([...set]);

  } catch (error) {
    console.error('Error en vacunasPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



exports.historialPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();

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

    const idTutor = fichas[0]?.idTutor;
    const tutorData = await db.collection(TUTORTABLE)
      .findOne({ idTutor: idTutor }, { projection: { nombre: 1 } });

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
