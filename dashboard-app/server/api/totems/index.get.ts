/**
 * API para listar tótems
 * GET /api/totems
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cacId = query.cacId as string
  const estado = query.estado as string

  const where: any = {}

  // Filtro por CAC
  if (cacId) {
    where.cacId = Number(cacId)
  }

  // Filtro por estado
  if (estado) {
    where.estado = estado
  }

  const totems = await prisma.totem.findMany({
    where,
    include: {
      cac: true,
      _count: {
        select: {
          turnos: true,
          metricas: true
        }
      }
    },
    orderBy: {
      codigo: 'asc'
    }
  })

  // Enriquecer con métricas adicionales
  const totemsConMetricas = await Promise.all(
    totems.map(async (totem) => {
      // Obtener última métrica
      const ultimaMetrica = await prisma.metricaTotem.findFirst({
        where: { totemId: totem.id },
        orderBy: { fecha: 'desc' }
      })

      // Calcular uptime promedio
      const metricas = await prisma.metricaTotem.findMany({
        where: { totemId: totem.id }
      })

      const uptimePromedio = metricas.length > 0
        ? metricas.reduce((sum, m) => sum + m.uptime, 0) / metricas.length
        : 100

      return {
        id: totem.id,
        codigo: totem.codigo,
        estado: totem.estado,
        ultimaActividad: totem.ultimaActividad,
        cac: {
          id: totem.cac.id,
          nombre: totem.cac.nombre,
          ciudad: totem.cac.ciudad
        },
        estadisticas: {
          totalTurnos: totem._count.turnos,
          totalMetricas: totem._count.metricas,
          uptimePromedio: Math.round(uptimePromedio * 100) / 100,
          ultimoUptime: ultimaMetrica?.uptime || null,
          ultimaFechaMetrica: ultimaMetrica?.fecha || null
        }
      }
    })
  )

  return {
    total: totemsConMetricas.length,
    data: totemsConMetricas
  }
})
