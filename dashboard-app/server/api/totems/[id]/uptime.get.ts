/**
 * API para obtener métricas de uptime de un tótem específico
 * GET /api/totems/:id/uptime
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
      statusMessage: 'ID del tótem es requerido'
    })
  }

  const totemId = Number(id)

  // Verificar que el tótem existe
  const totem = await prisma.totem.findUnique({
    where: { id: totemId },
    include: { cac: true }
  })

  if (!totem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tótem no encontrado'
    })
  }

  // Preparar filtros de fecha para métricas
  const where: any = { totemId }

  if (fechaInicio || fechaFin) {
    where.fecha = {}
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin)
    }
  }

  // Obtener métricas
  const metricas = await prisma.metricaTotem.findMany({
    where,
    orderBy: { fecha: 'asc' }
  })

  if (metricas.length === 0) {
    return {
      totem: {
        id: totem.id,
        codigo: totem.codigo,
        estado: totem.estado,
        cac: totem.cac.nombre
      },
      metricas: {
        uptimePromedio: 0,
        uptimeMeta: 99.9,
        cumpleMeta: false,
        totalRegistros: 0,
        periodo: null
      },
      historial: []
    }
  }

  // Calcular uptime promedio
  const uptimePromedio = metricas.reduce((sum, m) => sum + m.uptime, 0) / metricas.length

  // Meta de uptime según el reporte (99.9%)
  const uptimeMeta = 99.9
  const cumpleMeta = uptimePromedio >= uptimeMeta

  // Calcular total de transacciones y errores
  const totalTransacciones = metricas.reduce((sum, m) => sum + m.totalTransacciones, 0)
  const totalErrores = metricas.reduce((sum, m) => sum + m.totalErrores, 0)

  // Calcular tiempo promedio de respuesta
  const metricasConTiempo = metricas.filter(m => m.tiempoPromedioRespuesta !== null)
  const tiempoPromedioRespuesta = metricasConTiempo.length > 0
    ? metricasConTiempo.reduce((sum, m) => sum + (m.tiempoPromedioRespuesta || 0), 0) / metricasConTiempo.length
    : null

  // Preparar historial para gráficos
  const historial = metricas.map(m => ({
    fecha: m.fecha.toISOString().split('T')[0],
    uptime: m.uptime,
    transacciones: m.totalTransacciones,
    errores: m.totalErrores,
    tiempoRespuesta: m.tiempoPromedioRespuesta
  }))

  return {
    totem: {
      id: totem.id,
      codigo: totem.codigo,
      estado: totem.estado,
      cac: totem.cac.nombre,
      ultimaActividad: totem.ultimaActividad
    },
    metricas: {
      uptimePromedio: Math.round(uptimePromedio * 100) / 100,
      uptimeMeta,
      cumpleMeta,
      totalRegistros: metricas.length,
      totalTransacciones,
      totalErrores,
      tasaError: totalTransacciones > 0
        ? Math.round((totalErrores / totalTransacciones) * 10000) / 100
        : 0,
      tiempoPromedioRespuesta: tiempoPromedioRespuesta
        ? Math.round(tiempoPromedioRespuesta * 100) / 100
        : null,
      periodo: {
        inicio: metricas[0].fecha,
        fin: metricas[metricas.length - 1].fecha
      }
    },
    historial
  }
})
