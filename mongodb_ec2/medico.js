// medico.js
require('dotenv').config();
const { connect } = require('./db');
const { v4: uuidv4 } = require('uuid');

const MEDICOTABLE = process.env.MEDICOTABLE;

exports.createMedico = async (event) => {
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.nombre) return { statusCode: 400, body: JSON.stringify({ message: 'Falta nombre del medico' }) };
  if (!data.especialidad) return { statusCode: 400, body: JSON.stringify({ message: 'Falta especialidad del medico' }) };
  if (!data.estado) return { statusCode: 400, body: JSON.stringify({ message: "Falta estado del medico ('ACTIVO' o 'INACTIVO')" }) };

  const db = await connect();
  const idMedico = uuidv4();
  await db.collection(MEDICOTABLE).insertOne({ idMedico, nombre: data.nombre, especialidad: data.especialidad, estado: data.estado });

  return { statusCode: 200, body: JSON.stringify({ message: 'Medico Creado', idMedico }) };
};

exports.getMedicos = async () => {
  const db = await connect();
  const items = await db.collection(MEDICOTABLE).find().toArray();
  return { statusCode: 200, body: JSON.stringify({ message: items }) };
};

exports.getMedico = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const medico = await db.collection(MEDICOTABLE).findOne({ idMedico: id });
  if (!medico) return { statusCode: 404, body: JSON.stringify({ message: 'Medico no encontrado.' }) };
  return { statusCode: 200, body: JSON.stringify({ message: medico }) };
};

exports.updateMedico = async (event) => {
  const { id } = event.pathParameters;
  let data = {};
  try { data = JSON.parse(event.body); } catch {}
  if (!data.attr)  return { statusCode: 400, body: JSON.stringify({ message: 'Falta el attr a modificar' }) };
  if (data.value === undefined) return { statusCode: 400, body: JSON.stringify({ message: 'Falta value del atributo' }) };

  const db = await connect();
  const result = await db.collection(MEDICOTABLE)
    .findOneAndUpdate(
      { idMedico: id },
      { $set: { [data.attr]: data.value } },
      { returnDocument: 'after' }
    );
  if (!result.value) return { statusCode: 404, body: JSON.stringify({ message: 'Medico no encontrado.' }) };

  return { statusCode: 200, body: JSON.stringify({ message: 'Medico actualizado', medico: result.value }) };
};

exports.updateEstadoMedico = async (event) => {
  const { id } = event.pathParameters;
  const db = await connect();
  const medico = await db.collection(MEDICOTABLE).findOne({ idMedico: id });
  if (!medico) return { statusCode: 404, body: JSON.stringify({ message: 'Médico no encontrado.' }) };

  const newEstado = medico.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  await db.collection(MEDICOTABLE).updateOne({ idMedico: id }, { $set: { estado: newEstado } });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Estado del médico ${id} actualizado a '${newEstado}'.` })
  };
};
