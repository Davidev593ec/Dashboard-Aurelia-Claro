import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  // Total de encuestas
  const totalEncuestas = await prisma.encuesta.count()

  // Promedio NPS
  const avgNPS = await prisma.encuesta.aggregate({
    _avg: {
      nps: true
    }
  })

  // Obtener todas las encuestas para procesar estadísticas
  const encuestas = await prisma.encuesta.findMany()

  // Distribución por NPS (Detractores, Pasivos, Promotores)
  const detractores = encuestas.filter(e => e.nps >= 0 && e.nps <= 6).length
  const pasivos = encuestas.filter(e => e.nps >= 7 && e.nps <= 8).length
  const promotores = encuestas.filter(e => e.nps >= 9 && e.nps <= 10).length

  // Calcular NPS Score
  const npsScore = totalEncuestas > 0
    ? Math.round(((promotores - detractores) / totalEncuestas) * 100)
    : 0

  // Distribución por calificación
  const distribuccionCalificacion = Object.entries(
    encuestas.reduce((acc: any, encuesta) => {
      acc[encuesta.calificacion] = (acc[encuesta.calificacion] || 0) + 1
      return acc
    }, {})
  ).map(([calificacion, count]) => ({ calificacion, count }))
    .sort((a: any, b: any) => b.count - a.count)

  // Distribución por rango de edad
  const distribuccionEdad = Object.entries(
    encuestas.reduce((acc: any, encuesta) => {
      const edad = encuesta.rangoEdad || 'Sin especificar'
      acc[edad] = (acc[edad] || 0) + 1
      return acc
    }, {})
  ).map(([rangoEdad, count]) => ({ rangoEdad, count }))
    .sort((a: any, b: any) => b.count - a.count)

  // Distribución detallada de NPS (0-10)
  const distribuccionNPS = Object.entries(
    encuestas.reduce((acc: any, encuesta) => {
      acc[encuesta.nps] = (acc[encuesta.nps] || 0) + 1
      return acc
    }, {})
  ).map(([nps, count]) => ({ nps: Number(nps), count }))
    .sort((a: any, b: any) => a.nps - b.nps)

  return {
    totalEncuestas,
    promedioNPS: avgNPS._avg.nps || 0,
    npsScore,
    detractores,
    pasivos,
    promotores,
    distribuccionCalificacion,
    distribuccionEdad,
    distribuccionNPS
  }
})
