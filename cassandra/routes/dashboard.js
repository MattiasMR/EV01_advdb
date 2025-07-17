const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controllers/dashboardqueries');

// Rutas para queries del dashboard
router.get('/volumenGastoMensual', dashboardCtrl.volumenYGastoPromedioPorMes);
router.get('/distribucionEspecialidades', dashboardCtrl.distribucionPorEspecialidad);
router.get('/topMedicamentos', dashboardCtrl.topMedicamentos);
router.get('/evolucionIngresoVsCostes', dashboardCtrl.evolucionIngresosVsCostes);
router.get('/demandaVacunasMensual', dashboardCtrl.demandaVacunasPorMes);

module.exports = router;
