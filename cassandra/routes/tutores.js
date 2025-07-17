const express = require('express');
const router = express.Router();
const tutorCtrl = require('../controllers/tutor');

// Rutas para tutores
router.post('/', tutorCtrl.createTutor);
router.get('/', tutorCtrl.getTutores);
router.get('/:id', tutorCtrl.getTutor);
router.put('/:id', tutorCtrl.updateTutor);
router.get('/:id/pacientes', tutorCtrl.getPacientesByTutor);

module.exports = router;
