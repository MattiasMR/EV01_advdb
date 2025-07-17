require('dotenv').config();
const { getClient } = require('../app');

const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';
const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';


exports.fichaClinicaPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getClient();
    
    const result = await db.execute(`
      SELECT * FROM ${FICHACLINICATABLE} 
      WHERE idPaciente = ?
      ORDER BY fechaHora DESC
    `, [id]);

    if (result.rows.length === 0) {
      return res.json({
        idPaciente: id,
        idTutor: null,
        nombreTutor: null,
        vacunasAplicadas: [],
        revisiones: []
      });
    }

    const fichas = result.rows;

    let tutorData = null;
    if (fichas[0] && fichas[0].idtutor) {
      const tutorResult = await db.execute(`
        SELECT nombre FROM ${TUTORTABLE} WHERE idTutor = ?
      `, [fichas[0].idtutor.toString()]);
      
      if (tutorResult.rows.length > 0) {
        tutorData = tutorResult.rows[0];
      }
    }

    const vacunasSet = new Set();
    fichas.forEach(f => {
      if (f.vacunas) {
        f.vacunas.forEach(v => vacunasSet.add(v));
      }
    });

    const revisiones = fichas.map(f => ({
      fechaHora: f.fechahora,
      datosPaciente: {
        pesoKg: f.pesokg,
        presion: f.presion,
        tempC: f.tempc
      },
      costoConsulta: f.costoconsulta,
      procedimientos: [{
        procedimiento: f.procedimiento,
        costo: f.costo,
        medicamentos: f.medicamentos || []
      }]
    }));

    res.json({
      idPaciente: id,
      idTutor: fichas[0]?.idtutor?.toString() || null,
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
    const db = getClient();

    const result = await db.execute(`
      SELECT procedimiento, costo FROM ${FICHACLINICATABLE}
    `);

    result.rows.forEach(row => {
      const procedimiento = row.procedimiento;
      const costo = row.costo || 0;
      
      if (procedimiento) { 
        if (!stats[procedimiento]) stats[procedimiento] = { total: 0, gasto: 0 };
        stats[procedimiento].total += 1;
        stats[procedimiento].gasto += costo;
      }
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
    const db = getClient();
    
    const result = await db.execute(`
      SELECT vacunas FROM ${FICHACLINICATABLE} 
      WHERE idPaciente = ?
    `, [id]);

    const set = new Set();
    result.rows.forEach(row => {
      if (row.vacunas) {
        row.vacunas.forEach(v => set.add(v));
      }
    });

    res.json([...set]);

  } catch (error) {
    console.error('Error en vacunasPaciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



exports.historialPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getClient();

    const result = await db.execute(`
      SELECT idTutor, fechaHora, costoConsulta, procedimiento, costo, medicamentos, idMedico
      FROM ${FICHACLINICATABLE}
      WHERE idPaciente = ?
      ORDER BY fechaHora DESC
    `, [id]);

    if (result.rows.length === 0) {
      return res.json({
        idPaciente: id,
        idTutor: null,
        nombreTutor: null,
        procedimientosRealizados: [],
        consultas: []
      });
    }

    const fichas = result.rows;

    const idTutor = fichas[0]?.idtutor?.toString();
    let tutorData = null;
    if (idTutor) {
      const tutorResult = await db.execute(`
        SELECT nombre FROM ${TUTORTABLE} WHERE idTutor = ?
      `, [idTutor]);
      
      if (tutorResult.rows.length > 0) {
        tutorData = tutorResult.rows[0];
      }
    }

    const procedimientosSet = new Set();
    
    const consultas = [];
    
    const medicosMap = new Map();
    const medicosIds = [...new Set(fichas.map(f => f.idmedico?.toString()).filter(Boolean))];
    
    for (const medicoId of medicosIds) {
      const medicoResult = await db.execute(`
        SELECT idMedico, nombre, especialidad FROM ${MEDICOTABLE} WHERE idMedico = ?
      `, [medicoId]);
      
      if (medicoResult.rows.length > 0) {
        const medico = medicoResult.rows[0];
        medicosMap.set(medicoId, {
          nombre: medico.nombre,
          especialidad: medico.especialidad
        });
      }
    }
    
    fichas.forEach(f => {
      consultas.push({
        fechaHora: f.fechahora,
        tipo: 'Consulta',
        descripcion: 'Costo base de consulta médica',
        costo: f.costoconsulta
      });

      if (f.procedimiento) {
        procedimientosSet.add(f.procedimiento);
        
        const medico = medicosMap.get(f.idmedico?.toString());
        const medicosInfo = medico ? `${medico.nombre} (${medico.especialidad})` : 'Médico no disponible';

        consultas.push({
          fechaHora: f.fechahora,
          tipo: 'Procedimiento',
          descripcion: f.procedimiento,
          costo: f.costo,
          medicamentos: f.medicamentos || [],
          medicos: medicosInfo
        });
      }
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
