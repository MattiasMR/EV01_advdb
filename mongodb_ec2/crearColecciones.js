// createCollections_dynamo.js - ÍNDICES EXACTOS DE DYNAMODB
require('dotenv').config();
const { connect } = require('./db');

const TUTORTABLE = process.env.TUTORTABLE || 'Tutor';
const PACIENTETABLE = process.env.PACIENTETABLE || 'Paciente';
const MEDICOTABLE = process.env.MEDICOTABLE || 'Medico';
const FICHACLINICATABLE = process.env.FICHACLINICATABLE || 'FichaClinica';

async function crearEstructuraDynamoDB() {
  console.log('🏗️  Creando estructura DynamoDB en MongoDB...');
  const db = await connect();

  try {
    // Eliminar índices existentes que no corresponden a DynamoDB
    console.log('🧹 Limpiando índices incompatibles...');
    try {
      await db.collection(FICHACLINICATABLE).dropIndex('idx_idFicha');
      console.log('   ✅ Eliminado índice idx_idFicha (no existe en DynamoDB)');
    } catch (error) {
      // Índice no existe, continuar
    }

    // CREAR COLECCIONES SI NO EXISTEN
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(c => c.name);

    for (const tableName of [TUTORTABLE, PACIENTETABLE, MEDICOTABLE, FICHACLINICATABLE]) {
      if (!existingCollections.includes(tableName)) {
        await db.createCollection(tableName);
        console.log(`✅ Colección '${tableName}' creada`);
      } else {
        console.log(`ℹ️  Colección '${tableName}' ya existe`);
      }
    }

    // ÍNDICES PARA TUTORES - ESTRUCTURA DYNAMODB
    console.log('📚 Creando índices para Tutores (DynamoDB)...');
    await db.collection(TUTORTABLE).createIndexes([
      { key: { idTutor: 1 }, unique: true, name: 'idx_idTutor' },
      { key: { email: 1 }, name: 'idx_email_tutor' },
      { key: { telefono: 1 }, name: 'idx_telefono_tutor' },
      { key: { nombre: 1 }, name: 'idx_nombre_tutor' }
    ]);

    // ÍNDICES PARA PACIENTES - ESTRUCTURA DYNAMODB + GSI
    console.log('🐾 Creando índices para Pacientes (DynamoDB)...');
    await db.collection(PACIENTETABLE).createIndexes([
      { key: { idPaciente: 1 }, unique: true, name: 'idx_idPaciente' },
      { key: { idTutor: 1 }, name: 'idx_idTutor_paciente' }, // GSI: PacientesPorTutorIndex
      { key: { idTutor: 1, nombre: 1 }, name: 'idx_tutor_nombre' },
      { key: { especie: 1 }, name: 'idx_especie' },
      { key: { sexo: 1 }, name: 'idx_sexo' },
      { key: { raza: 1 }, name: 'idx_raza' }
    ]);

    // ÍNDICES PARA MÉDICOS - ESTRUCTURA DYNAMODB
    console.log('👨‍⚕️ Creando índices para Médicos (DynamoDB)...');
    await db.collection(MEDICOTABLE).createIndexes([
      { key: { idMedico: 1 }, unique: true, name: 'idx_idMedico' },
      { key: { estado: 1 }, name: 'idx_estado_medico' },
      { key: { especialidad: 1 }, name: 'idx_especialidad' },
      { key: { nombre: 1 }, name: 'idx_nombre_medico' },
      { key: { especialidad: 1, estado: 1 }, name: 'idx_especialidad_estado' }
    ]);

    // ÍNDICES PARA FICHAS CLÍNICAS - ESTRUCTURA DYNAMODB + GSI
    console.log('📋 Creando índices para Fichas Clínicas (DynamoDB)...');
    await db.collection(FICHACLINICATABLE).createIndexes([
      // Clave primaria compuesta: idPaciente (HASH) + fechaHora (RANGE)
      { key: { idPaciente: 1, fechaHora: -1 }, name: 'idx_paciente_fechaHora' },
      { key: { idPaciente: 1 }, name: 'idx_idPaciente_ficha' },
      { key: { fechaHora: -1 }, name: 'idx_fechaHora_desc' },
      
      // GSI: FichaPorMedicoIndex (idMedico + fechaHora)
      { key: { idMedico: 1, fechaHora: -1 }, name: 'idx_medico_fechaHora' },
      
      // GSI: ProcedimientoIndex (procedimiento + costo)
      { key: { 'procedimientos.procedimiento': 1 }, name: 'idx_procedimientos_nombre' },
      { key: { 'procedimientos.procedimiento': 1, 'procedimientos.costo': 1 }, name: 'idx_procedimiento_costo' },
      
      // Índices adicionales para optimización
      { key: { idTutor: 1 }, name: 'idx_idTutor_ficha' },
      { key: { costoConsulta: 1 }, name: 'idx_costo_consulta' },
      { key: { 'procedimientos.medicosAsignados.idMedico': 1 }, name: 'idx_medicos_asignados' },
      { key: { vacunas: 1 }, name: 'idx_vacunas' }
    ]);

    console.log('✅ Todas las colecciones e índices DynamoDB creados exitosamente');

    // Mostrar estadísticas de índices
    console.log('\n📊 Estadísticas de índices (estructura DynamoDB):');
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
    console.error('❌ Error creando estructura DynamoDB:', error);
    throw error;
  }
}

(async () => {
  try {
    await crearEstructuraDynamoDB();
    console.log('🎉 Estructura DynamoDB lista en MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
