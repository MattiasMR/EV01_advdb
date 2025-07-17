require('dotenv').config();
const cassandra = require('cassandra-driver');
const fs = require('fs');
const path = require('path');

async function createKeyspaceAndTables() {
  let clientWithoutKeyspace;
  let client;
  
  try {
    console.log('Creando keyspace y tablas en Cassandra...');
    
    // Cliente sin keyspace para crear el keyspace
    clientWithoutKeyspace = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOST || '127.0.0.1'],
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

    // Cliente con keyspace para crear las tablas
    client = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_HOST || '127.0.0.1'],
      localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
      keyspace: keyspaceName
    });

    await client.connect();
    console.log(`Conectado a Cassandra con keyspace '${keyspaceName}'`);

    const schemaPath = path.join(__dirname, 'schema.cql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const queries = schemaContent
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

    console.log(`Ejecutando ${queries.length} queries...`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (query) {
        try {
          console.log(`Ejecutando query ${i + 1}: ${query.substring(0, 80)}...`);
          await client.execute(query);
          console.log(`Query ${i + 1}/${queries.length} ejecutado`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Query ${i + 1}/${queries.length} - ya existe`);
          } else {
            console.error(`Error en query ${i + 1}:`, error.message);
            console.error('Query completo:', query);
            throw error;
          }
        }
      }
    }

    await client.shutdown();
    console.log('Conexión cerrada');
    console.log('Keyspace y tablas creados exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
    
    // Cerrar conexiones si están abiertas
    if (clientWithoutKeyspace && clientWithoutKeyspace.isConnected) {
      await clientWithoutKeyspace.shutdown();
    }
    if (client && client.isConnected) {
      await client.shutdown();
    }
    
    throw error;
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createKeyspaceAndTables()
    .then(() => {
      console.log('Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { createKeyspaceAndTables };
