import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Obtener todos los tótems con sus datos relacionados
    const totems = await prisma.totem.findMany({
      include: {
        cac: true,
        turnos: {
          where: {
            fecha: { gte: hoy }
          }
        },
        metricas: {
          where: {
            fecha: { gte: hoy }
          },
          orderBy: { fecha: 'desc' },
          take: 1
        }
      },
      orderBy: { codigo: 'asc' }
    })

    // Calcular estadísticas para cada tótem
    const totemsConEstadisticas = await Promise.all(
      totems.map(async (totem) => {
        const turnosHoy = totem.turnos.length
        const turnosAtendidos = totem.turnos.filter((t) => t.estado === 'atendido').length
        const turnosAbandonados = totem.turnos.filter((t) => t.estado === 'abandonado').length

        const tasaAtencion = turnosHoy > 0 ? ((turnosAtendidos / turnosHoy) * 100).toFixed(1) : '0'
        const tasaAbandono = turnosHoy > 0 ? ((turnosAbandonados / turnosHoy) * 100).toFixed(1) : '0'

        // Tiempo promedio de espera
        const turnosConTiempo = totem.turnos.filter((t) => t.tiempoEspera !== null)
        const tiempoPromedioEspera =
          turnosConTiempo.length > 0
            ? Math.round(
                turnosConTiempo.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) /
                  turnosConTiempo.length
              )
            : 0

        // Métricas del día
        const metricasHoy = totem.metricas[0]
        const uptime = metricasHoy?.uptime || 0
        const totalTransacciones = metricasHoy?.totalTransacciones || turnosHoy
        const totalErrores = metricasHoy?.totalErrores || 0
        const tiempoRespuesta = metricasHoy?.tiempoPromedioRespuesta || 0

        // Calcular tiempo desde última actividad
        const tiempoInactivo = new Date().getTime() - new Date(totem.ultimaActividad).getTime()
        const minutosInactivo = Math.floor(tiempoInactivo / 60000)

        return {
          id: totem.id,
          codigo: totem.codigo,
          estado: totem.estado,
          cac: {
            id: totem.cac.id,
            nombre: totem.cac.nombre,
            ciudad: totem.cac.ciudad
          },
          ultimaActividad: totem.ultimaActividad,
          minutosInactivo,
          estadisticas: {
            turnosHoy,
            turnosAtendidos,
            turnosAbandonados,
            tasaAtencion: parseFloat(tasaAtencion),
            tasaAbandono: parseFloat(tasaAbandono),
            tiempoPromedioEspera,
            uptime,
            totalTransacciones,
            totalErrores,
            tiempoRespuesta: tiempoRespuesta ? Math.round(tiempoRespuesta) : 0,
            tasaErrores:
              totalTransacciones > 0
                ? ((totalErrores / totalTransacciones) * 100).toFixed(1)
                : '0'
          }
        }
      })
    )

    // Estadísticas generales
    const totalTotems = totems.length
    const totemsActivos = totems.filter((t) => t.estado === 'activo').length
    const totemsInactivos = totems.filter((t) => t.estado === 'inactivo').length
    const totemsMantenimiento = totems.filter((t) => t.estado === 'mantenimiento').length

    const turnosTotales = totemsConEstadisticas.reduce(
      (sum, t) => sum + t.estadisticas.turnosHoy,
      0
    )
    const atendidosTotales = totemsConEstadisticas.reduce(
      (sum, t) => sum + t.estadisticas.turnosAtendidos,
      0
    )
    const uptimePromedio =
      totalTotems > 0
        ? (
            totemsConEstadisticas.reduce((sum, t) => sum + t.estadisticas.uptime, 0) / totalTotems
          ).toFixed(1)
        : '0'

    const transaccionesTotales = totemsConEstadisticas.reduce(
      (sum, t) => sum + t.estadisticas.totalTransacciones,
      0
    )
    const erroresTotales = totemsConEstadisticas.reduce(
      (sum, t) => sum + t.estadisticas.totalErrores,
      0
    )

    return {
      resumen: {
        totalTotems,
        totemsActivos,
        totemsInactivos,
        totemsMantenimiento,
        turnosTotales,
        atendidosTotales,
        tasaAtencionGeneral:
          turnosTotales > 0 ? ((atendidosTotales / turnosTotales) * 100).toFixed(1) : '0',
        uptimePromedio: parseFloat(uptimePromedio),
        transaccionesTotales,
        erroresTotales,
        tasaErroresGeneral:
          transaccionesTotales > 0
            ? ((erroresTotales / transaccionesTotales) * 100).toFixed(1)
            : '0'
      },
      totems: totemsConEstadisticas,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de tótems:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener estadísticas de tótems'
    })
  }
})
