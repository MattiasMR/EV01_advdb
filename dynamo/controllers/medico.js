const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const MEDICOTABLE = process.env.MEDICOTABLE
 
exports.createMedico = async (event) => {
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
      idMedico: id,
      nombre: data.nombre,
      especialidad: data.especialidad,
      estado: data.estado,
    }

    await dynamodb.put({
      TableName: MEDICOTABLE,
      Item: params
    }).promise();

    msg = "Medico Creado"
  }
 
  return {
    statusCode,
    body: JSON.stringify({
      message: msg,
    }),
  };
};


exports.getMedicos = async (event) => {
  let statusCode = 200;
  let msg
  try{

        const result = await dynamodb.scan({
            TableName: MEDICOTABLE,
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

exports.getMedico = async (event) => {
  let statusCode, msg;
  const {id} = event.pathParameters;

  try{
    const result = await dynamodb.get({
        TableName: MEDICOTABLE,
        Key: {
            idMedico: id
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

exports.updateMedico = async (event) => {
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
        TableName: MEDICOTABLE,
        UpdateExpression:  `set ${data.attr} = :val` ,
        ExpressionAttributeValues: {
            ':val': data.value
        },
        Key: {
            idMedico: id
        },
        ReturnValues: 'ALL_NEW'
    }).promise();
    msg = "Medico actualizado"
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

exports.updateEstadoMedico = async (event) => {
  const { id } = event.pathParameters; 

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Debe proporcionar el ID del médico."
      })
    };
  }

  try {
    const getResult = await dynamodb.get({
      TableName: MEDICOTABLE,
      Key: {
        idMedico: id
      }
    }).promise();

    const medico = getResult.Item;

    if (!medico) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Médico no encontrado."
        })
      };
    }

    const currentEstado = medico.estado;
    let newEstado;

    if (currentEstado === 'ACTIVO') {
      newEstado = 'INACTIVO';
    } else if (currentEstado === 'INACTIVO') {
      newEstado = 'ACTIVO';
    } else {
      newEstado = 'ACTIVO'; // si no tiene un estado, activarlo por default
    }

    await dynamodb.update({
      TableName: MEDICOTABLE,
      UpdateExpression: "set estado = :newEstado",
      ExpressionAttributeValues: {
        ':newEstado': newEstado
      },
      Key: {
        idMedico: id
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Estado del médico ${id} actualizado a '${newEstado}'.`
      })
    };

  } catch (error) {
    console.error("Error al actualizar el estado del médico:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al ejecutar la consulta para actualizar el estado del médico."
      })
    };
  }
};



validarInput = (proceso, data) => {

  if (proceso == "crear"){
    if (!(!!data?.nombre)){
      return [400 , "Falta nombre del medico"]
    }
    if (!(!!data?.especialidad)){
      return [400, "Falta especialidad del medico"]
    }
    if (!(!!data?.estado)){
      return [400, "Falta estado del medico ('ACTIVO' o 'INACTIVO')"]
    }
  }else if (proceso == "getId"){
    if (!(!!data?.id)){
      return [400, "Falta id del medico"]
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
