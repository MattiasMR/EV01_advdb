// seed.js
require('dotenv').config();
const { connect } = require('./db');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Catálogos base
const PROCEDIMIENTOS = [
  'Consulta General', 'Vacunación', 'Desparasitación', 'Esterilización', 'Castración',
  'Cirugía Menor', 'Cirugía Mayor', 'Radiografía', 'Ecografía', 'Análisis de Sangre',
  'Limpieza Dental', 'Extracción Dental', 'Sutura', 'Curación de Heridas', 'Hospitalización',
  'Fisioterapia', 'Quimioterapia', 'Biopsia', 'Endoscopia', 'Electrocardiograma'
];

const VACUNAS = [
  'Rabia', 'Parvovirus', 'Distemper', 'Hepatitis', 'Parainfluenza',
  'Bordetella', 'Leptospirosis', 'Coronavirus', 'Giardia', 'Lyme',
  'Triple Felina', 'Leucemia Felina', 'Rinotraqueitis', 'Calicivirus', 'Panleucopenia'
];

const MEDICAMENTOS = [
  'Amoxicilina', 'Doxiciclina', 'Metronidazol', 'Prednisona', 'Meloxicam',
  'Tramadol', 'Gabapentina', 'Furosemida', 'Enalapril', 'Omeprazol',
  'Fluconazol', 'Ivermectina', 'Fenbendazol', 'Pimobendan', 'Atenolol',
  'Insulina', 'Levotiroxina', 'Ciclosporina', 'Azatioprina', 'Clorhexidina',
  'Betametasona', 'Ketamina', 'Propofol', 'Isoflurano', 'Lidocaína',
  'Butorfanol', 'Buprenorfina', 'Maropitant', 'Silimarina', 'Lactulosa'
];

const ESPECIALIDADES = [
  'Medicina General', 'Cirugía', 'Dermatología', 'Cardiología', 'Neurología',
  'Oncología', 'Oftalmología', 'Traumatología', 'Medicina Interna', 'Anestesiología'
];

const ESPECIES = ['Perro', 'Gato', 'Conejo', 'Hamster', 'Ave'];
const SEXOS = ['MACHO', 'HEMBRA'];

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';
const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';

async function limpiarColecciones() {
  console.log('🧹 Limpiando colecciones...');
  const db = await connect();
  
  await Promise.all([
    db.collection(TUTORTABLE).deleteMany({}),
    db.collection(PACIENTETABLE).deleteMany({}),
    db.collection(MEDICOTABLE).deleteMany({}),
    db.collection(FICHACLINICATABLE).deleteMany({})
  ]);
}

async function crearTutores(cantidad = 600) {
  console.log('👥 Creando tutores...');
  const db = await connect();
  const tutores = [];
  
  for (let i = 0; i < cantidad; i++) {
    const tutor = {
      idTutor: uuidv4(),
      nombre: faker.person.fullName(),
      email: faker.internet.email(),
      telefono: faker.phone.number('+569########')
    };
    tutores.push(tutor);
  }
  
  await db.collection(TUTORTABLE).insertMany(tutores);
  return tutores;
}

async function crearPacientes(tutores, cantidad = 600) {
  console.log('🐾 Creando pacientes...');
  const db = await connect();
  const pacientes = [];
  
  for (let i = 0; i < cantidad; i++) {
    const tutorAleatorio = tutores[Math.floor(Math.random() * tutores.length)];
    const especie = ESPECIES[Math.floor(Math.random() * ESPECIES.length)];
    
    const paciente = {
      idPaciente: uuidv4(),
      idTutor: tutorAleatorio.idTutor,
      nombre: faker.animal.dog(),
      especie: especie,
      raza: especie === 'Perro' ? faker.animal.dog() : 
            especie === 'Gato' ? faker.animal.cat() : 
            faker.animal.type(),
      sexo: SEXOS[Math.floor(Math.random() * SEXOS.length)]
    };
    pacientes.push(paciente);
  }
  
  await db.collection(PACIENTETABLE).insertMany(pacientes);
  return pacientes;
}

async function crearMedicos(cantidad = 600) {
  console.log('👨‍⚕️ Creando médicos...');
  const db = await connect();
  const medicos = [];
  
  for (let i = 0; i < cantidad; i++) {
    const medico = {
      idMedico: uuidv4(),
      nombre: `Dr. ${faker.person.fullName()}`,
      especialidad: ESPECIALIDADES[Math.floor(Math.random() * ESPECIALIDADES.length)],
      estado: Math.random() > 0.1 ? 'ACTIVO' : 'INACTIVO' // 90% activos
    };
    medicos.push(medico);
  }
  
  await db.collection(MEDICOTABLE).insertMany(medicos);
  return medicos;
}

function generarProcedimientos(medicos) {
  const numProcedimientos = Math.floor(Math.random() * 3) + 1; // 1-3 procedimientos
  const procedimientos = [];
  
  for (let i = 0; i < numProcedimientos; i++) {
    const nombreProcedimiento = PROCEDIMIENTOS[Math.floor(Math.random() * PROCEDIMIENTOS.length)];
    const medicosActivos = medicos.filter(m => m.estado === 'ACTIVO');
    const numMedicos = Math.floor(Math.random() * 3) + 1; // 1-3 médicos por procedimiento
    const medicosSeleccionados = [];
    
    for (let j = 0; j < numMedicos; j++) {
      const medicoAleatorio = medicosActivos[Math.floor(Math.random() * medicosActivos.length)];
      if (!medicosSeleccionados.includes(medicoAleatorio.idMedico)) {
        medicosSeleccionados.push(medicoAleatorio.idMedico);
      }
    }
    
    procedimientos.push({
      nombre: nombreProcedimiento,
      costo: Math.floor(Math.random() * 200000) + 10000, // Entre 10.000 y 210.000
      medicosAsignados: medicosSeleccionados
    });
  }
  
  return procedimientos;
}

function generarVacunas() {
  const numVacunas = Math.floor(Math.random() * 4); // 0-3 vacunas
  const vacunas = [];
  
  for (let i = 0; i < numVacunas; i++) {
    vacunas.push({
      nombre: VACUNAS[Math.floor(Math.random() * VACUNAS.length)],
      laboratorio: faker.company.name(),
      fechaAplicacion: faker.date.recent({ days: 30 })
    });
  }
  
  return vacunas;
}

function generarMedicamentos() {
  const numMedicamentos = Math.floor(Math.random() * 5); // 0-4 medicamentos
  const medicamentos = [];
  
  for (let i = 0; i < numMedicamentos; i++) {
    medicamentos.push({
      nombre: MEDICAMENTOS[Math.floor(Math.random() * MEDICAMENTOS.length)],
      dosis: `${Math.floor(Math.random() * 500) + 50}mg`,
      frecuencia: ['Cada 8 horas', 'Cada 12 horas', 'Una vez al día', 'Cada 6 horas'][Math.floor(Math.random() * 4)]
    });
  }
  
  return medicamentos;
}

async function crearFichasClinicas(pacientes, medicos, cantidad = 1800) {
  console.log('📋 Creando fichas clínicas...');
  const db = await connect();
  const fichas = [];
  
  for (let i = 0; i < cantidad; i++) {
    const pacienteAleatorio = pacientes[Math.floor(Math.random() * pacientes.length)];
    
    const ficha = {
      idFicha: uuidv4(),
      idPaciente: pacienteAleatorio.idPaciente,
      fecha: faker.date.recent({ days: 365 }), // Último año
      motivo: faker.lorem.sentence(),
      diagnostico: faker.lorem.paragraph(),
      costoConsulta: Math.floor(Math.random() * 50000) + 15000, // Entre 15.000 y 65.000
      procedimientos: generarProcedimientos(medicos),
      vacunas: generarVacunas(),
      medicamentos: generarMedicamentos()
    };
    
    fichas.push(ficha);
  }
  
  await db.collection(FICHACLINICATABLE).insertMany(fichas);
  return fichas;
}

async function ejecutarSeed() {
  try {
    // Limpiar datos existentes
    await limpiarColecciones();
    
    // Crear datos de prueba
    console.log('🌱 Iniciando seed de datos...');
    
    const tutores = await crearTutores(600);
    const pacientes = await crearPacientes(tutores, 600);
    const medicos = await crearMedicos(600);
    const fichas = await crearFichasClinicas(pacientes, medicos, 1800);
    
    console.log('✅ Seed completado exitosamente:');
    console.log(`   - ${tutores.length} tutores`);
    console.log(`   - ${pacientes.length} pacientes`);
    console.log(`   - ${medicos.length} médicos`);
    console.log(`   - ${fichas.length} fichas clínicas`);
    console.log(`   - Catálogos: ${PROCEDIMIENTOS.length} procedimientos, ${VACUNAS.length} vacunas, ${MEDICAMENTOS.length} medicamentos`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  }
}

// Ejecutar si el archivo se llama directamente
if (require.main === module) {
  ejecutarSeed();
}

module.exports = { ejecutarSeed };
