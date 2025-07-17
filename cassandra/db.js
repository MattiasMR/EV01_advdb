require('dotenv').config();
const cassandra = require('cassandra-driver');

let client = null;

const clientOptions = {
  contactPoints: [process.env.CASSANDRA_HOSTS || '127.0.0.1'],
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'veterinaria',
  protocolOptions: {
    port: parseInt(process.env.CASSANDRA_PORT) || 9042
  }
};

async function connect() {
  if (!client) {
    try {
      client = new cassandra.Client(clientOptions);
      await client.connect();
      console.log('Conectado a Cassandra:', process.env.CASSANDRA_KEYSPACE);
    } catch (error) {
      console.error('Error conectando a Cassandra:', error);
      throw error;
    }
  }
  return client;
}

async function testConnection() {
  try {
    const db = await connect();
    const result = await db.execute('SELECT now() FROM system.local');
    console.log('🔗 Conexión a Cassandra exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error en conexión de prueba:', error);
    return false;
  }
}


async function disconnect() {
  if (client) {
    await client.shutdown();
    client = null;
    console.log('Conexión a Cassandra cerrada');
  }
}

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  testConnection,
  disconnect
};
