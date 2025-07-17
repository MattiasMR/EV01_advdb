require('dotenv').config();
const { MongoClient } = require('mongodb');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Configuración de la base de datos
const url = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'veterinaria';
let client, db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log(`MongoDB conectado a ${dbName}`);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDB() primero.');
  }
  return db;
}

const nRegistros = 600; // Número de registros a generar

const medicamentos = Array.from({ length: 30 }).map(() => ({
  idMedicamento: uuidv4(),
  nombre: faker.science.chemicalElement().name + ' ' +
          faker.number.int({ min: 10, max: 250 }) + ' mg',
  costo: faker.number.int({ min: 2000, max: 60000 })
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

const PROCEDIMIENTOSTABLE = 'Procedimientos';
const VACUNASTABLE = 'Vacunas';
const MEDICAMENTOSTABLE = 'Medicamentos';
const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';
const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';

async function limpiarColecciones() {
  console.log('Limpiando colecciones...');
  await connectDB(); // Asegurarse de que la conexión esté abierta
  const db = await getDB();
  
  await Promise.all([
    db.collection(PROCEDIMIENTOSTABLE).deleteMany({}),
    db.collection(VACUNASTABLE).deleteMany({}),
    db.collection(MEDICAMENTOSTABLE).deleteMany({}),

    db.collection(TUTORTABLE).deleteMany({}),
    db.collection(PACIENTETABLE).deleteMany({}),
    db.collection(MEDICOTABLE).deleteMany({}),
    db.collection(FICHACLINICATABLE).deleteMany({})
  ]);
}

async function generarDatos() {
  console.log('Generando datos...');
  const db = await getDB();

  const tutores = Array.from({ length: nRegistros }).map(() => ({
    idTutor: uuidv4(),
    nombre: faker.person.fullName(),
    direccion: faker.location.streetAddress(true),
    telefono: faker.phone.number(),
    email: faker.internet.email()
  }));

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

  const especialidades = ['Cirugía', 'Dermatología', 'Odontología', 'Cardiología', 'Neurología', 'Oncología', 'Oftalmología'];
  const medicos = Array.from({ length: nRegistros }).map(() => ({
    idMedico: uuidv4(),
    nombre: faker.person.fullName(),
    especialidad: faker.helpers.arrayElement(especialidades),
    estado: faker.helpers.arrayElement(['ACTIVO', 'INACTIVO']),
  }));

  const fichas = [];
  pacientes.forEach(p => {
    const n = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < n; i++) {
      const fecha = faker.date.recent({ days: 365 });  // último año
      
      // Generar procedimientos para esta revisión (1-3 procedimientos por revisión)
      const numProcedimientos = faker.number.int({ min: 1, max: 3 });
      const procedimientosRevision = [];
      
      for (let j = 0; j < numProcedimientos; j++) {
        const proc = faker.helpers.arrayElement(procedimientos);
        // Asignar médicos específicos para este procedimiento en esta ficha
        const medicosAsignados = faker.helpers.arrayElements(
          medicos.filter(x => x.estado === 'ACTIVO'), 
          { min: 1, max: 3 }
        );
        
        procedimientosRevision.push({
          procedimiento: proc.nombre, 
          costo: faker.number.int({ min: 15000, max: 150000 }),
          medicamentos: proc.nombre === 'Consulta general' ? [] : 
            faker.helpers.arrayElements(medicamentos.map(m => m.nombre), { min: 1, max: 3 }),
          medicosAsignados: medicosAsignados.map(m => ({
            idMedico: m.idMedico,
            nombre: m.nombre,
            especialidad: m.especialidad
          }))
        });
      }

      fichas.push({
        idPaciente: p.idPaciente,          
        fechaHora: fecha.toISOString().split('.')[0], 
        idTutor: p.idTutor,
        costoConsulta: faker.number.int({ min: 25000, max: 50000 }), // Costo base de la consulta
        pesoKg: faker.number.float({ min: 2, max: 80, fractionDigits: 2 }),
        tempC: faker.number.float({ min: 37.5, max: 41, fractionDigits: 2 }),
        presion: `${faker.number.int({ min: 90, max: 160 })}/` + `${faker.number.int({ min: 60, max: 100 })}`,
        vacunas: faker.helpers.arrayElements(vacunas.map(v => v.nombre), { min: 0, max: 2 }), 
        procedimientos: procedimientosRevision
      });
    }
  });


  await db.collection(PROCEDIMIENTOSTABLE).insertMany(procedimientos);
  await db.collection(MEDICAMENTOSTABLE).insertMany(medicamentos);
  await db.collection(VACUNASTABLE).insertMany(vacunas);

  console.log('Insertando tutores...');
  await db.collection(TUTORTABLE).insertMany(tutores);
  
  console.log('Insertando pacientes...');
  await db.collection(PACIENTETABLE).insertMany(pacientes);
  
  console.log('Insertando médicos...');
  await db.collection(MEDICOTABLE).insertMany(medicos);
  
  console.log('Insertando fichas clínicas...');
  await db.collection(FICHACLINICATABLE).insertMany(fichas);

  console.log(`Seed completo:
    - ${tutores.length} tutores
    - ${pacientes.length} pacientes
    - ${medicos.length} médicos
    - ${fichas.length} fichas clínicas
    - Catálogos: ${procedimientos.length} proc · ${vacunas.length} vacunas · ${medicamentos.length} meds`);
}

(async () => {
  try {
    await limpiarColecciones();
    await generarDatos();
    console.log('Proceso completado exitosamente');
    
    // Cerrar conexión
    if (client) {
      await client.close();
      console.log('Conexión cerrada');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error durante el poblado:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
})();
