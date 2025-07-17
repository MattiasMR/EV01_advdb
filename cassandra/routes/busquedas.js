const express = require('express');
const router = express.Router();
const busqCtrl = require('../controllers/busquedas');

// Rutas para búsquedas específicas
router.get('/paciente/:id/historial', busqCtrl.historialPaciente);
router.get('/paciente/:id/fichaClinica', busqCtrl.fichaClinicaPaciente);
router.get('/paciente/:id/vacunas', busqCtrl.vacunasPaciente);
router.get('/procedimientos/ranking', busqCtrl.rankingProcedimientos);

module.exports = router;
