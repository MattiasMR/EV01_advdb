const express = require('express');
const router = express.Router();

// Importar todas las rutas
const pacientesRoutes = require('./pacientes');
const medicosRoutes = require('./medicos');
const tutoresRoutes = require('./tutores');
const busquedasRoutes = require('./busquedas');
const dashboardRoutes = require('./dashboard');

// Configurar las rutas con sus prefijos
router.use('/paciente', pacientesRoutes);
router.use('/medico', medicosRoutes);
router.use('/tutor', tutoresRoutes);
router.use('/', busquedasRoutes);  // Las búsquedas mantienen su estructura original
router.use('/dashboard', dashboardRoutes);

module.exports = router;
