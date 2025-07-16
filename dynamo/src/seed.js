const AWS = require('aws-sdk');
const { faker } = require('@faker-js/faker');        
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-east-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();

nRegistros = 600 // Número de registros a generar

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


// Generar n tutores
const tutores = Array.from({ length: nRegistros }).map(() => ({
  idTutor: uuidv4(),
  nombre: faker.person.fullName(),
  direccion: faker.location.streetAddress(true),
  telefono: faker.phone.number(),
  email: faker.internet.email()
}));

// Generar n pacientes
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

// Generar n medicos
const especialidades = ['Cirugía', 'Dermatología', 'Odontología', 'Cardiología', 'Neurología', 'Oncología', 'Oftalmología'];

const medicos = Array.from({ length: nRegistros }).map(() => ({
  idMedico: uuidv4(),
  nombre: faker.person.fullName(),
  especialidad : faker.helpers.arrayElement(especialidades),
  estado: faker.helpers.arrayElement(['ACTIVO', 'INACTIVO']),
}));

// generar fichas clinicas
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


async function batchWrite(table, items){
  for (let i=0;i<items.length;i+=25){
    const chunk = items.slice(i,i+25);
    await dynamodb.batchWrite({
      RequestItems:{ [table]:
        chunk.map(Item=>({PutRequest:{Item}}))
      }
    }).promise();
  }
  console.log(`  > ${table}: +${items.length}`);
}


(async () => {
  try {
    console.log('Poblando catálogos...');
    await batchWrite('Procedimientos', procedimientos);
    await batchWrite('Vacunas', vacunas);
    await batchWrite('Medicamentos', medicamentos);

    console.log('Poblando Tutor...');
    await batchWrite('Tutor', tutores);

    console.log('Poblando Paciente...');
    await batchWrite('Paciente', pacientes);

    console.log('Poblando Medico...');
    await batchWrite('Medico', medicos);

    console.log('Poblando FichaClinica...');
    await batchWrite('FichaClinica', fichas);

    console.log(`✅ Seed completo:
      - ${tutores.length} tutores
      - ${pacientes.length} pacientes
      - ${medicos.length} médicos
      - ${fichas.length} fichas clínicas
      - Catálogos: ${procedimientos.length} proc · ${vacunas.length} vacunas · ${medicamentos.length} meds`);
  } catch (err) {
    console.error('❌ Error durante el poblado:', err);
  }
})();
