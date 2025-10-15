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

  // NUEVA FUNCIONALIDAD: Categorización de mejoras sugeridas
  const categorizarMejora = (comentario: string): string => {
    const texto = comentario.toLowerCase()

    // Categoría: Sistema
    if (
      texto.includes('lenta') ||
      texto.includes('lento') ||
      texto.includes('volumen') ||
      texto.includes('audio') ||
      texto.includes('totem') ||
      texto.includes('tótem') ||
      texto.includes('pantalla') ||
      texto.includes('sistema') ||
      texto.includes('velocidad') ||
      texto.includes('idioma')
    ) {
      return 'sistema'
    }

    // Categoría: Infraestructura
    if (
      texto.includes('silla') ||
      texto.includes('asiento') ||
      texto.includes('ventilación') ||
      texto.includes('ventilacion') ||
      texto.includes('aire') ||
      texto.includes('televisor') ||
      texto.includes('tv') ||
      texto.includes('pantalla') ||
      texto.includes('agua') ||
      texto.includes('baño')
    ) {
      return 'infraestructura'
    }

    // Categoría: Accesibilidad
    if (
      texto.includes('mayor') ||
      texto.includes('adulto') ||
      texto.includes('entiendo') ||
      texto.includes('entiende') ||
      texto.includes('dificil') ||
      texto.includes('difícil') ||
      texto.includes('complejo') ||
      texto.includes('ayuda')
    ) {
      return 'accesibilidad'
    }

    // Categoría: Expansión
    if (
      texto.includes('más') ||
      texto.includes('mas máquinas') ||
      texto.includes('mas maquinas') ||
      texto.includes('otro') ||
      texto.includes('punto')
    ) {
      return 'expansion'
    }

    return 'otros'
  }

  // Procesar mejoras por categoría
  const mejorasPorCategoria: Record<string, Array<{ texto: string; count: number }>> = {
    sistema: [],
    infraestructura: [],
    accesibilidad: [],
    expansion: [],
    otros: []
  }

  const mejorasMap: Record<string, { count: number; categoria: string }> = {}

  encuestas.forEach((encuesta: any) => {
    if (encuesta.comentario && encuesta.comentario.trim() && encuesta.comentario !== '-') {
      const comentario = encuesta.comentario.trim()
      const categoria = categorizarMejora(comentario)

      if (!mejorasMap[comentario]) {
        mejorasMap[comentario] = { count: 0, categoria }
      }
      mejorasMap[comentario].count++
    }
  })

  // Organizar mejoras por categoría
  Object.entries(mejorasMap).forEach(([texto, { count, categoria }]) => {
    mejorasPorCategoria[categoria].push({ texto, count })
  })

  // Ordenar cada categoría por count descendente
  Object.keys(mejorasPorCategoria).forEach(categoria => {
    mejorasPorCategoria[categoria].sort((a, b) => b.count - a.count)
  })

  return {
    totalEncuestas,
    promedioNPS: avgNPS._avg.nps || 0,
    npsScore,
    detractores,
    pasivos,
    promotores,
    distribuccionCalificacion,
    distribuccionEdad,
    distribuccionNPS,

    // NUEVA MÉTRICA: Mejoras categorizadas
    mejorasPorCategoria
  }
})
