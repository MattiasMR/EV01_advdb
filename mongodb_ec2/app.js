// server.js
require('dotenv').config();
require('./db');            

const express = require('express');
const morgan  = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));      

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
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status||500).json({ ok: false, error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => 
  console.log(`🚀 API escuchando en 0.0.0.0:${PORT}`)
);
