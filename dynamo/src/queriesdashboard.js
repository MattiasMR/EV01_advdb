const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// 1. Volumen de atenciones y gasto promedio por mes

const volumenYGastoPromedioPorMes = async (event) => {
  try {
    const stats = {};
    let lastKey = null;
    do {
      const res = await dynamodb.scan({
        TableName: process.env.FICHACLINICATABLE,
        ProjectionExpression: 'fechaHora, costoConsulta, procedimientos',
        ExclusiveStartKey: lastKey
      }).promise();
      res.Items.forEach(item => {
        const date = new Date(item.fechaHora);
        const ym = `${date.getUTCFullYear()}-${(date.getUTCMonth()+1).toString().padStart(2,'0')}`;
        const procSum = (item.procedimientos||[])
          .reduce((sum,p)=> sum + (p.costo||0), 0);
        const totalCost = (item.costoConsulta||0) + procSum;
        if (!stats[ym]) stats[ym] = { count: 0, sumCost: 0 };
        stats[ym].count += 1;
        stats[ym].sumCost += totalCost;
      });
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    
    const result = Object.entries(stats).map(([ym, {count, sumCost}]) => ({
      mes: ym,
      totalAtenciones: count,
      gastoPromedio: sumCost / count
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// 2. Distribución de procedimientos por especialidad médica

const distribucionPorEspecialidad = async (event) => {
  try {
    const counts = {};
    let lastKey = null;
    do {
      const res = await dynamodb.scan({
        TableName: process.env.FICHACLINICATABLE,
        ProjectionExpression: 'procedimientos'
      , ExclusiveStartKey: lastKey }).promise();
      res.Items.forEach(item => {
        (item.procedimientos||[]).forEach(proc => {
          (proc.medicosAsignados||[]).forEach(m => {
            const esp = m.especialidad;
            counts[esp] = (counts[esp]||0) + 1;
          });
        });
      });
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    
    const result = Object.entries(counts)
      .map(([especialidad, total])=>({ especialidad, total }))
      .sort((a,b)=>b.total - a.total);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// 3. Uso de medicamentos más frecuentes en procedimientos

const topMedicamentos = async (event) => {
  try {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 10;
    const freq = {};
    let lastKey = null;
    do {
      const res = await dynamodb.scan({
        TableName: process.env.FICHACLINICATABLE,
        ProjectionExpression: 'procedimientos'
      , ExclusiveStartKey: lastKey }).promise();
      res.Items.forEach(item=>{
        (item.procedimientos||[]).forEach(proc=>{
          (proc.medicamentos||[]).forEach(med=>{
            freq[med] = (freq[med]||0) + 1;
          });
        });
      });
      lastKey = res.LastEvaluatedKey;
    } while(lastKey);
    
    const result = Object.entries(freq)
      .map(([med,count])=>({ medicamento: med, count }))
      .sort((a,b)=>b.count - a.count)
      .slice(0, limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// 4. Evolución de ingresos vs. costes de medicamentos por mes

const evolucionIngresosVsCostes = async (event) => {
  try {
    const meds = await dynamodb.scan({ TableName: process.env.MEDICAMENTOTABLE }).promise();
    const medCostMap = meds.Items.reduce((m,a)=>{ m[a.nombre]=a.costo; return m; }, {});
    const stats = {};
    let lastKey = null;
    do {
      const res = await dynamodb.scan({
        TableName: process.env.FICHACLINICATABLE,
        ProjectionExpression: 'fechaHora, costoConsulta, procedimientos'
      , ExclusiveStartKey: lastKey }).promise();
      res.Items.forEach(item=>{
        const date = new Date(item.fechaHora);
        const ym = `${date.getUTCFullYear()}-${(date.getUTCMonth()+1).toString().padStart(2,'0')}`;
        if (!stats[ym]) stats[ym] = { ingresos:0, costeMeds:0 };
        const procSum = (item.procedimientos||[]).reduce((s,p)=>s+(p.costo||0),0);
        stats[ym].ingresos += (item.costoConsulta||0) + procSum;
        (item.procedimientos||[]).forEach(p=>{
          (p.medicamentos||[]).forEach(med=>{
            stats[ym].costeMeds += medCostMap[med] || 0;
          });
        });
      });
      lastKey = res.LastEvaluatedKey;
    } while(lastKey);
    
    
    const result = Object.entries(stats).map(([mes,{ingresos,costeMeds, ganancia}])=>({ mes, ingresos, costeMeds, ganancia: ingresos - costeMeds }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// 5. Demanda de vacunas por tipo y mes

const demandaVacunasPorMes = async (event) => {
  try {
    const stats = {};
    let lastKey = null;
    do {
      const res = await dynamodb.scan({
        TableName: process.env.FICHACLINICATABLE,
        ProjectionExpression: 'fechaHora, vacunas'
      , ExclusiveStartKey: lastKey }).promise();
      res.Items.forEach(item => {
        const date = new Date(item.fechaHora);
        const ym = `${date.getUTCFullYear()}-${(date.getUTCMonth()+1).toString().padStart(2,'0')}`;
        (item.vacunas||[]).forEach(vac=>{
          const key = `${ym}||${vac}`;
          stats[key] = (stats[key]||0) + 1;
        });
      });
      lastKey = res.LastEvaluatedKey;
    } while(lastKey);
    
    const result = Object.entries(stats).map(([k, count]) => {
      const [mes, vacuna] = k.split('||');
      return { mes, vacuna, aplicaciones: count };
    }).sort((a,b)=> a.mes.localeCompare(b.mes) || b.aplicaciones - a.aplicaciones);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

module.exports = {
  volumenYGastoPromedioPorMes,
  distribucionPorEspecialidad,
  topMedicamentos,
  evolucionIngresosVsCostes,
  demandaVacunasPorMes
};
