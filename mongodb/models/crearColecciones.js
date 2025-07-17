require('dotenv').config();
const { connect } = require('../app');

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';
const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';

async function crearEstructura() {
  const db = await connect();

  try {
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(c => c.name);

    for (const tableName of [TUTORTABLE, PACIENTETABLE, MEDICOTABLE, FICHACLINICATABLE]) {
      if (!existingCollections.includes(tableName)) {
        await db.createCollection(tableName);
        console.log(`Colección '${tableName}' creada`);
      } else {
        console.log(`Colección '${tableName}' ya existe`);
      }
    }

    console.log('Creando índices para Tutores...');
    await db.collection(TUTORTABLE).createIndexes([
      { key: { idTutor: 1 }, unique: true, name: 'idx_idTutor' },
      { key: { email: 1 }, name: 'idx_email_tutor' },
      { key: { telefono: 1 }, name: 'idx_telefono_tutor' },
      { key: { nombre: 1 }, name: 'idx_nombre_tutor' }
    ]);

    console.log('Creando índices para Pacientes...');
    await db.collection(PACIENTETABLE).createIndexes([
      { key: { idPaciente: 1 }, unique: true, name: 'idx_idPaciente' },
      { key: { idTutor: 1 }, name: 'idx_idTutor_paciente' }, 
      { key: { idTutor: 1, nombre: 1 }, name: 'idx_tutor_nombre' },
      { key: { especie: 1 }, name: 'idx_especie' },
      { key: { sexo: 1 }, name: 'idx_sexo' },
      { key: { raza: 1 }, name: 'idx_raza' }
    ]);

    console.log('Creando índices para Médicos...');
    await db.collection(MEDICOTABLE).createIndexes([
      { key: { idMedico: 1 }, unique: true, name: 'idx_idMedico' },
      { key: { estado: 1 }, name: 'idx_estado_medico' },
      { key: { especialidad: 1 }, name: 'idx_especialidad' },
      { key: { nombre: 1 }, name: 'idx_nombre_medico' },
      { key: { especialidad: 1, estado: 1 }, name: 'idx_especialidad_estado' }
    ]);

    console.log('Creando índices para Fichas Clínicas...');
    await db.collection(FICHACLINICATABLE).createIndexes([
      { key: { idPaciente: 1, fechaHora: -1 }, name: 'idx_paciente_fechaHora' },
      { key: { idPaciente: 1 }, name: 'idx_idPaciente_ficha' },
      { key: { fechaHora: -1 }, name: 'idx_fechaHora_desc' },
      
      { key: { idMedico: 1, fechaHora: -1 }, name: 'idx_medico_fechaHora' },
      
      { key: { 'procedimientos.procedimiento': 1 }, name: 'idx_procedimientos_nombre' },
      { key: { 'procedimientos.procedimiento': 1, 'procedimientos.costo': 1 }, name: 'idx_procedimiento_costo' },
      
      { key: { idTutor: 1 }, name: 'idx_idTutor_ficha' },
      { key: { costoConsulta: 1 }, name: 'idx_costo_consulta' },
      { key: { 'procedimientos.medicosAsignados.idMedico': 1 }, name: 'idx_medicos_asignados' },
      { key: { vacunas: 1 }, name: 'idx_vacunas' }
    ]);

    console.log('Todas las colecciones e índices creados exitosamente');

    console.log('\nEstadísticas de índices:');
    const collections_with_indexes = [
      { name: TUTORTABLE, collection: db.collection(TUTORTABLE) },
      { name: PACIENTETABLE, collection: db.collection(PACIENTETABLE) },
      { name: MEDICOTABLE, collection: db.collection(MEDICOTABLE) },
      { name: FICHACLINICATABLE, collection: db.collection(FICHACLINICATABLE) }
    ];

    let totalIndexes = 0;
    for (const { name, collection } of collections_with_indexes) {
      const indexes = await collection.listIndexes().toArray();
      console.log(`   ${name}: ${indexes.length} índices`);
      totalIndexes += indexes.length;
    }
    console.log(`   TOTAL: ${totalIndexes} índices`);

  } catch (error) {
    console.error('Error creando estructura:', error);
    throw error;
  }
}

(async () => {
  try {
    await crearEstructura();
    console.log('Estructura lista en MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
