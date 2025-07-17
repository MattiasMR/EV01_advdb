require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

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

// Función para obtener la conexión de la base de datos
function getDB() {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDB() primero.');
  }
  return db;
}

// Exportar la función getDB para usar en los controladores
module.exports = { getDB, connectDB };

const app = express();

// Middlewares
app.use(express.json());
app.use(morgan('dev'));

// Importar rutas
const routes = require('./routes');

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Veterinaria en MongoDB',
    version: '1.0.0',
    endpoints: {
      pacientes: '/paciente',
      medicos: '/medico',
      tutores: '/tutor',
      busquedas: '/paciente/:id/historial, /paciente/:id/fichaClinica, /paciente/:id/vacunas, /procedimientos/ranking',
      dashboard: '/dashboard/*'
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
    // Conectar a la base de datos
    await connectDB();
    
    // Iniciar el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API escuchando en 0.0.0.0:${PORT}`);
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
    await client.close();
    console.log('Conexión a MongoDB cerrada');
  }
  process.exit(0);
});

// Iniciar la aplicación
startServer();
