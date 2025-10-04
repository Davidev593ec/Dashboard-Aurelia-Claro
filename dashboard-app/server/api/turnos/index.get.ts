import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 100
  const letra = query.letra as string
  const modulo = query.modulo ? parseInt(query.modulo as string) : undefined
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string

  const skip = (page - 1) * limit

  const where: any = {}

  if (letra) {
    where.letra = letra
  }

  if (modulo) {
    where.modulo = modulo
  }

  if (fechaInicio || fechaFin) {
    where.fecha = {}
    if (fechaInicio) {
      where.fecha.gte = new Date(fechaInicio)
    }
    if (fechaFin) {
      where.fecha.lte = new Date(fechaFin)
    }
  }

  const [turnos, total] = await Promise.all([
    prisma.turno.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' }
    }),
    prisma.turno.count({ where })
  ])

  return {
    data: turnos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
