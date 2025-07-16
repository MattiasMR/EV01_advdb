// tutor.js
require('dotenv').config();
const { connect } = require('./db');
const { v4: uuidv4 } = require('uuid');

const TUTORTABLE = process.env.TUTORTABLE;
const PACIENTETABLE = process.env.PACIENTETABLE;

exports.createTutor = async (event) => {
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.nombre)    return { statusCode: 400, body: JSON.stringify({ message: 'Falta nombre del tutor' }) };
  if (!data.direccion) return { statusCode: 400, body: JSON.stringify({ message: 'Falta direccion del tutor' }) };
  if (!data.telefono)  return { statusCode: 400, body: JSON.stringify({ message: 'Falta telefono del tutor' }) };
  if (!data.email)     return { statusCode: 400, body: JSON.stringify({ message: 'Falta email del tutor' }) };

  const db = await connect();
  const idTutor = uuidv4();
  await db.collection(TUTORTABLE).insertOne({
    idTutor, nombre: data.nombre,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email
  });

  return { statusCode: 200, body: JSON.stringify({ message: 'Tutor Creado', idTutor }) };
};

exports.getTutores = async () => {
  const db = await connect();
  const items = await db.collection(TUTORTABLE).find().toArray();
  return { statusCode: 200, body: JSON.stringify({ message: items }) };
};

exports.getTutor = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const tutor = await db.collection(TUTORTABLE).findOne({ idTutor: id });
  if (!tutor) return { statusCode: 404, body: JSON.stringify({ message: 'Tutor no encontrado.' }) };
  return { statusCode: 200, body: JSON.stringify({ message: tutor }) };
};

exports.updateTutor = async (event) => {
  const { id } = event.pathParameters;
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.attr)  return { statusCode: 400, body: JSON.stringify({ message: 'Falta el attr a modificar' }) };
  if (data.value === undefined) return { statusCode: 400, body: JSON.stringify({ message: 'Falta value del atributo' }) };

  const db = await connect();
  const result = await db.collection(TUTORTABLE)
    .findOneAndUpdate(
      { idTutor: id },
      { $set: { [data.attr]: data.value } },
      { returnDocument: 'after' }
    );
  if (!result.value) return { statusCode: 404, body: JSON.stringify({ message: 'Tutor no encontrado.' }) };

  return { statusCode: 200, body: JSON.stringify({ message: 'Tutor actualizado', tutor: result.value }) };
};

exports.getPacientesByTutor = async (event) => {
  const { id } = event.pathParameters;
  if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Debe proporcionar el ID del tutor.' }) };

  const db = await connect();
  const pacientes = await db.collection(PACIENTETABLE)
    .find(
      { idTutor: id },
      { projection: { idPaciente: 1, nombre: 1, sexo: 1, raza: 1 } }
    )
    .toArray();

  return { statusCode: 200, body: JSON.stringify({ message: pacientes }) };
};
