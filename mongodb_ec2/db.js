const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGODB_URL|| 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'veterinaria';
let client, db;

async function connect() {
  if (db) return db;
  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log(`🟢 Mongo conectado a ${dbName}`);
  return db;
}

// Conecta inmediatamente al arrancar
connect().catch(err => console.error('🔴 Mongo error', err));

module.exports = { connect };
