require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cassandra = require('cassandra-driver');

// Configuración de Cassandra
let client = null;

const clientOptions = {
  contactPoints: [process.env.CASSANDRA_HOSTS || '127.0.0.1'],
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'veterinaria',
  protocolOptions: {
    port: parseInt(process.env.CASSANDRA_PORT) || 9042
  }
};

async function connectCassandra() {
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

function getClient() {
  if (!client) {
    throw new Error('Cliente Cassandra no conectado. Llama a connectCassandra() primero.');
  }
  return client;
}

// Exportar la función getClient para usar en los controladores
module.exports = { getClient };

const app = express();

// Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Importar rutas
const routes = require('./routes');

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Veterinaria en Apache Cassandra',
    version: '1.0.0',
    database: 'Cassandra',
    endpoints: {
      pacientes: '/api/paciente',
      medicos: '/api/medico',
      tutores: '/api/tutor',
      busquedas: '/api/paciente/:id/historial, /api/paciente/:id/fichaClinica, /api/paciente/:id/vacunas, /api/procedimientos/ranking',
      dashboard: '/api/dashboard/*'
    }
  });
});

// Usar todas las rutas
app.use('/api', routes);

// Middlewares de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    ok: false, 
    error: err.message || 'Error interno del servidor' 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Ruta no encontrada' 
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Conectar a Cassandra
    await connectCassandra();
    
    // Probar conexión
    const testResult = await client.execute('SELECT now() FROM system.local');
    console.log('🔗 Conexión a Cassandra exitosa:', testResult.rows[0]);
    
    // Iniciar el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API Cassandra escuchando en 0.0.0.0:${PORT}`);
      console.log(`Rutas disponibles en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  if (client) {
    await client.shutdown();
    console.log('Conexión a Cassandra cerrada');
  }
  process.exit(0);
});

// Iniciar la aplicación
startServer();
