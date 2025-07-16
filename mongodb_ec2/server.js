// server.js
require('dotenv').config();
const express = require('express');
const app = express();

// Importa tus controladores
const medicoCtrl   = require('./medico');
const pacienteCtrl = require('./paciente');
const tutorCtrl    = require('./tutor');
const busqCtrl     = require('./busquedas');

app.use(express.json());

// --- PACIENTES ---
app.post   ('/paciente',                   pacienteCtrl.createPaciente);
app.get    ('/paciente',                   pacienteCtrl.getPacientes);
app.get    ('/paciente/:id',               pacienteCtrl.getPaciente);
app.put    ('/paciente/:id',               pacienteCtrl.updatePaciente);

// --- MÉDICOS ---
app.post   ('/medico',                     medicoCtrl.createMedico);
app.get    ('/medico',                     medicoCtrl.getMedicos);
app.get    ('/medico/:id',                 medicoCtrl.getMedico);
app.put    ('/medico/:id',                 medicoCtrl.updateMedico);
app.patch  ('/medico/:id/cambiarEstado',   medicoCtrl.updateEstadoMedico);

// --- TUTORES ---
app.post   ('/tutor',                      tutorCtrl.createTutor);
app.get    ('/tutor',                      tutorCtrl.getTutores);
app.get    ('/tutor/:id',                  tutorCtrl.getTutor);
app.put    ('/tutor/:id',                  tutorCtrl.updateTutor);
app.get    ('/tutor/:id/pacientes',        tutorCtrl.getPacientesByTutor);

// --- BÚSQUEDAS / REPORTES ---
app.get    ('/paciente/:id/historial',     busqCtrl.historialPaciente);
app.get    ('/paciente/:id/fichaClinica',  busqCtrl.fichaClinicaPaciente);
app.get    ('/paciente/:id/vacunas',       busqCtrl.vacunasPaciente);
app.get    ('/procedimientos/ranking',     busqCtrl.rankingProcedimientos);

// Levanta el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
