require('dotenv').config();
const { getDB } = require('../app');

// 1. Volumen de atenciones y gasto promedio por mes
const volumenYGastoPromedioPorMes = async (req, res) => {
  try {
    const db = getDB();
    
    const pipeline = [
      {
        $addFields: {
          fechaConvertida: { $dateFromString: { dateString: "$fechaHora" } },
          costoTotal: {
            $add: [
              { $ifNull: ["$costoConsulta", 0] },
              {
                $reduce: {
                  input: { $ifNull: ["$procedimientos", []] },
                  initialValue: 0,
                  in: { $add: ["$$value", { $ifNull: ["$$this.costo", 0] }] }
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$fechaConvertida" },
            month: { $month: "$fechaConvertida" }
          },
          totalAtenciones: { $sum: 1 },
          sumaTotal: { $sum: "$costoTotal" }
        }
      },
      {
        $addFields: {
          gastoPromedio: { $divide: ["$sumaTotal", "$totalAtenciones"] }
        }
      },
      {
        $project: {
          _id: 0,
          mes: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" }
                }
              }
            ]
          },
          totalAtenciones: 1,
          gastoPromedio: { $round: ["$gastoPromedio", 2] }
        }
      },
      { $sort: { mes: 1 } }
    ];

    const result = await db.collection('FichaClinica').aggregate(pipeline).toArray();
    
    res.json({
      statusCode: 200,
      body: result
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};

// 2. Distribución de procedimientos por especialidad médica
const distribucionPorEspecialidad = async (req, res) => {
  try {
    const db = getDB();
    
    const pipeline = [
      { $unwind: "$procedimientos" },
      { $unwind: "$procedimientos.medicosAsignados" },
      {
        $group: {
          _id: "$procedimientos.medicosAsignados.especialidad",
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          especialidad: "$_id",
          total: 1
        }
      },
      { $sort: { total: -1 } }
    ];

    const result = await db.collection('FichaClinica').aggregate(pipeline).toArray();
    
    res.json({
      statusCode: 200,
      body: result
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};

// 3. Uso de Medicamentos más frecuentes en procedimientos
const topMedicamentos = async (req, res) => {
  try {
    const db = getDB();
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const pipeline = [
      // Filtrar solo documentos que tengan procedimientos con medicamentos
      { $match: { "procedimientos.medicamentos": { $exists: true, $ne: [] } } },
      { $unwind: "$procedimientos" },
      // Filtrar procedimientos que tengan medicamentos
      { $match: { "procedimientos.medicamentos": { $exists: true, $ne: [] } } },
      { $unwind: "$procedimientos.medicamentos" },
      {
        $group: {
          _id: "$procedimientos.medicamentos",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          medicamento: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ];

    const result = await db.collection('FichaClinica').aggregate(pipeline).toArray();
    
    res.json({
      statusCode: 200,
      body: result
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};

// 4. Evolución de ingresos vs. costes de Medicamentos por mes
const evolucionIngresosVsCostes = async (req, res) => {
  try {
    const db = getDB();
    
    // Primero obtenemos el mapeo de costos de Medicamentos
    const Medicamentos = await db.collection('Medicamentos').find({}).toArray();
    const medCostMap = Medicamentos.reduce((map, med) => {
      map[med.nombre] = med.costo || 0;
      return map;
    }, {});

    const pipeline = [
      {
        $addFields: {
          fechaConvertida: { $dateFromString: { dateString: "$fechaHora" } },
          ingresoTotal: {
            $add: [
              { $ifNull: ["$costoConsulta", 0] },
              {
                $reduce: {
                  input: { $ifNull: ["$procedimientos", []] },
                  initialValue: 0,
                  in: { $add: ["$$value", { $ifNull: ["$$this.costo", 0] }] }
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$fechaConvertida" },
            month: { $month: "$fechaConvertida" }
          },
          ingresos: { $sum: "$ingresoTotal" },
          MedicamentosUsados: {
            $push: {
              $reduce: {
                input: { $ifNull: ["$procedimientos", []] },
                initialValue: [],
                in: { $concatArrays: ["$$value", { $ifNull: ["$$this.medicamentos", []] }] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          mes: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" }
                }
              }
            ]
          },
          ingresos: { $round: ["$ingresos", 2] },
          MedicamentosUsados: {
            $reduce: {
              input: "$MedicamentosUsados",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          }
        }
      },
      { $sort: { mes: 1 } }
    ];

    const result = await db.collection('FichaClinica').aggregate(pipeline).toArray();
    
    // Calcular costes de Medicamentos en el lado del servidor
    const finalResult = result.map(item => {
      const costeMeds = item.MedicamentosUsados.reduce((sum, med) => {
        return sum + (medCostMap[med] || 0);
      }, 0);
      
      return {
        mes: item.mes,
        ingresos: item.ingresos,
        costeMeds: Math.round(costeMeds * 100) / 100,
        ganancia: Math.round((item.ingresos - costeMeds) * 100) / 100
      };
    });
    
    res.json({
      statusCode: 200,
      body: finalResult
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};

// 5. Demanda de vacunas por tipo y mes
const demandaVacunasPorMes = async (req, res) => {
  try {
    const db = getDB();
    
    const pipeline = [
      { $unwind: "$vacunas" },
      {
        $addFields: {
          fechaConvertida: { $dateFromString: { dateString: "$fechaHora" } }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$fechaConvertida" },
            month: { $month: "$fechaConvertida" },
            vacuna: "$vacunas"
          },
          aplicaciones: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          mes: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" }
                }
              }
            ]
          },
          vacuna: "$_id.vacuna",
          aplicaciones: 1
        }
      },
      { 
        $sort: { 
          mes: 1, 
          aplicaciones: -1 
        } 
      }
    ];

    const result = await db.collection('FichaClinica').aggregate(pipeline).toArray();
    
    res.json({
      statusCode: 200,
      body: result
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};

module.exports = {
  volumenYGastoPromedioPorMes,
  distribucionPorEspecialidad,
  topMedicamentos,
  evolucionIngresosVsCostes,
  demandaVacunasPorMes
};
