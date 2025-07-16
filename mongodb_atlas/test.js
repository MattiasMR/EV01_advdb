const { MongoClient } = require('mongodb');

async function main() {
  const url = 'mongodb+srv://moralesmattiasr:1234@cluster0.47akpxs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB Atlas!");

    // Aquí puedes agregar tu lógica para listar bases de datos o realizar otras operaciones
    await listDatabases(client);
 
  } catch (e) {
    console.error("Error al conectar o realizar operaciones con MongoDB:", e);
  } finally {
    await client.close();
    console.log("Conexión a MongoDB cerrada.");
  }
}

// Función de ejemplo para listar bases de datos
async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  console.log("Bases de datos:");
  databasesList.databases.forEach(db => {
    console.log(` - ${db.name}`);
  });
}

main().catch(console.error);