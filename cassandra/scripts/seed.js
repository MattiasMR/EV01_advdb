
require('dotenv').config();
const { connect } = require('../db');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

const nRegistros = 600; 

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';
const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';
const MEDICAMENTOSTABLE = process.env.MEDICAMENTOSTABLE || 'Medicamentos';
const PROCEDIMIENTOSTABLE = process.env.PROCEDIMIENTOSTABLE || 'Procedimientos';
const VACUNASTABLE = process.env.VACUNASTABLE || 'Vacunas';

const medicamentos = Array.from({ length: 30 }).map(() => ({
  idMedicamento: uuidv4(),
  nombre: faker.science.chemicalElement().name + ' ' +
          faker.number.int({ min: 10, max: 250 }) + ' mg'
}));

const procedimientos = [
  'Vacunación', 'Cirugía menor', 'Radiografía', 'Examen de sangre',
  'Ecografía', 'Desparasitación', 'Limpieza dental', 'Consulta general',
  'Tratamiento herida', 'Sutura', 'Castración', 'Cesárea',
  'Endoscopía', 'Analítica orina', 'Pulido dental', 'Quimioterapia',
  'Profilaxis', 'Curación fractura', 'Ultrasonido cardiaco', 'Biopsia'
].map(nombre => ({ idProcedimiento: uuidv4(), nombre }));

const vacunas = [
  'Rabia', 'Parvovirus', 'Moquillo', 'Hepatitis', 'Leptospirosis',
  'Gripe canina', 'Leishmaniasis', 'Giardiasis', 'Coccidiosis',
  'Toxoplasmosis', 'Panleucopenia', 'Calicivirus', 'Leucemia felina',
  'Bordetella', 'Coronavirus felino'
].map(nombre => ({ idVacuna: uuidv4(), nombre }));

async function limpiarTablas() {
  console.log('Limpiando tablas...');
  const db = await connect();
  
  const tables = [
    FICHACLINICATABLE,
    PACIENTETABLE,
    MEDICOTABLE,
    TUTORTABLE,
    MEDICAMENTOSTABLE,
    PROCEDIMIENTOSTABLE,
    VACUNASTABLE
  ];

  for (const table of tables) {
    await db.execute(`TRUNCATE ${table}`);
    console.log(`Tabla ${table} limpiada`);
  }
}

async function poblarDatos() {
  console.log('Generando datos...');
  const db = await connect();

  console.log('Insertando medicamentos...');
  for (const medicamento of medicamentos) {
    await db.execute(
      `INSERT INTO ${MEDICAMENTOSTABLE} (idMedicamento, nombre) VALUES (?, ?)`,
      [medicamento.idMedicamento, medicamento.nombre]
    );
  }

  console.log('Insertando procedimientos...');
  for (const procedimiento of procedimientos) {
    await db.execute(
      `INSERT INTO ${PROCEDIMIENTOSTABLE} (idProcedimiento, nombre) VALUES (?, ?)`,
      [procedimiento.idProcedimiento, procedimiento.nombre]
    );
  }

  console.log('Insertando vacunas...');
  for (const vacuna of vacunas) {
    await db.execute(
      `INSERT INTO ${VACUNASTABLE} (idVacuna, nombre) VALUES (?, ?)`,
      [vacuna.idVacuna, vacuna.nombre]
    );
  }

  console.log('Insertando tutores...');
  const tutores = Array.from({ length: nRegistros }).map(() => ({
    idTutor: uuidv4(),
    nombre: faker.person.fullName(),
    direccion: faker.location.streetAddress(true), 
    telefono: faker.phone.number(),
    email: faker.internet.email()
  }));

  for (const tutor of tutores) {
    await db.execute(
      `INSERT INTO ${TUTORTABLE} (idTutor, nombre, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)`,
      [tutor.idTutor, tutor.nombre, tutor.direccion, tutor.telefono, tutor.email]
    );
  }

  console.log('Insertando pacientes...');
  const pacientes = Array.from({ length: nRegistros }).map(() => {
    const tutor = faker.helpers.arrayElement(tutores);
    const especie = faker.animal.type(); 
    const raza = typeof faker.animal[especie] === 'function' ? faker.animal[especie]() : especie;

    return {
      idPaciente: uuidv4(),
      idTutor: tutor.idTutor,      
      nombre: faker.person.firstName(),
      especie,
      raza,
      sexo: faker.helpers.arrayElement(['M', 'F']),
    };
  });

  for (const paciente of pacientes) {
    await db.execute(
      `INSERT INTO ${PACIENTETABLE} (idPaciente, idTutor, nombre, especie, raza, sexo) VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente.idPaciente, paciente.idTutor, paciente.nombre, paciente.especie, paciente.raza, paciente.sexo]
    );
  }

  console.log('Insertando médicos...');
  const especialidades = ['Cirugía', 'Dermatología', 'Odontología', 'Cardiología', 'Neurología', 'Oncología', 'Oftalmología']; 
  const medicos = Array.from({ length: nRegistros }).map(() => ({
    idMedico: uuidv4(),
    nombre: faker.person.fullName(),
    especialidad: faker.helpers.arrayElement(especialidades),
    estado: faker.helpers.arrayElement(['ACTIVO', 'INACTIVO']),
  }));

  for (const medico of medicos) {
    await db.execute(
      `INSERT INTO ${MEDICOTABLE} (idMedico, nombre, especialidad, estado) VALUES (?, ?, ?, ?)`,
      [medico.idMedico, medico.nombre, medico.especialidad, medico.estado]
    );
  }

  console.log('Insertando fichas clínicas...');
  
  const pacientesResult = await db.execute('SELECT idPaciente, idTutor FROM Paciente');
  const medicosResult = await db.execute('SELECT idMedico FROM Medico');
  
  const pacientesFromDB = pacientesResult.rows;
  const medicosFromDB = medicosResult.rows;
  
  const fichas = [];
  
  pacientesFromDB.forEach(p => {
    const n = faker.number.int({ min: 1, max: 5 }); 
    for (let i = 0; i < n; i++) {
      const fecha = faker.date.recent({ days: 365 });  
      
      const numProcedimientos = faker.number.int({ min: 1, max: 3 });
      const procedimientosRevision = [];
      
      for (let j = 0; j < numProcedimientos; j++) {
        const proc = faker.helpers.arrayElement(procedimientos);
        
        procedimientosRevision.push({
          procedimiento: proc.nombre, 
          costo: faker.number.int({ min: 15000, max: 150000 }),
          medicamentos: proc.nombre === 'Consulta general' ? [] : 
            faker.helpers.arrayElements(medicamentos.map(m => m.nombre), { min: 1, max: 3 })
        });
      }

      fichas.push({
        idPaciente: p.idpaciente,          
        fechaHora: fecha.toISOString().split('.')[0], 
        idTutor: p.idtutor,               
        costoConsulta: faker.number.int({ min: 25000, max: 50000 }), 
        pesoKg: faker.number.float({ min: 2, max: 80, fractionDigits: 2 }),
        tempC: faker.number.float({ min: 37.5, max: 41, fractionDigits: 2 }),
        presion: `${faker.number.int({ min: 90, max: 160 })}/` + `${faker.number.int({ min: 60, max: 100 })}`,
        vacunas: faker.helpers.arrayElements(vacunas.map(v => v.nombre), { min: 0, max: 2 }), 
        procedimientos: procedimientosRevision
      });
    }
  });

  let totalFichas = 0;
  for (const ficha of fichas) {
    for (const proc of ficha.procedimientos) {
      const medicoAleatorio = faker.helpers.arrayElement(medicosFromDB);
      
      await db.execute(
        `INSERT INTO ${FICHACLINICATABLE} (
          idPaciente, fechaHora, idTutor, idMedico, procedimiento, costo,
          costoConsulta, pesoKg, tempC, presion, vacunas, medicamentos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ficha.idPaciente,
          ficha.fechaHora + '-' + totalFichas, 
          ficha.idTutor,
          medicoAleatorio.idmedico, 
          proc.procedimiento,
          proc.costo,
          ficha.costoConsulta,
          ficha.pesoKg,
          ficha.tempC,
          ficha.presion,
          ficha.vacunas,
          proc.medicamentos
        ],
        { prepare: true }
      );
      
      totalFichas++;
      
      if (totalFichas % 100 === 0) {
        console.log(`📊 Fichas clínicas insertadas: ${totalFichas}`);
      }
    }
  }

  console.log(`Seed completo:
    - ${tutores.length} tutores
    - ${pacientes.length} pacientes
    - ${medicos.length} médicos
    - ${fichas.length} fichas clínicas
    - Catálogos: ${procedimientos.length} proc · ${vacunas.length} vacunas · ${medicamentos.length} meds`);
}

async function seedCompleto() {
  console.log('Iniciando seed...');
  
  try {
    await limpiarTablas();
    await poblarDatos();
    console.log('Seed exitoso');
  } catch (error) {
    console.error('Error seed:', error);
    throw error;
  }
}

seedCompleto()
  .then(() => {
    console.log('Base de datos poblada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
