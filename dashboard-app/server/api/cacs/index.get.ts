/**
 * API para listar CACs (Centros de Atención al Cliente)
 * GET /api/cacs
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ciudad = query.ciudad as string
  const activo = query.activo as string

  const where: any = {}

  // Filtro por ciudad
  if (ciudad) {
    where.ciudad = ciudad
  }

  // Filtro por estado activo
  if (activo !== undefined) {
    where.activo = activo === 'true'
  }

  const cacs = await prisma.cAC.findMany({
    where,
    include: {
      _count: {
        select: {
          turnos: true,
          totems: true
        }
      }
    },
    orderBy: {
      nombre: 'asc'
    }
  })

  // Enriquecer con estadísticas adicionales
  const cacsConStats = await Promise.all(
    cacs.map(async (cac) => {
      // Turnos del día actual
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const turnosHoy = await prisma.turno.count({
        where: {
          cacId: cac.id,
          fecha: {
            gte: hoy
          }
        }
      })

      // Tótems activos
      const totemsActivos = await prisma.totem.count({
        where: {
          cacId: cac.id,
          estado: 'activo'
        }
      })

      // Último turno registrado
      const ultimoTurno = await prisma.turno.findFirst({
        where: { cacId: cac.id },
        orderBy: { horaEmision: 'desc' }
      })

      return {
        id: cac.id,
        nombre: cac.nombre,
        ciudad: cac.ciudad,
        direccion: cac.direccion,
        activo: cac.activo,
        estadisticas: {
          totalTurnos: cac._count.turnos,
          totalTotems: cac._count.totems,
          totemsActivos,
          turnosHoy,
          ultimoTurno: ultimoTurno ? {
            fecha: ultimoTurno.horaEmision,
            tipo: ultimoTurno.letra,
            ticket: ultimoTurno.ticketCompleto
          } : null
        },
        createdAt: cac.createdAt,
        updatedAt: cac.updatedAt
      }
    })
  )

  // Obtener ciudades únicas para filtros
  const ciudadesUnicas = [...new Set(cacs.map(c => c.ciudad))].sort()

  return {
    total: cacsConStats.length,
    ciudades: ciudadesUnicas,
    data: cacsConStats
  }
})
