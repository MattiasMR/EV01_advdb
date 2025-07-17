const express = require('express');
const router = express.Router();
const medicoCtrl = require('../controllers/medico');

// Rutas para médicos
router.post('/', medicoCtrl.createMedico);
router.get('/', medicoCtrl.getMedicos);
router.get('/:id', medicoCtrl.getMedico);
router.put('/:id', medicoCtrl.updateMedico);
router.patch('/:id/cambiarEstado', medicoCtrl.updateEstadoMedico);

module.exports = router;
