const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB.DocumentClient();

const FICHACLINICATABLE = process.env.FICHACLINICATABLE;
const MEDICOTABLE = process.env.MEDICOTABLE;

/* ------------------------------------------------------------------
 * 1) FICHA CLINICA DE UNA MASCOTA
 *    - Ficha médica completa con datos clásicos de revisión médica
 *    - Incluye peso, presión, temperatura, fecha, hora, médico
 *    - Vacunas, procedimientos con medicamentos
 *    GET /paciente/{id}/fichaClinica
 * -----------------------------------------------------------------*/

exports.fichaClinicaPaciente = async (event) => {
  const { id } = event.pathParameters;

  const resp = await dynamodb.query({
    TableName: FICHACLINICATABLE,
    KeyConditionExpression: 'idPaciente = :p',
    ExpressionAttributeValues: { ':p': id },
    ScanIndexForward: false
  }).promise();

  const fichas = resp.Items;

  // Obtener información del tutor
  const tutorData = await dynamodb.get({
    TableName: 'Tutor',
    Key: { idTutor: fichas[0]?.idTutor },
    ProjectionExpression: 'nombre'
  }).promise();

  // Reunir todas las vacunas aplicadas
  const vacunasSet = new Set();
  fichas.forEach(f => {
    (f.vacunas || []).forEach(v => vacunasSet.add(v));
  });

  // Procesar revisiones
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
      nombreTutor: tutorData.Item?.nombre || null,
      vacunasAplicadas: [...vacunasSet],
      revisiones: revisiones
    })
  };
};

/* ------------------------------------------------------------------
 * 2) RANKING DE PROCEDIMIENTOS (populares y $)
 *    - Agrega en memoria porque Dynamo no hace GROUP BY
 *    - Usa el GSI 'ProcedimientoIndex' para proyectar solo lo necesario
 *    GET /procedimientos/ranking?top=5
 * -----------------------------------------------------------------*/
exports.rankingProcedimientos = async (event) => {
  const limit = Number((event.queryStringParameters || {}).top) || 5;
  const stats = {};            

  let lastKey;
  do {
    const res = await dynamodb.scan({
      TableName: FICHACLINICATABLE,
      ProjectionExpression: 'procedimientos',
      ExclusiveStartKey: lastKey
    }).promise();

    res.Items.forEach(({ procedimientos = [] }) => {
      procedimientos.forEach(({ procedimiento, costo = 0 }) => {
        if (!stats[procedimiento]) stats[procedimiento] = { total: 0, gasto: 0 };
        stats[procedimiento].total += 1;
        stats[procedimiento].gasto += costo;
      });
    });
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  const ranking = Object.entries(stats)
    .map(([nombre, { total, gasto }]) => ({ procedimiento: nombre, total, gasto }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return { statusCode: 200, body: JSON.stringify(ranking) };
};

/* ------------------------------------------------------------------
 * 3) VACUNAS AL DÍA DEL PACIENTE
 *    - Devuelve conjunto único de vacunas aplicadas
 *    GET /paciente/{id}/vacunas
 * -----------------------------------------------------------------*/
exports.vacunasPaciente = async (event) => {
  const { id } = event.pathParameters;
  const out = await dynamodb.query({
    TableName: FICHACLINICATABLE,
    KeyConditionExpression: 'idPaciente = :p',
    ExpressionAttributeValues: { ':p': id },
    ProjectionExpression: 'vacunas'
  }).promise();

  const set = new Set();
  out.Items.forEach(i => (i.vacunas || []).forEach(v => set.add(v)));

  return { statusCode: 200, body: JSON.stringify([...set]) };
};

/* ------------------------------------------------------------------
 * 4) HISTORIAL DEL PACIENTE
 *    - Devuelve tanto el listado de todos los procedimientos y consultas médicas del paciente, como el costo pagado por el tutor de cada una
 *    GET /paciente/{id}/historial
 * -----------------------------------------------------------------*/

exports.historialPaciente = async (event) => {
  const { id } = event.pathParameters;

  const resp = await dynamodb.query({
    TableName: FICHACLINICATABLE,
    KeyConditionExpression: 'idPaciente = :p',
    ExpressionAttributeValues: { ':p': id },
    ProjectionExpression: 'idTutor, fechaHora, costoConsulta, procedimientos',
    ScanIndexForward: false // Orden descendente (más reciente primero)
  }).promise();

  const fichas = resp.Items;

  // Obtener información del tutor
  const idTutor = fichas[0]?.idTutor;
  const tutorData = await dynamodb.get({
    TableName: 'Tutor',
    Key: { idTutor: idTutor },
    ProjectionExpression: 'nombre'
  }).promise();

  // Crear set de procedimientos únicos
  const procedimientosSet = new Set();
  
  // Procesar consultas con costos separados
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

  return {
    statusCode: 200,
    body: JSON.stringify({
      idPaciente: id,
      idTutor: idTutor,
      nombreTutor: tutorData.Item?.nombre || null,
      procedimientosRealizados: [...procedimientosSet],
      consultas: consultas
    })
  };
};