import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Obtener todos los tipos (letras) únicos
    const tiposUnicos = await prisma.turno.findMany({
      where: {
        fecha: { gte: hoy }
      },
      select: {
        letra: true
      },
      distinct: ['letra'],
      orderBy: {
        letra: 'asc'
      }
    })

    // Descripción de tipos de turnos
    const descripcionesTipos: Record<string, string> = {
      V: 'Ventas',
      M: 'Mesa de Ayuda',
      RR: 'Reclamos y Recursos',
      E: 'Ejecutivos',
      H: 'Help Desk'
    }

    // Calcular estadísticas para cada tipo
    const tiposConEstadisticas = await Promise.all(
      tiposUnicos.map(async ({ letra }) => {
        const turnosHoy = await prisma.turno.count({
          where: {
            letra,
            fecha: { gte: hoy }
          }
        })

        const turnosAtendidos = await prisma.turno.count({
          where: {
            letra,
            estado: 'atendido',
            fecha: { gte: hoy }
          }
        })

        const turnosAbandonados = await prisma.turno.count({
          where: {
            letra,
            estado: 'abandonado',
            fecha: { gte: hoy }
          }
        })

        // Tiempo promedio de espera
        const turnosConTiempo = await prisma.turno.findMany({
          where: {
            letra,
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
            letra,
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

        // Distribución por módulo
        const distribucionModulos = await prisma.turno.groupBy({
          by: ['modulo'],
          where: {
            letra,
            fecha: { gte: hoy }
          },
          _count: true,
          orderBy: {
            modulo: 'asc'
          }
        })

        // Distribución por CAC
        const distribucionCACs = await prisma.turno.groupBy({
          by: ['cacId'],
          where: {
            letra,
            cacId: { not: null },
            fecha: { gte: hoy }
          },
          _count: true
        })

        const cacsConNombres = await Promise.all(
          distribucionCACs.map(async (d) => {
            if (!d.cacId) return null
            const cac = await prisma.cAC.findUnique({
              where: { id: d.cacId }
            })
            return {
              cacId: d.cacId,
              cacNombre: cac?.nombre || 'Desconocido',
              cantidad: d._count
            }
          })
        )

        // Total histórico
        const totalHistorico = await prisma.turno.count({
          where: { letra }
        })

        // Horarios con más demanda
        const horariosPico = await prisma.turno.findMany({
          where: {
            letra,
            fecha: { gte: hoy }
          },
          select: {
            horaEmision: true
          }
        })

        const distribucionHoras: Record<number, number> = {}
        horariosPico.forEach((t) => {
          const hora = new Date(t.horaEmision).getHours()
          distribucionHoras[hora] = (distribucionHoras[hora] || 0) + 1
        })

        const horaPico = Object.entries(distribucionHoras).reduce(
          (max, [hora, count]) =>
            count > max.count ? { hora: parseInt(hora), count } : max,
          { hora: 0, count: 0 }
        )

        return {
          letra,
          descripcion: descripcionesTipos[letra] || 'Tipo desconocido',
          estadisticas: {
            turnosHoy,
            turnosAtendidos,
            turnosAbandonados,
            tasaAtencion: parseFloat(tasaAtencion),
            tasaAbandono: parseFloat(tasaAbandono),
            tiempoPromedioEspera,
            tiempoPromedioAtencion,
            totalHistorico,
            horaPico: horaPico.hora,
            turnosEnHoraPico: horaPico.count,
            distribucionModulos: distribucionModulos.map((d) => ({
              modulo: d.modulo,
              cantidad: d._count
            })),
            distribucionCACs: cacsConNombres.filter((c) => c !== null)
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

    const totalTipos = tiposUnicos.length
    const tipoMasComun = tiposConEstadisticas.reduce(
      (max, t) => (t.estadisticas.turnosHoy > max.estadisticas.turnosHoy ? t : max),
      tiposConEstadisticas[0]
    )

    const tasaAtencionGeneral =
      totalTurnos > 0 ? ((totalAtendidos / totalTurnos) * 100).toFixed(1) : '0'

    return {
      resumen: {
        totalTipos,
        totalTurnos,
        totalAtendidos,
        tasaAtencionGeneral: parseFloat(tasaAtencionGeneral),
        tipoMasComun: tipoMasComun?.letra || '',
        descripcionTipoMasComun: tipoMasComun?.descripcion || '',
        turnosTipoMasComun: tipoMasComun?.estadisticas.turnosHoy || 0
      },
      tipos: tiposConEstadisticas.sort((a, b) => a.letra.localeCompare(b.letra)),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de tipos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener estadísticas de tipos'
    })
  }
})
