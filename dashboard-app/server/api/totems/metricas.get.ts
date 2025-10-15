/**
 * API para obtener métricas agregadas de todos los tótems
 * GET /api/totems/metricas
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string

  // Obtener todos los tótems
  const totems = await prisma.totem.findMany({
    include: {
      cac: true
    }
  })

  // Preparar filtros de fecha
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

  // Obtener métricas para cada tótem
  const totemConMetricas = await Promise.all(
    totems.map(async (totem) => {
      const metricas = await prisma.metricaTotem.findMany({
        where: {
          totemId: totem.id,
          ...where
        },
        orderBy: { fecha: 'desc' },
        take: 30 // Últimos 30 días
      })

      if (metricas.length === 0) {
        return {
          id: totem.id,
          codigo: totem.codigo,
          estado: totem.estado,
          cac: totem.cac.nombre,
          ultimaActividad: totem.ultimaActividad,
          metricas: {
            uptimePromedio: 0,
            totalTransacciones: 0,
            totalErrores: 0,
            tasaError: 0,
            tiempoPromedioRespuesta: 0,
            totalDias: 0
          },
          tendencia: []
        }
      }

      // Calcular promedios
      const uptimePromedio = metricas.reduce((sum, m) => sum + m.uptime, 0) / metricas.length
      const totalTransacciones = metricas.reduce((sum, m) => sum + m.totalTransacciones, 0)
      const totalErrores = metricas.reduce((sum, m) => sum + m.totalErrores, 0)

      const metricasConTiempo = metricas.filter(m => m.tiempoPromedioRespuesta !== null)
      const tiempoPromedioRespuesta = metricasConTiempo.length > 0
        ? metricasConTiempo.reduce((sum, m) => sum + (m.tiempoPromedioRespuesta || 0), 0) / metricasConTiempo.length
        : 0

      const tasaError = totalTransacciones > 0
        ? (totalErrores / totalTransacciones) * 100
        : 0

      // Tendencia de los últimos 7 días
      const tendencia = metricas.slice(0, 7).reverse().map(m => ({
        fecha: m.fecha.toISOString().split('T')[0],
        uptime: m.uptime,
        transacciones: m.totalTransacciones,
        errores: m.totalErrores
      }))

      return {
        id: totem.id,
        codigo: totem.codigo,
        estado: totem.estado,
        cac: totem.cac.nombre,
        ultimaActividad: totem.ultimaActividad,
        metricas: {
          uptimePromedio: Math.round(uptimePromedio * 100) / 100,
          totalTransacciones,
          totalErrores,
          tasaError: Math.round(tasaError * 100) / 100,
          tiempoPromedioRespuesta: Math.round(tiempoPromedioRespuesta * 100) / 100,
          totalDias: metricas.length
        },
        tendencia
      }
    })
  )

  // Estadísticas generales
  const totalMetricas = await prisma.metricaTotem.count({ where })

  const agregados = await prisma.metricaTotem.aggregate({
    where,
    _avg: {
      uptime: true,
      tiempoPromedioRespuesta: true
    },
    _sum: {
      totalTransacciones: true,
      totalErrores: true
    }
  })

  return {
    totems: totemConMetricas,
    resumen: {
      totalTotems: totems.length,
      totemsActivos: totems.filter(t => t.estado === 'activo').length,
      totemsInactivos: totems.filter(t => t.estado === 'inactivo').length,
      uptimePromedioGeneral: Math.round((agregados._avg.uptime || 0) * 100) / 100,
      totalTransacciones: agregados._sum.totalTransacciones || 0,
      totalErrores: agregados._sum.totalErrores || 0,
      tasaErrorGeneral: agregados._sum.totalTransacciones
        ? Math.round((agregados._sum.totalErrores / agregados._sum.totalTransacciones) * 10000) / 100
        : 0,
      tiempoPromedioRespuesta: Math.round((agregados._avg.tiempoPromedioRespuesta || 0) * 100) / 100,
      totalRegistros: totalMetricas
    }
  }
})
