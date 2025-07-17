const express = require('express');
const router = express.Router();
const pacienteCtrl = require('../controllers/paciente');

// Rutas para pacientes
router.post('/', pacienteCtrl.createPaciente);
router.get('/', pacienteCtrl.getPacientes);
router.get('/:id', pacienteCtrl.getPaciente);
router.put('/:id', pacienteCtrl.updatePaciente);

module.exports = router;
