require('dotenv').config();
require('./db');            

const express = require('express');
const morgan  = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));      

const medicoCtrl   = require('./controllers/medico');
const pacienteCtrl = require('./controllers/paciente');
const tutorCtrl    = require('./controllers/tutor');
const busqCtrl     = require('./controllers/busquedas');

app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Veterinaria en Apache Cassandra',
    version: '1.0.0',
    database: 'Cassandra',
    endpoints: {
      tutores: '/tutor',
      pacientes: '/paciente', 
      medicos: '/medico',
      busquedas: '/paciente/:id/historial, /paciente/:id/fichaClinica, etc.'
    }
  });
});

app.post   ('/paciente',                   pacienteCtrl.createPaciente);
app.get    ('/paciente',                   pacienteCtrl.getPacientes);
app.get    ('/paciente/:id',               pacienteCtrl.getPaciente);
app.put    ('/paciente/:id',               pacienteCtrl.updatePaciente);

app.post   ('/medico',                     medicoCtrl.createMedico);
app.get    ('/medico',                     medicoCtrl.getMedicos);
app.get    ('/medico/:id',                 medicoCtrl.getMedico);
app.put    ('/medico/:id',                 medicoCtrl.updateMedico);
app.patch  ('/medico/:id/cambiarEstado',   medicoCtrl.updateEstadoMedico);

app.post   ('/tutor',                      tutorCtrl.createTutor);
app.get    ('/tutor',                      tutorCtrl.getTutores);
app.get    ('/tutor/:id',                  tutorCtrl.getTutor);
app.put    ('/tutor/:id',                  tutorCtrl.updateTutor);
app.get    ('/tutor/:id/pacientes',        tutorCtrl.getPacientesByTutor);

app.get    ('/paciente/:id/historial',     busqCtrl.historialPaciente);
app.get    ('/paciente/:id/fichaClinica',  busqCtrl.fichaClinicaPaciente);
app.get    ('/paciente/:id/vacunas',       busqCtrl.vacunasPaciente);
app.get    ('/procedimientos/ranking',     busqCtrl.rankingProcedimientos);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    ok: false, 
    error: err.message || 'Error interno del servidor' 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Ruta no encontrada' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => 
  console.log(`API Cassandra escuchando en 0.0.0.0:${PORT}`)
);
