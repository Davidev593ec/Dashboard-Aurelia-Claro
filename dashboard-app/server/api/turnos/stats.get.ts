import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string
  const letra = query.letra as string
  const cacId = query.cacId as string
  const totemId = query.totemId as string

  const where: any = {}

  if (fechaInicio || fechaFin) {
    where.fecha = {}
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin)
    }
  }

  if (letra) {
    where.letra = letra
  }

  if (cacId) {
    where.cacId = Number(cacId)
  }

  if (totemId) {
    where.totemId = Number(totemId)
  }

  // Total de turnos
  const totalTurnos = await prisma.turno.count({ where })

  // Obtener todos los turnos para cálculos
  const turnos = await prisma.turno.findMany({ where })

  // NUEVAS MÉTRICAS: Turnos atendidos y abandonados
  const turnosAtendidos = turnos.filter(t => t.estado === 'atendido').length
  const turnosAbandonados = turnos.filter(t => t.estado === 'abandonado').length

  // Tasas de atención y abandono
  const tasaAtencion = totalTurnos > 0 ? (turnosAtendidos / totalTurnos) * 100 : 0
  const tasaAbandono = totalTurnos > 0 ? (turnosAbandonados / totalTurnos) * 100 : 0

  // Promedio de tiempo total (compatibilidad)
  const avgTiempo = await prisma.turno.aggregate({
    where: {
      ...where,
      tiempo: { not: null }
    },
    _avg: {
      tiempo: true
    }
  })

  // NUEVAS MÉTRICAS: Promedios de tiempo de espera y atención
  const turnosConTiempos = turnos.filter(t => t.tiempoEspera !== null && t.tiempoAtencion !== null)
  const promedioTiempoEspera = turnosConTiempos.length > 0
    ? turnosConTiempos.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) / turnosConTiempos.length
    : 0

  const promedioTiempoAtencion = turnosConTiempos.length > 0
    ? turnosConTiempos.reduce((sum, t) => sum + (t.tiempoAtencion || 0), 0) / turnosConTiempos.length
    : 0

  // NUEVA MÉTRICA: Promedio de tiempo de uso de tótem (en segundos en BD)
  const turnosConTotem = turnos.filter(t => t.tiempoUsoTotem !== null && t.tiempoUsoTotem !== undefined)
  const promedioTiempoUsoTotem = turnosConTotem.length > 0
    ? turnosConTotem.reduce((sum, t) => sum + (t.tiempoUsoTotem || 0), 0) / turnosConTotem.length
    : 0

  // Distribución por letra
  const distribuccionLetra = Object.entries(
    turnos.reduce((acc: any, turno) => {
      acc[turno.letra] = (acc[turno.letra] || 0) + 1
      return acc
    }, {})
  ).map(([letra, count]) => ({ letra, count }))
    .sort((a: any, b: any) => b.count - a.count)

  // Distribución por módulo
  const distribuccionModulo = Object.entries(
    turnos.reduce((acc: any, turno) => {
      acc[turno.modulo] = (acc[turno.modulo] || 0) + 1
      return acc
    }, {})
  ).map(([modulo, count]) => ({ modulo: Number(modulo), count }))
    .sort((a: any, b: any) => b.count - a.count)

  // Turnos por día
  const turnosPorDiaMap = turnos.reduce((acc: any, turno) => {
    const fecha = new Date(turno.fecha).toISOString().split('T')[0]
    acc[fecha] = (acc[fecha] || 0) + 1
    return acc
  }, {})

  const turnosPorDia = Object.entries(turnosPorDiaMap)
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  // Promedio de turnos por día
  const promedioPorDia = turnosPorDia.length > 0
    ? totalTurnos / turnosPorDia.length
    : 0

  // NUEVA MÉTRICA: Abandonos y atendidos por día
  const estadoPorDiaMap = turnos.reduce((acc: any, turno) => {
    const fecha = new Date(turno.fecha).toISOString().split('T')[0]
    if (!acc[fecha]) {
      acc[fecha] = { atendidos: 0, abandonados: 0 }
    }
    if (turno.estado === 'atendido') {
      acc[fecha].atendidos++
    } else {
      acc[fecha].abandonados++
    }
    return acc
  }, {})

  const estadoPorDia = Object.entries(estadoPorDiaMap)
    .map(([fecha, stats]: [string, any]) => ({
      fecha,
      atendidos: stats.atendidos,
      abandonados: stats.abandonados,
      total: stats.atendidos + stats.abandonados
    }))
    .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  return {
    // Métricas existentes (compatibilidad)
    totalTurnos,
    promedioTiempo: avgTiempo._avg.tiempo || 0,
    distribuccionLetra,
    distribuccionModulo,
    turnosPorDia,

    // NUEVAS MÉTRICAS
    turnosAtendidos,
    turnosAbandonados,
    tasaAtencion: Math.round(tasaAtencion * 100) / 100,
    tasaAbandono: Math.round(tasaAbandono * 100) / 100,
    promedioTiempoEspera: Math.round(promedioTiempoEspera),
    promedioTiempoAtencion: Math.round(promedioTiempoAtencion),
    promedioTiempoUsoTotem: Math.round(promedioTiempoUsoTotem),
    promedioPorDia: Math.round(promedioPorDia),
    estadoPorDia // Nueva métrica para gráfica de abandonos
  }
})
