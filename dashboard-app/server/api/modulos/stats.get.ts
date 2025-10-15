import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Obtener todos los módulos únicos de los turnos
    const modulosUnicos = await prisma.turno.findMany({
      where: {
        fecha: { gte: hoy }
      },
      select: {
        modulo: true
      },
      distinct: ['modulo'],
      orderBy: {
        modulo: 'asc'
      }
    })

    // Calcular estadísticas para cada módulo
    const modulosConEstadisticas = await Promise.all(
      modulosUnicos.map(async ({ modulo }) => {
        const turnosHoy = await prisma.turno.count({
          where: {
            modulo,
            fecha: { gte: hoy }
          }
        })

        const turnosAtendidos = await prisma.turno.count({
          where: {
            modulo,
            estado: 'atendido',
            fecha: { gte: hoy }
          }
        })

        const turnosAbandonados = await prisma.turno.count({
          where: {
            modulo,
            estado: 'abandonado',
            fecha: { gte: hoy }
          }
        })

        // Tiempo promedio de espera
        const turnosConTiempo = await prisma.turno.findMany({
          where: {
            modulo,
            tiempoEspera: { not: null },
            fecha: { gte: hoy }
          },
          select: { tiempoEspera: true }
        })

        const tiempoPromedioEspera =
          turnosConTiempo.length > 0
            ? Math.round(
                turnosConTiempo.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) /
                  turnosConTiempo.length
              )
            : 0

        // Tiempo promedio de atención
        const turnosConAtencion = await prisma.turno.findMany({
          where: {
            modulo,
            tiempoAtencion: { not: null },
            fecha: { gte: hoy }
          },
          select: { tiempoAtencion: true }
        })

        const tiempoPromedioAtencion =
          turnosConAtencion.length > 0
            ? Math.round(
                turnosConAtencion.reduce((sum, t) => sum + (t.tiempoAtencion || 0), 0) /
                  turnosConAtencion.length
              )
            : 0

        const tasaAtencion = turnosHoy > 0 ? ((turnosAtendidos / turnosHoy) * 100).toFixed(1) : '0'
        const tasaAbandono = turnosHoy > 0 ? ((turnosAbandonados / turnosHoy) * 100).toFixed(1) : '0'

        // Distribución por tipo de turno
        const distribucionTipos = await prisma.turno.groupBy({
          by: ['letra'],
          where: {
            modulo,
            fecha: { gte: hoy }
          },
          _count: true
        })

        // Total histórico
        const totalHistorico = await prisma.turno.count({
          where: { modulo }
        })

        return {
          modulo,
          estadisticas: {
            turnosHoy,
            turnosAtendidos,
            turnosAbandonados,
            tasaAtencion: parseFloat(tasaAtencion),
            tasaAbandono: parseFloat(tasaAbandono),
            tiempoPromedioEspera,
            tiempoPromedioAtencion,
            totalHistorico,
            distribucionTipos: distribucionTipos.map((d) => ({
              letra: d.letra,
              cantidad: d._count
            }))
          }
        }
      })
    )

    // Estadísticas generales
    const totalTurnos = await prisma.turno.count({
      where: { fecha: { gte: hoy } }
    })

    const totalAtendidos = await prisma.turno.count({
      where: {
        estado: 'atendido',
        fecha: { gte: hoy }
      }
    })

    const totalModulos = modulosUnicos.length
    const moduloMasActivo = modulosConEstadisticas.reduce(
      (max, m) => (m.estadisticas.turnosHoy > max.estadisticas.turnosHoy ? m : max),
      modulosConEstadisticas[0]
    )

    const tasaAtencionGeneral =
      totalTurnos > 0 ? ((totalAtendidos / totalTurnos) * 100).toFixed(1) : '0'

    // Calcular tiempos promedio generales
    const todosLosTiemposEspera = await prisma.turno.findMany({
      where: {
        tiempoEspera: { not: null },
        fecha: { gte: hoy }
      },
      select: { tiempoEspera: true }
    })

    const tiempoPromedioEsperaGeneral =
      todosLosTiemposEspera.length > 0
        ? Math.round(
            todosLosTiemposEspera.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) /
              todosLosTiemposEspera.length
          )
        : 0

    return {
      resumen: {
        totalModulos,
        totalTurnos,
        totalAtendidos,
        tasaAtencionGeneral: parseFloat(tasaAtencionGeneral),
        tiempoPromedioEsperaGeneral,
        moduloMasActivo: moduloMasActivo?.modulo || 0,
        turnosModuloMasActivo: moduloMasActivo?.estadisticas.turnosHoy || 0
      },
      modulos: modulosConEstadisticas.sort((a, b) => a.modulo - b.modulo),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de módulos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener estadísticas de módulos'
    })
  }
})
