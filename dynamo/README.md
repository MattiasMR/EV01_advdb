# Sistema Veterinario - DynamoDB Implementation

Sistema de gestión veterinaria desarrollado con AWS Lambda, DynamoDB y Serverless Framework. Este README incluye toda la información necesaria para replicar el sistema en **MongoDB** y **Apache Cassandra**.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  AWS Lambda     │───▶│   DynamoDB      │
│                 │    │  (Node.js)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Estructura de Datos

### Tablas DynamoDB

#### 1. Tutor
```json
{
  "idTutor": "uuid",
  "nombre": "string",
  "direccion": "string", 
  "telefono": "string",
  "email": "string"
}
```

#### 2. Paciente
```json
{
  "idPaciente": "uuid",
  "idTutor": "uuid",
  "nombre": "string",
  "especie": "string",
  "raza": "string", 
  "sexo": "M|F"
}
```

#### 3. Medico
```json
{
  "idMedico": "uuid",
  "nombre": "string",
  "especialidad": "string",
  "estado": "ACTIVO|INACTIVO"
}
```

#### 4. FichaClinica
```json
{
  "idPaciente": "uuid",
  "fechaHora": "ISO8601",
  "idTutor": "uuid",
  "costoConsulta": "number",
  "pesoKg": "number",
  "tempC": "number", 
  "presion": "string",
  "vacunas": ["string"],
  "procedimientos": [
    {
      "procedimiento": "string",
      "costo": "number",
      "medicamentos": ["string"],
      "medicosAsignados": [
        {
          "idMedico": "uuid",
          "nombre": "string",
          "especialidad": "string"
        }
      ]
    }
  ]
}
```

#### 5. Catálogos
```json
// Procedimientos
{"idProcedimiento": "uuid", "nombre": "string"}

// Vacunas  
{"idVacuna": "uuid", "nombre": "string"}

// Medicamentos
{"idMedicamento": "uuid", "nombre": "string"}
```

## 🚀 Endpoints API

### Base URL
`https://ghpeham5oh.execute-api.us-east-1.amazonaws.com`
#### https://xxxxxx.execute-api.us-east-1.amazonaws.com la parte con xxxx está sujeta a cambio para cada nuevo stack de Cloud de AWS

### 👥 Tutores
```http
POST   /tutor              # Crear tutor
GET    /tutor              # Listar tutores  
GET    /tutor/{id}         # Obtener tutor
PUT    /tutor/{id}         # Actualizar tutor
GET    /tutor/{id}/pacientes # Pacientes del tutor
```

### 🐕 Pacientes
```http
POST   /paciente           # Crear paciente
GET    /paciente           # Listar pacientes
GET    /paciente/{id}      # Obtener paciente  
PUT    /paciente/{id}      # Actualizar paciente
```

### 👨‍⚕️ Médicos
```http
POST   /medico             # Crear médico
GET    /medico             # Listar médicos
GET    /medico/{id}        # Obtener médico
PUT    /medico/{id}        # Actualizar médico
PATCH  /medico/{id}/cambiarEstado # Cambiar estado
```

### 📋 Consultas Especializadas
```http
GET    /paciente/{id}/fichaClinica    # Ficha médica completa
GET    /paciente/{id}/historial       # Historial con costos
GET    /paciente/{id}/vacunas         # Vacunas aplicadas
GET    /procedimientos/ranking?top=5  # Ranking procedimientos
```

## 📝 Ejemplos de Endpoints

### 1. Crear Tutor
```bash
curl -X POST https://api-url/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "direccion": "Av. Principal 123",
    "telefono": "+56912345678",
    "email": "juan@email.com"
  }'
```

### 2. Crear Paciente
```bash
curl -X POST https://api-url/paciente \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Max",
    "idTutor": "uuid-del-tutor",
    "especie": "dog",
    "raza": "Golden Retriever",
    "sexo": "M"
  }'
```

### 3. Ficha Clínica
```bash
curl https://api-url/paciente/uuid-paciente/fichaClinica
```

**Respuesta:**
```json
{
  "idPaciente": "uuid",
  "idTutor": "uuid",
  "nombreTutor": "Juan Pérez",
  "vacunasAplicadas": ["Rabia", "Parvovirus"],
  "revisiones": [
    {
      "fechaHora": "2024-01-15T10:30:00",
      "datosPaciente": {
        "pesoKg": 25.5,
        "presion": "120/80", 
        "tempC": 38.2
      },
      "costoConsulta": 35000,
      "procedimientos": [
        {
          "procedimiento": "Radiografía",
          "costo": 75000,
          "medicamentos": ["Sedante 50mg"],
          "medicosAsignados": [
            {
              "idMedico": "uuid",
              "nombre": "Dr. Smith",
              "especialidad": "Radiología"
            }
          ]
        }
      ]
    }
  ]
}
```

### 4. Historial del Paciente
```bash
curl https://api-url/paciente/uuid-paciente/historial
```

**Respuesta:**
```json
{
  "idPaciente": "uuid",
  "idTutor": "uuid", 
  "nombreTutor": "Juan Pérez",
  "procedimientosRealizados": ["Radiografía", "Vacunación"],
  "consultas": [
    {
      "fechaHora": "2024-01-15T10:30:00",
      "tipo": "Consulta",
      "descripcion": "Costo base de consulta médica",
      "costo": 35000
    },
    {
      "fechaHora": "2024-01-15T10:30:00",
      "tipo": "Procedimiento", 
      "descripcion": "Radiografía",
      "costo": 75000,
      "medicamentos": ["Sedante 50mg"],
      "medicos": "Dr. García (Radiología), Dr. López (Anestesiología)"
    }
  ]
}
```

## 🛠️ Scripts de Desarrollo

### Deployment
```bash
# Instalar dependencias
npm install

# Desplegar en AWS
sls deploy

# Eliminar stack
sls remove

# Poblar con datos de prueba
node src/seed.js
```

### Estructura de Archivos
```
dynamo/
├── src/
│   ├── busquedas.js      # Endpoints especializados
│   ├── medico.js         # CRUD médicos
│   ├── paciente.js       # CRUD pacientes  
│   ├── tutor.js          # CRUD tutores
│   └── seed.js           # Poblado de datos
├── serverless.yml        # Configuración Serverless
├── package.json
└── README.md
```

## 🔄 Migración a MongoDB

### Colecciones MongoDB

#### Estructura de Documentos
```javascript
// tutores
{
  _id: ObjectId,
  idTutor: "uuid",
  nombre: "string",
  direccion: "string",
  telefono: "string", 
  email: "string"
}

// pacientes
{
  _id: ObjectId,
  idPaciente: "uuid",
  idTutor: "uuid",
  nombre: "string",
  especie: "string",
  raza: "string",
  sexo: "string"
}

// medicos
{
  _id: ObjectId,
  idMedico: "uuid", 
  nombre: "string",
  especialidad: "string",
  estado: "string"
}

// fichasClinicas
{
  _id: ObjectId,
  idPaciente: "uuid",
  fechaHora: ISODate,
  idTutor: "uuid",
  costoConsulta: Number,
  pesoKg: Number,
  tempC: Number,
  presion: "string",
  vacunas: ["string"],
  procedimientos: [
    {
      procedimiento: "string",
      costo: Number,
      medicamentos: ["string"],
      medicosAsignados: [
        {
          idMedico: "uuid",
          nombre: "string", 
          especialidad: "string"
        }
      ]
    }
  ]
}
```

### Índices MongoDB
```javascript
// Índices requeridos
db.pacientes.createIndex({ "idTutor": 1 })
db.fichasClinicas.createIndex({ "idPaciente": 1 })
db.fichasClinicas.createIndex({ "fechaHora": -1 })
db.fichasClinicas.createIndex({ "procedimientos.procedimiento": 1 })
db.medicos.createIndex({ "estado": 1 })
```

### Queries MongoDB Equivalentes

#### Ficha Clínica
```javascript
// Obtener fichas del paciente
const fichas = await db.fichasClinicas.find({
  idPaciente: "uuid"
}).sort({ fechaHora: -1 });

// Obtener info del tutor
const tutor = await db.tutores.findOne({
  idTutor: fichas[0].idTutor
}, { nombre: 1 });

// Agregar vacunas únicas
const vacunas = [...new Set(
  fichas.flatMap(f => f.vacunas || [])
)];
```

#### Ranking Procedimientos
```javascript
// Agregación MongoDB
const ranking = await db.fichasClinicas.aggregate([
  { $unwind: "$procedimientos" },
  {
    $group: {
      _id: "$procedimientos.procedimiento",
      total: { $sum: 1 },
      gasto: { $sum: "$procedimientos.costo" }
    }
  },
  { $sort: { total: -1 } },
  { $limit: 5 },
  {
    $project: {
      procedimiento: "$_id",
      total: 1,
      gasto: 1,
      _id: 0
    }
  }
]);
```

### Express.js + MongoDB
```javascript
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient('mongodb://localhost:27017');

// Ficha clínica endpoint
app.get('/paciente/:id/fichaClinica', async (req, res) => {
  const db = client.db('veterinaria');
  const { id } = req.params;
  
  const fichas = await db.collection('fichasClinicas')
    .find({ idPaciente: id })
    .sort({ fechaHora: -1 })
    .toArray();
    
  const tutor = await db.collection('tutores')
    .findOne({ idTutor: fichas[0]?.idTutor });
    
  // ... procesamiento similar al Lambda
  
  res.json({
    idPaciente: id,
    nombreTutor: tutor?.nombre,
    vacunasAplicadas: [...new Set(fichas.flatMap(f => f.vacunas || []))],
    revisiones: fichas
  });
});
```

## 🔄 Migración a Apache Cassandra

### Keyspace y Tablas

#### Crear Keyspace
```cql
CREATE KEYSPACE veterinaria 
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

USE veterinaria;
```

#### Tablas Cassandra
```cql
-- Tutores
CREATE TABLE tutores (
  id_tutor UUID PRIMARY KEY,
  nombre TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT
);

-- Pacientes  
CREATE TABLE pacientes (
  id_paciente UUID PRIMARY KEY,
  id_tutor UUID,
  nombre TEXT,
  especie TEXT,
  raza TEXT,
  sexo TEXT
);

-- Pacientes por tutor (tabla desnormalizada)
CREATE TABLE pacientes_por_tutor (
  id_tutor UUID,
  id_paciente UUID,
  nombre TEXT,
  especie TEXT,
  raza TEXT,
  sexo TEXT,
  PRIMARY KEY (id_tutor, id_paciente)
);

-- Médicos
CREATE TABLE medicos (
  id_medico UUID PRIMARY KEY,
  nombre TEXT,
  especialidad TEXT,
  estado TEXT
);

-- Médicos por estado (para consultas)
CREATE TABLE medicos_por_estado (
  estado TEXT,
  id_medico UUID,
  nombre TEXT,
  especialidad TEXT,
  PRIMARY KEY (estado, id_medico)
);

-- Fichas clínicas
CREATE TABLE fichas_clinicas (
  id_paciente UUID,
  fecha_hora TIMESTAMP,
  id_tutor UUID,
  costo_consulta INT,
  peso_kg DECIMAL,
  temp_c DECIMAL,
  presion TEXT,
  vacunas SET<TEXT>,
  procedimientos LIST<FROZEN<procedimiento_type>>,
  PRIMARY KEY (id_paciente, fecha_hora)
) WITH CLUSTERING ORDER BY (fecha_hora DESC);

-- Tipo personalizado para procedimientos
CREATE TYPE procedimiento_type (
  procedimiento TEXT,
  costo INT,
  medicamentos LIST<TEXT>,
  medicos_asignados LIST<FROZEN<medico_asignado_type>>
);

CREATE TYPE medico_asignado_type (
  id_medico UUID,
  nombre TEXT,
  especialidad TEXT
);

-- Procedimientos por popularidad (tabla materializada)
CREATE TABLE procedimientos_stats (
  procedimiento TEXT PRIMARY KEY,
  total_realizados COUNTER,
  gasto_total COUNTER
);

-- Vacunas por paciente (desnormalizada)
CREATE TABLE vacunas_paciente (
  id_paciente UUID,
  vacuna TEXT,
  fecha_aplicacion TIMESTAMP,
  PRIMARY KEY (id_paciente, vacuna)
);
```

#### Queries Cassandra

##### Insertar Ficha Clínica
```cql
INSERT INTO fichas_clinicas (
  id_paciente, fecha_hora, id_tutor, costo_consulta,
  peso_kg, temp_c, presion, vacunas, procedimientos
) VALUES (
  uuid(), '2024-01-15 10:30:00', uuid(), 35000,
  25.5, 38.2, '120/80', 
  {'Rabia', 'Parvovirus'},
  [
    {
      procedimiento: 'Radiografía',
      costo: 75000,
      medicamentos: ['Sedante 50mg'],
      medicos_asignados: [
        {
          id_medico: uuid(),
          nombre: 'Dr. Smith', 
          especialidad: 'Radiología'
        }
      ]
    }
  ]
);
```

##### Obtener Ficha Clínica
```cql
SELECT * FROM fichas_clinicas 
WHERE id_paciente = ? 
ORDER BY fecha_hora DESC;
```

##### Actualizar Estadísticas de Procedimientos
```cql
UPDATE procedimientos_stats 
SET total_realizados = total_realizados + 1,
    gasto_total = gasto_total + ?
WHERE procedimiento = ?;
```

### Node.js + Cassandra
```javascript
const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'veterinaria'
});

// Endpoint ficha clínica
app.get('/paciente/:id/fichaClinica', async (req, res) => {
  const { id } = req.params;
  
  // Obtener fichas
  const fichasQuery = 'SELECT * FROM fichas_clinicas WHERE id_paciente = ? ORDER BY fecha_hora DESC';
  const fichasResult = await client.execute(fichasQuery, [id]);
  
  // Obtener tutor
  const tutorQuery = 'SELECT nombre FROM tutores WHERE id_tutor = ?';
  const tutorResult = await client.execute(tutorQuery, [fichasResult.rows[0]?.id_tutor]);
  
  // Procesar vacunas únicas
  const vacunas = new Set();
  fichasResult.rows.forEach(f => {
    if (f.vacunas) f.vacunas.forEach(v => vacunas.add(v));
  });
  
  res.json({
    idPaciente: id,
    nombreTutor: tutorResult.rows[0]?.nombre,
    vacunasAplicadas: [...vacunas],
    revisiones: fichasResult.rows
  });
});
```

## 🔍 Comparación de Tecnologías

| Característica | DynamoDB | MongoDB | Cassandra |
|---------------|----------|---------|-----------|
| **Escalabilidad** | Automática | Manual/Sharding | Horizontal automática |
| **Consistencia** | Eventual/Fuerte | Fuerte | Eventual (tunable) |
| **Queries** | Limitadas | Flexibles | Por partition key |
| **Agregaciones** | No nativas | Pipeline robusto | Limitadas |
| **Joins** | No soporta | Lookup/$lookup | No soporta |
| **Transacciones** | Limitadas | ACID completas | Solo por partition |
| **Costo** | Pay-per-use | Licencia/Hosting | Open source |

## 📈 Recomendaciones por Caso de Uso

### DynamoDB ✅
- **Mejor para**: Apps serverless, escalado automático, integración AWS
- **Casos ideales**: IoT, gaming, mobile backends
- **Consideraciones**: Costo puede crecer, queries limitadas

### MongoDB ✅  
- **Mejor para**: Desarrollo rápido, queries complejas, agregaciones
- **Casos ideales**: CMS, e-commerce, analytics
- **Consideraciones**: Requires sharding manual para gran escala

### Cassandra ✅
- **Mejor para**: Big data, alta disponibilidad, escrituras masivas
- **Casos ideales**: Time series, logs, IoT masivo
- **Consideraciones**: Curva de aprendizaje alta, no es ACID

## 🚀 Deployment

### DynamoDB (actual)
```bash
serverless deploy
```

### MongoDB
```bash
# Docker
docker run -d -p 27017:27017 mongo

# O MongoDB Atlas (cloud)
# Configurar connection string en variables de entorno
```

### Cassandra  
```bash
# Docker
docker run -d -p 9042:9042 cassandra

# O DataStax Astra (cloud)
# Configurar connection bundle
```

## 📚 Recursos Adicionales

- [DynamoDB Best Practices](https://docs.aws.amazon.com/dynamodb/latest/developerguide/best-practices.html)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/data-modeling/)
- [Cassandra Data Modeling](https://cassandra.apache.org/doc/latest/data_modeling/)
- [Serverless Framework](https://www.serverless.com/framework/docs/)

---

**Autor**: Sistema desarrollado para evaluación ADB  
**Fecha**: Julio 2025  
**Versión**: 1.0.0
