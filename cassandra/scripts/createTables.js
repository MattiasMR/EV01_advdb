require('dotenv').config();
const { connect } = require('../db');
const fs = require('fs');
const path = require('path');

async function createKeyspaceAndTables() {
  try {
    console.log('Creando keyspace y tablas en Cassandra...');
    
    const cassandra = require('cassandra-driver');
    const clientWithoutKeyspace = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOSTS || '127.0.0.1'],
      localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
      protocolOptions: {
        port: parseInt(process.env.CASSANDRA_PORT) || 9042
      }
    });

    await clientWithoutKeyspace.connect();
    console.log('Conectado a Cassandra (sin keyspace)');

    const keyspaceName = process.env.CASSANDRA_KEYSPACE || 'veterinaria';
    const createKeyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS ${keyspaceName}
      WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      };
    `;
    
    await clientWithoutKeyspace.execute(createKeyspaceQuery);
    console.log(`Keyspace '${keyspaceName}' creado o ya existe`);

    await clientWithoutKeyspace.shutdown();

    const db = await connect();

    const schemaPath = path.join(__dirname, '..', 'schema.cql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const query = schemaContent
      .replace(/--[^\n]*/g, '') 
      .replace(/\/\*[\s\S]*?\*\//g, '') 
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt && 
        stmt.length > 0 && 
        !stmt.toLowerCase().startsWith('use ') &&
        !stmt.toLowerCase().startsWith('create keyspace')
      );

    console.log(`Ejecutando ${query.length} queries...`);
    console.log('Queries a ejecutar:', query.map((s, i) => `${i+1}: ${s.substring(0, 50)}...`));

    for (let i = 0; i < query.length; i++) {
      const q = query[i].trim();
      if (q) {
        try {
          console.log(`Ejecutando query ${i + 1}: ${q.substring(0, 100)}...`);
          await db.execute(q);
          console.log(`Query ${i + 1}/${query.length} ejecutado`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Query ${i + 1}/${query.length} - ya existe`);
          } else {
            console.error(`Error en query ${i + 1}:`, error.message);
            console.error('Query completo:', q);
          }
        }
      }
    }

    console.log('\n Verificando tablas creadas...');
    const tablesQuery = `
      SELECT table_name 
      FROM system_schema.tables 
      WHERE keyspace_name = ?
    `;
    
    const result = await db.execute(tablesQuery, [keyspaceName]);
    const tableNames = result.rows.map(row => row.table_name);
    
    console.log('Tablas creadas:');
    tableNames.forEach(name => console.log(`   - ${name}`));

    console.log('\nVerificando índices...');
    const indexesQuery = `
      SELECT index_name, table_name
      FROM system_schema.indexes 
      WHERE keyspace_name = ?
    `;
    
    const indexResult = await db.execute(indexesQuery, [keyspaceName]);
    const indexes = indexResult.rows;
    
    console.log('Índices creados:');
    indexes.forEach(idx => console.log(`   - ${idx.index_name} en ${idx.table_name}`));

    console.log('\n Keyspace, tablas e índices creados exitosamente!');
    console.log(`Total: ${tableNames.length} tablas, ${indexes.length} índices`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

if (require.main === module) {
  createKeyspaceAndTables()
    .then(() => {
      console.log('Proceso completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { createKeyspaceAndTables };
