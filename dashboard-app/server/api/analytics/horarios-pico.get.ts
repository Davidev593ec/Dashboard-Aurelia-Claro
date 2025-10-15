/**
 * API para analizar horarios pico
 * GET /api/analytics/horarios-pico
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string

  const where: any = {}

  // Filtros de fecha
  if (fechaInicio || fechaFin) {
    where.fecha = {}
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin)
    }
  }

  // Obtener datos de horarios pico
  const horariosPico = await prisma.horarioPico.findMany({
    where,
    orderBy: [
      { fecha: 'asc' },
      { hora: 'asc' }
    ]
  })

  if (horariosPico.length === 0) {
    return {
      totalRegistros: 0,
      horarioPicoIdentificado: null,
      horarioMenosOcupado: null,
      promedioTurnos: 0,
      tasaAbandonoPromedio: 0,
      analisisPorHora: [],
      analisisPorDia: [],
      heatmapData: []
    }
  }

  // Análisis por hora (agrupado)
  const turnosPorHora: Record<number, {
    totalTurnos: number
    totalAtendidos: number
    totalAbandonados: number
    registros: number
  }> = {}

  for (let hora = 0; hora < 24; hora++) {
    turnosPorHora[hora] = {
      totalTurnos: 0,
      totalAtendidos: 0,
      totalAbandonados: 0,
      registros: 0
    }
  }

  horariosPico.forEach(hp => {
    turnosPorHora[hp.hora].totalTurnos += hp.totalTurnos
    turnosPorHora[hp.hora].totalAtendidos += hp.turnosAtendidos
    turnosPorHora[hp.hora].totalAbandonados += hp.turnosAbandonados
    turnosPorHora[hp.hora].registros++
  })

  const analisisPorHora = Object.entries(turnosPorHora).map(([hora, data]) => {
    const promedioTurnos = data.registros > 0 ? data.totalTurnos / data.registros : 0
    const tasaAbandono = data.totalTurnos > 0
      ? (data.totalAbandonados / data.totalTurnos) * 100
      : 0

    return {
      hora: Number(hora),
      horaFormato: `${hora.toString().padStart(2, '0')}:00`,
      promedioTurnos: Math.round(promedioTurnos),
      totalTurnos: data.totalTurnos,
      totalAtendidos: data.totalAtendidos,
      totalAbandonados: data.totalAbandonados,
      tasaAbandono: Math.round(tasaAbandono * 100) / 100,
      registros: data.registros
    }
  }).filter(h => h.registros > 0)
    .sort((a, b) => a.hora - b.hora)

  // Identificar horario pico
  const horarioPicoMax = analisisPorHora.reduce((max, h) =>
    h.promedioTurnos > max.promedioTurnos ? h : max
  , analisisPorHora[0])

  // Identificar horario menos ocupado
  const horarioMenosOcupado = analisisPorHora.reduce((min, h) =>
    h.promedioTurnos < min.promedioTurnos ? h : min
  , analisisPorHora[0])

  // Análisis por día de la semana
  const turnosPorDia: Record<string, {
    totalTurnos: number
    totalAbandonados: number
    registros: number
  }> = {}

  horariosPico.forEach(hp => {
    const fecha = new Date(hp.fecha)
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' })

    if (!turnosPorDia[diaSemana]) {
      turnosPorDia[diaSemana] = {
        totalTurnos: 0,
        totalAbandonados: 0,
        registros: 0
      }
    }

    turnosPorDia[diaSemana].totalTurnos += hp.totalTurnos
    turnosPorDia[diaSemana].totalAbandonados += hp.turnosAbandonados
    turnosPorDia[diaSemana].registros++
  })

  const analisisPorDia = Object.entries(turnosPorDia).map(([dia, data]) => ({
    dia,
    promedioTurnos: Math.round(data.totalTurnos / data.registros),
    totalTurnos: data.totalTurnos,
    tasaAbandono: data.totalTurnos > 0
      ? Math.round((data.totalAbandonados / data.totalTurnos) * 10000) / 100
      : 0
  }))

  // Heatmap data (fecha x hora)
  const heatmapData = horariosPico.map(hp => ({
    fecha: hp.fecha.toISOString().split('T')[0],
    hora: hp.hora,
    turnos: hp.totalTurnos,
    tasaAbandono: hp.tasaAbandono || 0
  }))

  // Calcular promedio general
  const totalTurnos = horariosPico.reduce((sum, hp) => sum + hp.totalTurnos, 0)
  const promedioTurnos = Math.round(totalTurnos / horariosPico.length)

  // Tasa de abandono promedio
  const totalAbandonados = horariosPico.reduce((sum, hp) => sum + hp.turnosAbandonados, 0)
  const tasaAbandonoPromedio = totalTurnos > 0
    ? Math.round((totalAbandonados / totalTurnos) * 10000) / 100
    : 0

  // Top 10 horarios con mayor demanda
  const topHorarios = [...horariosPico]
    .sort((a, b) => b.totalTurnos - a.totalTurnos)
    .slice(0, 10)

  // Horas más concurridas (top 3)
  const horasMasConcurridas = [...analisisPorHora]
    .sort((a, b) => b.promedioTurnos - a.promedioTurnos)
    .slice(0, 3)
    .map(h => formatHoraRange(h.hora))

  // Promedio de turnos por hora (solo horas con datos)
  const promedioTurnosPorHora = analisisPorHora.length > 0
    ? analisisPorHora.reduce((sum, h) => sum + h.promedioTurnos, 0) / analisisPorHora.length
    : 0

  return {
    totalHorarios: horariosPico.length,
    totalRegistros: horariosPico.length,
    horarioPicoIdentificado: horarioPicoMax,
    horarioMenosOcupado,
    promedioTurnos,
    promedioTurnosPorHora,
    tasaAbandonoPromedio,
    topHorarios,
    horasMasConcurridas,
    analisisPorHora,
    analisisPorDia,
    heatmapData,
    recomendaciones: generarRecomendaciones(analisisPorHora, tasaAbandonoPromedio)
  }
})

// Función auxiliar para formatear rango de hora
function formatHoraRange(hora: number): string {
  return `${hora.toString().padStart(2, '0')}:00`
}

// Función auxiliar para generar recomendaciones
function generarRecomendaciones(
  analisisPorHora: any[],
  tasaAbandonoPromedio: number
): Array<{ tipo: string; titulo: string; descripcion: string; accion?: string; prioridad: string }> {
  const recomendaciones: Array<{ tipo: string; titulo: string; descripcion: string; accion?: string; prioridad: string }> = []

  // Identificar horas con alta tasa de abandono
  const horasConAltaAbandono = analisisPorHora.filter(h => h.tasaAbandono > 10)

  if (horasConAltaAbandono.length > 0) {
    const horasAfectadas = horasConAltaAbandono.map(h => h.horaFormato).join(', ')
    recomendaciones.push({
      tipo: 'abandono',
      titulo: 'Alta Tasa de Abandono Detectada',
      descripcion: `Se detectaron ${horasConAltaAbandono.length} horas con tasa de abandono superior al 10% (${horasAfectadas}).`,
      accion: 'Aumentar personal en estos horarios específicos o mejorar la eficiencia del servicio.',
      prioridad: 'alta'
    })
  }

  // Identificar horas pico
  const horaPico = analisisPorHora.reduce((max, h) => h.promedioTurnos > max.promedioTurnos ? h : max, analisisPorHora[0])

  if (horaPico.promedioTurnos > 150) {
    recomendaciones.push({
      tipo: 'congestion',
      titulo: 'Congestión en Horario Pico',
      descripcion: `El horario pico es a las ${horaPico.horaFormato} con ${horaPico.promedioTurnos} turnos promedio.`,
      accion: 'Considere agregar más tótems o personal de atención durante este horario.',
      prioridad: 'media'
    })
  }

  // Tasa de abandono general
  if (tasaAbandonoPromedio > 10) {
    recomendaciones.push({
      tipo: 'meta',
      titulo: 'Meta de Abandono No Cumplida',
      descripcion: `La tasa de abandono promedio (${tasaAbandonoPromedio.toFixed(2)}%) supera la meta del 10%.`,
      accion: 'Revise los tiempos de espera y considere optimizar los procesos de atención.',
      prioridad: 'alta'
    })
  } else {
    recomendaciones.push({
      tipo: 'exito',
      titulo: 'Meta de Abandono Cumplida',
      descripcion: `La tasa de abandono promedio (${tasaAbandonoPromedio.toFixed(2)}%) está dentro de la meta del 10%.`,
      prioridad: 'baja'
    })
  }

  return recomendaciones
}
