// seed.js
require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { connect } = require('./db');

(async () => {
  try {
    const db = await connect();
    const nRegistros = 600;

    // Catálogos
    const medicamentos = Array.from({ length: 30 }).map(() => ({
      idMedicamento: uuidv4(),
      nombre: faker.science.chemicalElement().name + ' ' +
              faker.number.int({ min: 10, max: 250 }) + ' mg'
    }));

    const procedimientos = [
      'Vacunación','Cirugía menor','Radiografía','Examen de sangre',
      'Ecografía','Desparasitación','Limpieza dental','Consulta general',
      'Tratamiento herida','Sutura','Castración','Cesárea',
      'Endoscopía','Analítica orina','Pulido dental','Quimioterapia',
      'Profilaxis','Curación fractura','Ultrasonido cardiaco','Biopsia'
    ].map(nombre => ({ idProcedimiento: uuidv4(), nombre }));

    const vacunas = [
      'Rabia','Parvovirus','Moquillo','Hepatitis','Leptospirosis',
      'Gripe canina','Leishmaniasis','Giardiasis','Coccidiosis',
      'Toxoplasmosis','Panleucopenia','Calicivirus','Leucemia felina',
      'Bordetella','Coronavirus felino'
    ].map(nombre => ({ idVacuna: uuidv4(), nombre }));

    // Tutores, pacientes, médicos
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
      const raza = typeof faker.animal[especie] === 'function'
        ? faker.animal[especie]() : especie;
      return {
        idPaciente: uuidv4(),
        idTutor: tutor.idTutor,
        nombre: faker.person.firstName(),
        especie,
        raza,
        sexo: faker.helpers.arrayElement(['M','F']),
      };
    });

    const especialidades = ['Cirugía','Dermatología','Odontología','Cardiología','Neurología','Oncología','Oftalmología'];
    const medicos = Array.from({ length: nRegistros }).map(() => ({
      idMedico: uuidv4(),
      nombre: faker.person.fullName(),
      especialidad: faker.helpers.arrayElement(especialidades),
      estado: faker.helpers.arrayElement(['ACTIVO','INACTIVO']),
    }));

    // Fichas clínicas
    const fichas = [];
    pacientes.forEach(p => {
      const n = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < n; i++) {
        const fecha = faker.date.recent({ days: 365 }).toISOString().split('.')[0];
        const numProc = faker.number.int({ min: 1, max: 3 });
        const procedimientosRevision = [];

        for (let j = 0; j < numProc; j++) {
          const proc = faker.helpers.arrayElement(procedimientos);
          const medAsig = faker.helpers.arrayElements(medicos.filter(m => m.estado === 'ACTIVO'), { min:1, max:3 });
          procedimientosRevision.push({
            procedimiento: proc.nombre,
            costo: faker.number.int({ min:15000, max:150000 }),
            medicamentos: proc.nombre === 'Consulta general'
              ? []
              : faker.helpers.arrayElements(medicamentos.map(m => m.nombre), { min:1, max:3 }),
            medicosAsignados: medAsig.map(m => ({
              idMedico: m.idMedico,
              nombre: m.nombre,
              especialidad: m.especialidad
            }))
          });
        }

        fichas.push({
          idPaciente: p.idPaciente,
          fechaHora: fecha,
          idTutor: p.idTutor,
          costoConsulta: faker.number.int({ min:25000, max:50000 }),
          pesoKg: faker.number.float({ min:2, max:80, fractionDigits:2 }),
          tempC: faker.number.float({ min:37.5, max:41, fractionDigits:2 }),
          presion: `${faker.number.int({ min:90, max:160 })}/${faker.number.int({ min:60, max:100 })}`,
          vacunas: faker.helpers.arrayElements(vacunas.map(v => v.nombre), { min:0, max:2 }),
          procedimientos: procedimientosRevision
        });
      }
    });

    console.log('Poblando catálogos...');
    await db.collection('Procedimientos').insertMany(procedimientos);
    await db.collection('Vacunas').insertMany(vacunas);
    await db.collection('Medicamentos').insertMany(medicamentos);

    console.log('Poblando Tutor...');
    await db.collection('Tutor').insertMany(tutores);

    console.log('Poblando Paciente...');
    await db.collection('Paciente').insertMany(pacientes);

    console.log('Poblando Medico...');
    await db.collection('Medico').insertMany(medicos);

    console.log('Poblando FichaClinica...');
    await db.collection('FichaClinica').insertMany(fichas);

    console.log(`✅ Seed completo:
      - ${tutores.length} tutores
      - ${pacientes.length} pacientes
      - ${medicos.length} médicos
      - ${fichas.length} fichas clínicas
      - Catálogos: ${procedimientos.length} proc · ${vacunas.length} vacunas · ${medicamentos.length} meds`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error durante el poblado:', err);
    process.exit(1);
  }
})();
