const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TUTORTABLE = process.env.TUTORTABLE
const PACIENTETABLE = process.env.PACIENTETABLE;
 
exports.createTutor = async (event) => {
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
      idTutor: id,
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
    }

    await dynamodb.put({
      TableName: TUTORTABLE,
      Item: params
    }).promise();

    msg = "Tutor Creado"
  }
 
  return {
    statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};


exports.getTutores = async (event) => {
  let statusCode = 200;
  let msg
  try{

        const result = await dynamodb.scan({
            TableName: TUTORTABLE,
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

exports.getTutor = async (event) => {
  let statusCode, msg;
  const {id} = event.pathParameters;

  try{
    const result = await dynamodb.get({
        TableName: TUTORTABLE,
        Key: {
            idTutor: id
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

exports.updateTutor = async (event) => {
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
        TableName: TUTORTABLE,
        UpdateExpression:  `set ${data.attr} = :val` ,
        ExpressionAttributeValues: {
            ':val': data.value
        },
        Key: {
            idTutor: id
        },
        ReturnValues: 'ALL_NEW'
    }).promise();
    msg = "Tutor actualizado"
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

exports.getPacientesByTutor = async (event) => {
  let statusCode = 200;
  let msg;
  const { id } = event.pathParameters; 

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Debe proporcionar el ID del tutor." }),
    };
  }

  try {
    const params = {
      TableName: PACIENTETABLE,
      IndexName: 'PacientesPorTutorIndex', 
      KeyConditionExpression: 'idTutor = :tutorId', 
      ExpressionAttributeValues: {
        ':tutorId': id, 
      },
      ProjectionExpression: 'idPaciente, nombre, sexo, raza', 
    };

    const result = await dynamodb.query(params).promise();

    msg = result.Items.map(item => ({
      idPaciente: item.idPaciente,
      nombre: item.nombre,
      sexo: item.sexo,
      raza: item.raza
    }));

  } catch (error) {
    console.error("Error al obtener pacientes del tutor:", error);
    statusCode = 500;
    msg = "Error al ejecutar la consulta para obtener pacientes del tutor.";
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};


validarInput = (proceso, data) => {

  if (proceso == "crear"){
    if (!(!!data?.nombre)){
      return [400 , "Falta nombre del tutor"]
    }
    if (!(!!data?.direccion)){
      return [400, "Falta direccion del tutor"]
    }
    if (!(!!data?.telefono)){
      return [400, "Falta telefono del tutor"]
    }
    if (!(!!data?.email)){
      return [400, "Falta email del tutor"]
    }
  }else if (proceso == "getId"){
    if (!(!!data?.id)){
      return [400, "Falta id del tutor"]
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
