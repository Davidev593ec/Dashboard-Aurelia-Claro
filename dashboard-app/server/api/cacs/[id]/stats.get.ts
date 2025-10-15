/**
 * API para obtener estadísticas de un CAC específico
 * GET /api/cacs/:id/stats
 */

import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID del CAC es requerido'
    })
  }

  const cacId = Number(id)

  // Verificar que el CAC existe
  const cac = await prisma.cAC.findUnique({
    where: { id: cacId },
    include: {
      totems: true
    }
  })

  if (!cac) {
    throw createError({
      statusCode: 404,
      statusMessage: 'CAC no encontrado'
    })
  }

  // Preparar filtros de fecha para turnos
  const where: any = { cacId }

  if (fechaInicio || fechaFin) {
    where.fecha = {}
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin)
    }
  }

  // Obtener turnos
  const turnos = await prisma.turno.findMany({ where })
  const totalTurnos = turnos.length

  // Calcular métricas operacionales
  const turnosAtendidos = turnos.filter(t => t.estado === 'atendido').length
  const turnosAbandonados = turnos.filter(t => t.estado === 'abandonado').length

  const tasaAtencion = totalTurnos > 0 ? (turnosAtendidos / totalTurnos) * 100 : 0
  const tasaAbandono = totalTurnos > 0 ? (turnosAbandonados / totalTurnos) * 100 : 0

  // Tiempos promedio
  const turnosConTiempos = turnos.filter(t => t.tiempoEspera !== null && t.tiempoAtencion !== null)
  const tiempoEsperaPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) / turnosConTiempos.length)
    : 0

  const tiempoAtencionPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoAtencion || 0), 0) / turnosConTiempos.length)
    : 0

  // Distribución por tipo de turno
  const distribuccionTipos = Object.entries(
    turnos.reduce((acc: any, turno) => {
      acc[turno.letra] = (acc[turno.letra] || 0) + 1
      return acc
    }, {})
  ).map(([tipo, count]) => ({ tipo, count }))
    .sort((a: any, b: any) => b.count - a.count)

  // Distribución por módulo
  const distribuccionModulos = Object.entries(
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

  const promedioPorDia = turnosPorDia.length > 0 ? Math.round(totalTurnos / turnosPorDia.length) : 0

  // Estadísticas de tótems
  const totemsStats = await Promise.all(
    cac.totems.map(async (totem) => {
      const turnosTotem = await prisma.turno.count({
        where: {
          totemId: totem.id,
          ...where
        }
      })

      const metricasTotem = await prisma.metricaTotem.findMany({
        where: { totemId: totem.id }
      })

      const uptimePromedio = metricasTotem.length > 0
        ? metricasTotem.reduce((sum, m) => sum + m.uptime, 0) / metricasTotem.length
        : 0

      return {
        id: totem.id,
        codigo: totem.codigo,
        estado: totem.estado,
        turnos: turnosTotem,
        uptimePromedio: Math.round(uptimePromedio * 100) / 100
      }
    })
  )

  return {
    cac: {
      id: cac.id,
      nombre: cac.nombre,
      ciudad: cac.ciudad,
      direccion: cac.direccion,
      activo: cac.activo
    },
    periodo: {
      inicio: fechaInicio || 'Todos',
      fin: fechaFin || 'Todos',
      dias: turnosPorDia.length
    },
    metricas: {
      totalTurnos,
      turnosAtendidos,
      turnosAbandonados,
      tasaAtencion: Math.round(tasaAtencion * 100) / 100,
      tasaAbandono: Math.round(tasaAbandono * 100) / 100,
      tiempoEsperaPromedio,
      tiempoAtencionPromedio,
      promedioPorDia
    },
    distribuciones: {
      porTipo: distribuccionTipos,
      porModulo: distribuccionModulos,
      porDia: turnosPorDia
    },
    totems: {
      total: cac.totems.length,
      activos: cac.totems.filter(t => t.estado === 'activo').length,
      detalle: totemsStats
    }
  }
})
