# EV01_advdb

## Pasos a seguir para replicar
> Asegurarse de tener node 18.20.8 en el entorno, no ha sido probado con otras versiones

### DynamoDB
0. Cambiar credenciales en ~/.aws/credentials
1. Extraer proyecto de mi repositorio
> git init
> git remote add origin https://github.com/MattiasMR/EV01_advdb.git
> git config core.sparseCheckout true
> echo "dynamo/*" > .git/info/sparse-checkout
> git pull origin main
> cd dynamo/
2. Instalar dependencias
> npm install
3. Poblar las tablas
> node models/seed.js
4. Abrir el servidor
> sls deploy
5. Probar apis con Postman, curl, etc.

### MongoDB
> Instancia EC2 con t3.micro y Ubuntu Server 24.04 LTS x64 con almacenamiento 1x8 GiB gp3
1. Instalar mongodb-server-8.0
2. Extraer proyecto de mi repositorio
> git init
> git remote add origin https://github.com/MattiasMR/EV01_advdb.git
> git config core.sparseCheckout true
> echo "mongodb/*" > .git/info/sparse-checkout
> git pull origin main
> cd mongodb/
3. Instalar dependencias
> npm install
4. Crear las colecciones/tablas 
> node models/crearColecciones.js
5. Poblar las tablas
> node models/seed.js
6. Abrir el servidor
> node app.js
7. Extraer api-gateway/link de los endpoints que entregue la terminal
8. Probar apis

### Apache Cassandra
> Instancia EC2 con t2.medium y Ubuntu Server 24.04 LTS x64 con almacenamiento 1x8 GiB gp3
1. Instalar cassandra 4.1
2. Extraer proyecto de mi repositorio
> git init
> git remote add origin https://github.com/MattiasMR/EV01_advdb.git
> git config core.sparseCheckout true
> echo "cassandra/*" > .git/info/sparse-checkout
> git pull origin main
> cd cassandra/
3. Instalar dependencias
> npm install
4. Crear las colecciones/tablas 
> node models/crearTablas.js
5. Poblar las tablas
> node models/seed.js
6. Abrir el servidor
> node app.js
7. Probar apis

### Endpoints - API
> ej: curl -x GET http://localhost:3000/api/paciente

>Cassandra y MongoDB (Express.js):
Usan /api como prefijo base
Estructura: http://localhost:3000/api/[ruta]

> DynamoDB (Serverless):
Sin prefijo /api
Estructura: https://[api-gateway-url]/[ruta]

#### Pacientes
- POST /paciente - Crear paciente
- GET /paciente - Obtener todos los pacientes
- GET /paciente/{id} - Obtener paciente por ID
- PUT /paciente/{id} - Actualizar paciente

#### Médicos
- POST /medico - Crear médico
- GET /medico - Obtener todos los médicos
- GET /medico/{id} - Obtener médico por ID
- PUT /medico/{id} - Actualizar médico
- PATCH /medico/{id}/cambiarEstado - Cambiar estado del médico

#### Tutores
- POST /tutor - Crear tutor
- GET /tutor - Obtener todos los tutores
- GET /tutor/{id} - Obtener tutor por ID
- PUT /tutor/{id} - Actualizar tutor
- GET /tutor/{id}/pacientes - Obtener pacientes de un tutor

#### Búsquedas
- GET /paciente/{id}/historial - Historial del paciente
- GET /paciente/{id}/fichaClinica - Ficha clínica del paciente
- GET /paciente/{id}/vacunas - Vacunas del paciente
- GET /procedimientos/ranking - Ranking de procedimientos

#### Dashboard
- GET /dashboard/volumenGastoMensual - Volumen y gasto promedio por mes
- GET /dashboard/distribucionEspecialidades - Distribución por especialidad
- GET /dashboard/topMedicamentos - Top medicamentos
- GET /dashboard/evolucionIngresoVsCostes - Evolución ingresos vs costes
- GET /dashboard/demandaVacunasMensual - Demanda de vacunas por mes