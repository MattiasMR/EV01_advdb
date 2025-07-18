const { getClient } = require('../app');

// 1. Volumen de pacientes y gasto promedio por mes
exports.volumenYGastoPromedioPorMes = async (req, res) => {
    try {
        const client = getClient();
        
        // Primero obtenemos todas las fichas clínicas
        const fichasResult = await client.execute('SELECT * FROM FichaClinica');
        
        // Procesamos los datos en JavaScript
        const datosPorMes = {};
        
        fichasResult.rows.forEach(ficha => {
            let fecha;
            if (ficha.fechahora && ficha.fechahora.getTime) {
                fecha = ficha.fechahora; // Es un objeto Date
            } else if (ficha.fechahora && typeof ficha.fechahora === 'string') {
                fecha = new Date(ficha.fechahora);
            } else {
                fecha = new Date(); // Fecha por defecto si hay problemas
            }
            
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            if (!datosPorMes[mes]) {
                datosPorMes[mes] = {
                    totalPacientes: 0,
                    totalGasto: 0,
                    count: 0
                };
            }
            
            datosPorMes[mes].totalPacientes += 1;
            datosPorMes[mes].totalGasto += parseFloat(ficha.costo) || 0;
            datosPorMes[mes].count += 1;
        });
        
        // Convertimos a formato de respuesta
        const resultado = Object.keys(datosPorMes).map(mes => ({
            mes,
            totalPacientes: datosPorMes[mes].totalPacientes,
            gastoPromedio: datosPorMes[mes].count > 0 ? 
                (datosPorMes[mes].totalGasto / datosPorMes[mes].count).toFixed(2) : 0
        })).sort((a, b) => a.mes.localeCompare(b.mes));
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en volumenYGastoPromedioPorMes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 2. Distribución de pacientes por especialidad médica
exports.distribucionPorEspecialidad = async (req, res) => {
    try {
        const client = getClient();
        
        // Obtenemos todas las fichas y médicos
        const fichasResult = await client.execute('SELECT idMedico FROM FichaClinica');
        const medicosResult = await client.execute('SELECT idMedico, especialidad FROM Medico');
        
        // Crear mapa de médicos por especialidad
        const medicosPorEspecialidad = {};
        medicosResult.rows.forEach(medico => {
            medicosPorEspecialidad[medico.idmedico.toString()] = medico.especialidad;
        });
        
        // Contar pacientes por especialidad
        const conteoEspecialidades = {};
        fichasResult.rows.forEach(ficha => {
            const especialidad = medicosPorEspecialidad[ficha.idmedico.toString()] || 'Sin especialidad';
            conteoEspecialidades[especialidad] = (conteoEspecialidades[especialidad] || 0) + 1;
        });
        
        const resultado = Object.keys(conteoEspecialidades).map(especialidad => ({
            _id: especialidad,
            count: conteoEspecialidades[especialidad]
        }));
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en distribucionPorEspecialidad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 3. Top medicamentos más utilizados
exports.topMedicamentos = async (req, res) => {
    try {
        const client = getClient();
        
        // Obtenemos todas las fichas clínicas
        const fichasResult = await client.execute('SELECT medicamentos FROM FichaClinica');
        
        // Contar medicamentos
        const conteoMedicamentos = {};
        fichasResult.rows.forEach(ficha => {
            if (ficha.medicamentos && Array.isArray(ficha.medicamentos)) {
                ficha.medicamentos.forEach(medicamento => {
                    if (medicamento && typeof medicamento === 'string') {
                        // Extraemos solo el nombre del medicamento (antes del espacio y número)
                        const nombreMedicamento = medicamento.split(' ')[0];
                        conteoMedicamentos[nombreMedicamento] = (conteoMedicamentos[nombreMedicamento] || 0) + 1;
                    }
                });
            }
        });
        
        const resultado = Object.keys(conteoMedicamentos)
            .map(nombre => ({
                _id: nombre,
                count: conteoMedicamentos[nombre]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en topMedicamentos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 4. Evolución de ingresos vs costes por mes
exports.evolucionIngresosVsCostes = async (req, res) => {
    try {
        const client = getClient();
        
        // Primero obtenemos el mapeo de costos de medicamentos
        const medicamentosResult = await client.execute('SELECT nombre, costo FROM Medicamentos');
        const medCostMap = {};
        medicamentosResult.rows.forEach(med => {
            medCostMap[med.nombre] = parseFloat(med.costo) || 0;
        });
        
        const fichasResult = await client.execute('SELECT fechaHora, costo, costoConsulta, medicamentos FROM FichaClinica');
        
        // Procesamos los datos por mes
        const datosPorMes = {};
        
        fichasResult.rows.forEach(ficha => {
            let fecha;
            if (ficha.fechahora && ficha.fechahora.getTime) {
                fecha = ficha.fechahora;
            } else if (ficha.fechahora && typeof ficha.fechahora === 'string') {
                fecha = new Date(ficha.fechahora);
            } else {
                fecha = new Date();
            }
            
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            if (!datosPorMes[mes]) {
                datosPorMes[mes] = {
                    ingresos: 0,
                    costoMedicamentos: 0
                };
            }
            
            // Calculamos el ingreso total como la suma de costo + costoConsulta
            const ingresoTotal = (parseFloat(ficha.costo) || 0) + (parseFloat(ficha.costoconsulta) || 0);
            datosPorMes[mes].ingresos += ingresoTotal;
            
            // Calculamos el costo real de los medicamentos usados
            let costoMeds = 0;
            if (ficha.medicamentos && Array.isArray(ficha.medicamentos)) {
                ficha.medicamentos.forEach(medicamento => {
                    if (medicamento && typeof medicamento === 'string') {
                        costoMeds += medCostMap[medicamento] || 0;
                    }
                });
            }
            datosPorMes[mes].costoMedicamentos += costoMeds;
        });
        
        // Convertir a formato de respuesta
        const resultado = Object.keys(datosPorMes).map(mes => ({
            mes: mes,
            ingresos: parseFloat(datosPorMes[mes].ingresos.toFixed(2)),
            costeMeds: parseFloat(datosPorMes[mes].costoMedicamentos.toFixed(2)),
            ganancia: parseFloat((datosPorMes[mes].ingresos - datosPorMes[mes].costoMedicamentos).toFixed(2))
        })).sort((a, b) => a.mes.localeCompare(b.mes));
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en evolucionIngresosVsCostes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 5. Demanda de vacunas por mes
exports.demandaVacunasPorMes = async (req, res) => {
    try {
        const client = getClient();
        
        // Obtenemos todas las fichas clínicas
        const fichasResult = await client.execute('SELECT fechaHora, vacunas FROM FichaClinica');
        
        // Procesamos los datos por mes y tipo de vacuna
        const vacunasPorMes = {};
        
        fichasResult.rows.forEach(ficha => {
            let fecha;
            if (ficha.fechahora && ficha.fechahora.getTime) {
                fecha = ficha.fechahora;
            } else if (ficha.fechahora && typeof ficha.fechahora === 'string') {
                fecha = new Date(ficha.fechahora);
            } else {
                fecha = new Date();
            }
            
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            
            // Contar vacunas aplicadas por tipo
            if (ficha.vacunas && Array.isArray(ficha.vacunas)) {
                ficha.vacunas.forEach(vacuna => {
                    if (vacuna && typeof vacuna === 'string') {
                        const key = `${mes}||${vacuna}`;
                        vacunasPorMes[key] = (vacunasPorMes[key] || 0) + 1;
                    }
                });
            }
        });
        
        // Convertir a formato de respuesta
        const resultado = Object.keys(vacunasPorMes).map(key => {
            const [mes, vacuna] = key.split('||');
            return {
                mes,
                vacuna,
                aplicaciones: vacunasPorMes[key]
            };
        }).sort((a, b) => a.mes.localeCompare(b.mes) || b.aplicaciones - a.aplicaciones);
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en demandaVacunasPorMes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
