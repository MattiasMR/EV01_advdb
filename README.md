# EV01 - Advanced Database Systems

## 📋 Requisitos Previos

> ⚠️ **Importante**: Asegúrate de tener Node.js versión 18.20.8 instalado. El proyecto no ha sido probado con otras versiones.

---

## 🚀 Configuración por Base de Datos

### 🔸 DynamoDB

**Requisitos:**
- Configurar credenciales AWS en `~/.aws/credentials`

**Pasos de instalación:**

1. **Clonar el proyecto**
   ```bash
   git init
   git remote add origin https://github.com/MattiasMR/EV01_advdb.git
   git config core.sparseCheckout true
   echo "dynamo/*" > .git/info/sparse-checkout
   git pull origin main
   cd dynamo/
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Poblar las tablas**
   ```bash
   node models/seed.js
   ```

4. **Desplegar el servidor**
   ```bash
   sls deploy
   ```

5. **Probar las APIs**
   - Usar Postman, curl, o cualquier cliente REST

---

### 🔸 MongoDB

**Infraestructura requerida:**
- Instancia EC2: `t3.micro`
- OS: Ubuntu Server 24.04 LTS x64
- Almacenamiento: 1x8 GiB gp3

**Pasos de instalación:**

1. **Instalar MongoDB**
   ```bash
   # Instalar mongodb-server-8.0
   https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
   ```

2. **Clonar el proyecto**
   ```bash
   git init
   git remote add origin https://github.com/MattiasMR/EV01_advdb.git
   git config core.sparseCheckout true
   echo "mongodb/*" > .git/info/sparse-checkout
   git pull origin main
   cd mongodb/
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Crear las colecciones**
   ```bash
   node models/crearColecciones.js
   ```

5. **Poblar las tablas**
   ```bash
   node models/seed.js
   ```

6. **Iniciar el servidor**
   ```bash
   node app.js
   ```

7. **Obtener endpoints**
   - Copiar el API Gateway/URL que muestre la terminal

8. **Probar las APIs**

---

### 🔸 Apache Cassandra

**Infraestructura requerida:**
- Instancia EC2: `t2.medium`
- OS: Ubuntu Server 24.04 LTS x64
- Almacenamiento: 1x8 GiB gp3

**Pasos de instalación:**

1. **Instalar Cassandra**
   ```bash
   # Instalar cassandra 4.1
   https://medium.com/@agustinafassina_92108/install-cassandra-4-1-on-ubuntu-server-22-04-ec2-aws-15a4a730657e
   ```

2. **Clonar el proyecto**
   ```bash
   git init
   git remote add origin https://github.com/MattiasMR/EV01_advdb.git
   git config core.sparseCheckout true
   echo "cassandra/*" > .git/info/sparse-checkout
   git pull origin main
   cd cassandra/
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Crear las tablas**
   ```bash
   node models/crearTablas.js
   ```

5. **Poblar las tablas**
   ```bash
   node models/seed.js
   ```

6. **Iniciar el servidor**
   ```bash
   node app.js
   ```

7. **Probar las APIs**

---

## 📡 Estructura de URLs

### **Cassandra y MongoDB (Express.js)**
- **Base URL:** `http://localhost:3000/api/`
- **Formato:** `http://localhost:3000/api/[endpoint]`

### **DynamoDB (Serverless)**
- **Base URL:** `https://[api-gateway-url]/`
- **Formato:** `https://[api-gateway-url]/[endpoint]`

### Ejemplo de uso:
```bash
curl -X GET http://localhost:3000/api/paciente
```

---

## 🔌 Endpoints Disponibles

### 👥 Pacientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/paciente` | Crear paciente |
| `GET` | `/paciente` | Obtener todos los pacientes |
| `GET` | `/paciente/{id}` | Obtener paciente por ID |
| `PUT` | `/paciente/{id}` | Actualizar paciente |

### 👨‍⚕️ Médicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/medico` | Crear médico |
| `GET` | `/medico` | Obtener todos los médicos |
| `GET` | `/medico/{id}` | Obtener médico por ID |
| `PUT` | `/medico/{id}` | Actualizar médico |
| `PATCH` | `/medico/{id}/cambiarEstado` | Cambiar estado del médico |

### 👨‍👩‍👧‍👦 Tutores
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/tutor` | Crear tutor |
| `GET` | `/tutor` | Obtener todos los tutores |
| `GET` | `/tutor/{id}` | Obtener tutor por ID |
| `PUT` | `/tutor/{id}` | Actualizar tutor |
| `GET` | `/tutor/{id}/pacientes` | Obtener pacientes de un tutor |

### 🔍 Búsquedas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/paciente/{id}/historial` | Historial del paciente |
| `GET` | `/paciente/{id}/fichaClinica` | Ficha clínica del paciente |
| `GET` | `/paciente/{id}/vacunas` | Vacunas del paciente |
| `GET` | `/procedimientos/ranking` | Ranking de procedimientos |

### 📊 Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/dashboard/volumenGastoMensual` | Volumen y gasto promedio por mes |
| `GET` | `/dashboard/distribucionEspecialidades` | Distribución por especialidad |
| `GET` | `/dashboard/topMedicamentos` | Top medicamentos |
| `GET` | `/dashboard/evolucionIngresoVsCostes` | Evolución ingresos vs costes |
| `GET` | `/dashboard/demandaVacunasMensual` | Demanda de vacunas por mes |