CREATE KEYSPACE IF NOT EXISTS veterinaria
WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

USE veterinaria;


-- Tabla: Tutor 
CREATE TABLE IF NOT EXISTS Tutor (
    idTutor UUID PRIMARY KEY,
    nombre TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT
);

-- Tabla: Paciente 
CREATE TABLE IF NOT EXISTS Paciente (
    idPaciente UUID PRIMARY KEY,
    idTutor UUID,
    nombre TEXT,
    especie TEXT,
    raza TEXT,
    sexo TEXT
);

-- Tabla: Medico 
CREATE TABLE IF NOT EXISTS Medico (
    idMedico UUID PRIMARY KEY,
    nombre TEXT,
    especialidad TEXT,
    estado TEXT
);

-- Tabla: FichaClinica 
CREATE TABLE IF NOT EXISTS FichaClinica (
    idPaciente UUID,
    fechaHora TEXT,          
    idTutor UUID,
    idMedico UUID,           
    procedimiento TEXT,       
    costo INT,               
    costoConsulta INT,
    pesoKg FLOAT,
    tempC FLOAT,
    presion TEXT,
    vacunas LIST<TEXT>,
    medicamentos LIST<TEXT>,
    PRIMARY KEY (idPaciente, fechaHora)
) WITH CLUSTERING ORDER BY (fechaHora DESC);

-- Tabla: Medicamentos 
-- Partition Key: idMedicamento
CREATE TABLE IF NOT EXISTS Medicamentos (
    idMedicamento UUID PRIMARY KEY,
    nombre TEXT,
    costo INT
);

-- Tabla: Procedimientos 
-- Partition Key: idProcedimiento
CREATE TABLE IF NOT EXISTS Procedimientos (
    idProcedimiento UUID PRIMARY KEY,
    nombre TEXT
);

-- Tabla: Vacunas 
-- Partition Key: idVacuna
CREATE TABLE IF NOT EXISTS Vacunas (
    idVacuna UUID PRIMARY KEY,
    nombre TEXT
);


CREATE INDEX IF NOT EXISTS PacientesPorTutorIndex 
ON Paciente (idTutor);

CREATE INDEX IF NOT EXISTS FichaPorMedicoIndex
ON FichaClinica (idMedico);

CREATE INDEX IF NOT EXISTS ProcedimientoIndex
ON FichaClinica (procedimiento);




