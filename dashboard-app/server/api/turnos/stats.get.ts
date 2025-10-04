import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const fechaInicio = query.fechaInicio as string
  const fechaFin = query.fechaFin as string
  const letra = query.letra as string

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

  // Total de turnos
  const totalTurnos = await prisma.turno.count({ where })

  // Promedio de tiempo de atención
  const avgTiempo = await prisma.turno.aggregate({
    where: {
      ...where,
      tiempo: { not: null }
    },
    _avg: {
      tiempo: true
    }
  })

  // Distribución por letra usando groupBy
  const turnos = await prisma.turno.findMany({ where })

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

  return {
    totalTurnos,
    promedioTiempo: avgTiempo._avg.tiempo || 0,
    distribuccionLetra,
    distribuccionModulo,
    turnosPorDia
  }
})
