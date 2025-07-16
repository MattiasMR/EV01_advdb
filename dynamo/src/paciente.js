const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const PACIENTETABLE = process.env.PACIENTETABLE
 
exports.createPaciente = async (event) => {
  let data;
  try{
    data = JSON.parse(event.body);
  }catch{
    data = {}
  }
  
  let [statusCode, msg] = validarInput("crear", data);

  if (statusCode == 200){
    const id = uuidv4();

    console.log(id)

    const params = {
      idPaciente: id,
      idTutor: data.idTutor,
      nombre: data.nombre,
      especie: data.especie,
      raza: data.raza,
      sexo: data.sexo,
    }

    await dynamodb.put({
      TableName: PACIENTETABLE,
      Item: params
    }).promise();

    msg = "Paciente Creado"
  }
 
  return {
    statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};


exports.getPacientes = async (event) => {
  let statusCode = 200;
  let msg
  try{

        const result = await dynamodb.scan({
            TableName: PACIENTETABLE,
        }).promise();

        msg = result.Items

    }catch(error){
        console.error(error);
        statusCode = 500
        msg = "Error al ejecutar consulta"
    }

  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};

exports.getPaciente = async (event) => {
  let statusCode, msg;
  const {id} = event.pathParameters;

  try{
    const result = await dynamodb.get({
        TableName: PACIENTETABLE,
        Key: {
            idPaciente: id
        }
    }).promise();
    msg = result.Item
    statusCode = 200
  }catch{
    statusCode = 500
    msg = "Error al ejecutar la consulta"
  }
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};

exports.updatePaciente = async (event) => {
  let data;
  try{
    data = JSON.parse(event.body);
  }catch{
    data = {}
  }

  let [statusCode, msg] = validarInput("update", data);
  const {id} = event.pathParameters;
  
  try{
    await dynamodb.update({
        TableName: PACIENTETABLE,
        UpdateExpression:  `set ${data.attr} = :val` ,
        ExpressionAttributeValues: {
            ':val': data.value
        },
        Key: {
            idPaciente: id
        },
        ReturnValues: 'ALL_NEW'
    }).promise();
    msg = "Paciente actualizado"
  }catch{
    console.error("Error al actualizar los datos");
    statusCode = 500;
    msg = "Error al ejecutar la consulta, probablemente el atributo no existe"
  }


  return {
      status: statusCode,
      body: JSON.stringify({ 
          message: msg
      })
  }

};




validarInput = (proceso, data) => {

  if (proceso == "crear"){
    if (!(!!data?.nombre)){
      return [400 , "Falta nombre del paciente"]
    }
    if (!(!!data?.raza)){
      return [400, "Falta raza del paciente"]
    }
    if (!(!!data?.idTutor)){
      return [400, "Falta tutor del paciente"]
    }
    if (!(!!data?.especie)){
      return [400, "Falta especie del paciente"]
    }
    if (!(!!data?.sexo)){
      return [400, "Falta sexo del paciente"]
    }
  }else if (proceso == "getId"){
    if (!(!!data?.id)){
      return [400, "Falta id del paciente"]
    }
  }else if (proceso == "update"){
    if (!(!!data?.attr)){
      return [400, "Falta el attr a modificar"]
    }   
    if (!(!!data?.value)){
      return [400, "Falta value del atributo"]
    } 
  }
  return [200,""]
}
