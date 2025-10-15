/**
 * API de métricas operacionales consolidadas
 * Retorna KPIs clave del reporte piloto AURELIA
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string
  const cacId = query.cacId as string

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

  // Filtro por CAC
  if (cacId) {
    where.cacId = Number(cacId)
  }

  // Obtener datos de turnos
  const totalTransacciones = await prisma.turno.count({ where })
  const turnos = await prisma.turno.findMany({ where })

  // Calcular tasas de atención y abandono
  const turnosAtendidos = turnos.filter(t => t.estado === 'atendido').length
  const turnosAbandonados = turnos.filter(t => t.estado === 'abandonado').length

  const tasaAtencion = totalTransacciones > 0
    ? (turnosAtendidos / totalTransacciones) * 100
    : 0

  const tasaAbandono = totalTransacciones > 0
    ? (turnosAbandonados / totalTransacciones) * 100
    : 0

  // Calcular tiempos promedio
  const turnosConTiempos = turnos.filter(t => t.tiempoEspera !== null && t.tiempoAtencion !== null)

  const tiempoEsperaPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) / turnosConTiempos.length)
    : 0

  const tiempoAtencionPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoAtencion || 0), 0) / turnosConTiempos.length)
    : 0

  // Calcular promedio de transacciones por día
  const turnosPorDiaMap = turnos.reduce((acc: any, turno) => {
    const fecha = new Date(turno.fecha).toISOString().split('T')[0]
    acc[fecha] = (acc[fecha] || 0) + 1
    return acc
  }, {})

  const diasUnicos = Object.keys(turnosPorDiaMap).length
  const promedioPorDia = diasUnicos > 0
    ? Math.round(totalTransacciones / diasUnicos)
    : 0

  // Obtener métricas de encuestas
  const encuestas = await prisma.encuesta.findMany()
  const totalEncuestas = encuestas.length

  // Calcular NPS Score
  const detractores = encuestas.filter(e => e.nps >= 0 && e.nps <= 6).length
  const promotores = encuestas.filter(e => e.nps >= 9 && e.nps <= 10).length

  const npsScore = totalEncuestas > 0
    ? Math.round(((promotores - detractores) / totalEncuestas) * 100)
    : 0

  const promotoresPorcentaje = totalEncuestas > 0
    ? Math.round((promotores / totalEncuestas) * 100 * 100) / 100
    : 0

  // Promedio NPS
  const promedioNPS = totalEncuestas > 0
    ? Math.round((encuestas.reduce((sum, e) => sum + e.nps, 0) / totalEncuestas) * 10) / 10
    : 0

  return {
    // Métricas de turnos
    totalTransacciones,
    turnosAtendidos,
    turnosAbandonados,
    tasaAtencion: Math.round(tasaAtencion * 100) / 100,
    tasaAbandono: Math.round(tasaAbandono * 100) / 100,

    // Tiempos
    tiempoEsperaPromedio,      // En segundos
    tiempoAtencionPromedio,    // En segundos
    tiempoEsperaMinutos: Math.round((tiempoEsperaPromedio / 60) * 10) / 10,
    tiempoAtencionMinutos: Math.round((tiempoAtencionPromedio / 60) * 10) / 10,

    // Promedio de actividad
    promedioPorDia,
    diasRegistrados: diasUnicos,

    // Métricas de satisfacción
    npsScore,
    promedioNPS,
    promotoresPorcentaje,
    totalEncuestas,

    // Meta del reporte (70% de automatización)
    metaAutomatizacion: 70,
    automatizacionLograda: 99.7 // Basado en el reporte (99.7% de clasificación correcta)
  }
})
