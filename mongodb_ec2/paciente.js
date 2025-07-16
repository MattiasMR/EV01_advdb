// paciente.js
require('dotenv').config();
const { connect } = require('./db');
const { v4: uuidv4 } = require('uuid');

const PACIENTETABLE = process.env.PACIENTETABLE;

exports.createPaciente = async (event) => {
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.idTutor) return { statusCode: 400, body: JSON.stringify({ message: 'Falta tutor del paciente' }) };
  if (!data.nombre)  return { statusCode: 400, body: JSON.stringify({ message: 'Falta nombre del paciente' }) };
  if (!data.especie) return { statusCode: 400, body: JSON.stringify({ message: 'Falta especie del paciente' }) };
  if (!data.raza)    return { statusCode: 400, body: JSON.stringify({ message: 'Falta raza del paciente' }) };
  if (!data.sexo)    return { statusCode: 400, body: JSON.stringify({ message: 'Falta sexo del paciente' }) };

  const db = await connect();
  const idPaciente = uuidv4();
  await db.collection(PACIENTETABLE).insertOne({
    idPaciente, idTutor: data.idTutor, nombre: data.nombre,
    especie: data.especie, raza: data.raza, sexo: data.sexo
  });

  return { statusCode: 200, body: JSON.stringify({ message: 'Paciente Creado', idPaciente }) };
};

exports.getPacientes = async () => {
  const db = await connect();
  const items = await db.collection(PACIENTETABLE).find().toArray();
  return { statusCode: 200, body: JSON.stringify({ message: items }) };
};

exports.getPaciente = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const paciente = await db.collection(PACIENTETABLE).findOne({ idPaciente: id });
  if (!paciente) return { statusCode: 404, body: JSON.stringify({ message: 'Paciente no encontrado.' }) };
  return { statusCode: 200, body: JSON.stringify({ message: paciente }) };
};

exports.updatePaciente = async (event) => {
  const { id } = event.pathParameters;
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.attr)  return { statusCode: 400, body: JSON.stringify({ message: 'Falta el attr a modificar' }) };
  if (data.value === undefined) return { statusCode: 400, body: JSON.stringify({ message: 'Falta value del atributo' }) };

  const db = await connect();
  const result = await db.collection(PACIENTETABLE)
    .findOneAndUpdate(
      { idPaciente: id },
      { $set: { [data.attr]: data.value } },
      { returnDocument: 'after' }
    );
  if (!result.value) return { statusCode: 404, body: JSON.stringify({ message: 'Paciente no encontrado.' }) };

  return { statusCode: 200, body: JSON.stringify({ message: 'Paciente actualizado', paciente: result.value }) };
};
