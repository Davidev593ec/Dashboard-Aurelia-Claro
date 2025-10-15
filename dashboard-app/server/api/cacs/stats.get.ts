import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Obtener todos los CACs con sus datos relacionados
    const cacs = await prisma.cAC.findMany({
      include: {
        turnos: {
          orderBy: { fecha: 'desc' }
        },
        totems: true,
        _count: {
          select: {
            turnos: true,
            totems: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    // Calcular estadísticas para cada CAC
    const cacsConEstadisticas = await Promise.all(
      cacs.map(async (cac) => {
        const turnosHoy = await prisma.turno.count({
          where: {
            cacId: cac.id,
            fecha: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })

        const turnosAtendidos = await prisma.turno.count({
          where: {
            cacId: cac.id,
            estado: 'atendido',
            fecha: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })

        const turnosAbandonados = await prisma.turno.count({
          where: {
            cacId: cac.id,
            estado: 'abandonado',
            fecha: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })

        const totemsActivos = await prisma.totem.count({
          where: {
            cacId: cac.id,
            estado: 'activo'
          }
        })

        // Tiempo promedio de espera
        const turnosConTiempo = await prisma.turno.findMany({
          where: {
            cacId: cac.id,
            tiempoEspera: { not: null },
            fecha: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
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

        const tasaAtencion = turnosHoy > 0 ? ((turnosAtendidos / turnosHoy) * 100).toFixed(1) : '0'
        const tasaAbandono = turnosHoy > 0 ? ((turnosAbandonados / turnosHoy) * 100).toFixed(1) : '0'

        return {
          id: cac.id,
          nombre: cac.nombre,
          ciudad: cac.ciudad,
          direccion: cac.direccion,
          activo: cac.activo,
          estadisticas: {
            turnosHoy,
            turnosAtendidos,
            turnosAbandonados,
            tasaAtencion: parseFloat(tasaAtencion),
            tasaAbandono: parseFloat(tasaAbandono),
            tiempoPromedioEspera,
            totalTotems: cac._count.totems,
            totemsActivos,
            totalTurnosHistorico: cac._count.turnos
          }
        }
      })
    )

    // Estadísticas generales
    const totalCACs = cacs.length
    const cacsActivos = cacs.filter((c) => c.activo).length
    const totalTurnos = await prisma.turno.count({
      where: {
        fecha: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    const totalAtendidos = await prisma.turno.count({
      where: {
        estado: 'atendido',
        fecha: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })

    const totalTotems = await prisma.totem.count()
    const totemsActivos = await prisma.totem.count({ where: { estado: 'activo' } })

    return {
      resumen: {
        totalCACs,
        cacsActivos,
        totalTurnos,
        totalAtendidos,
        tasaAtencionGeneral: totalTurnos > 0 ? ((totalAtendidos / totalTurnos) * 100).toFixed(1) : '0',
        totalTotems,
        totemsActivos
      },
      cacs: cacsConEstadisticas,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de CACs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener estadísticas de CACs'
    })
  }
})
