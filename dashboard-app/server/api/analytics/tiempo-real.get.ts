/**
 * API para monitoreo en tiempo real
 * GET /api/analytics/tiempo-real
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const ahora = new Date()
  const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000)
  const haceDosHoras = new Date(ahora.getTime() - 2 * 60 * 60 * 1000)
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  // 1. Turnos en la última hora
  const turnosUltimaHora = await prisma.turno.count({
    where: {
      horaEmision: {
        gte: haceUnaHora
      }
    }
  })

  // 2. Turnos del día actual
  const turnosHoy = await prisma.turno.findMany({
    where: {
      fecha: {
        gte: hoy
      }
    }
  })

  const totalTurnosHoy = turnosHoy.length
  const turnosAtendidosHoy = turnosHoy.filter(t => t.estado === 'atendido').length
  const turnosAbandonadosHoy = turnosHoy.filter(t => t.estado === 'abandonado').length

  // 3. Tasa de abandono actual
  const tasaAbandonoActual = totalTurnosHoy > 0
    ? (turnosAbandonadosHoy / totalTurnosHoy) * 100
    : 0

  // 4. Estado de tótems
  const totems = await prisma.totem.findMany({
    include: {
      cac: true
    }
  })

  const totemsActivos = totems.filter(t => t.estado === 'activo').length
  const totemsInactivos = totems.filter(t => t.estado === 'inactivo').length
  const totemsMantenimiento = totems.filter(t => t.estado === 'mantenimiento').length

  // 5. Alertas activas
  const alertas: Array<{
    id: string
    tipo: 'warning' | 'error' | 'info'
    mensaje: string
    timestamp: Date
  }> = []

  // Alerta: Tasa de abandono alta
  if (tasaAbandonoActual > 10) {
    alertas.push({
      id: 'abandono-alto',
      tipo: 'error',
      mensaje: `Tasa de abandono actual (${tasaAbandonoActual.toFixed(2)}%) supera el 10%`,
      timestamp: ahora
    })
  }

  // Alerta: Tótems inactivos
  if (totemsInactivos > 0) {
    alertas.push({
      id: 'totems-inactivos',
      tipo: 'warning',
      mensaje: `${totemsInactivos} tótem(s) inactivo(s)`,
      timestamp: ahora
    })
  }

  // Alerta: Tótems en mantenimiento
  if (totemsMantenimiento > 0) {
    alertas.push({
      id: 'totems-mantenimiento',
      tipo: 'info',
      mensaje: `${totemsMantenimiento} tótem(s) en mantenimiento`,
      timestamp: ahora
    })
  }

  // 6. Evolución de turnos (últimas 2 horas, por intervalos de 15 min)
  const intervalos = 8 // 2 horas / 15 minutos = 8 intervalos
  const evolucionTurnos: Array<{ hora: string; turnos: number }> = []

  for (let i = intervalos - 1; i >= 0; i--) {
    const inicioIntervalo = new Date(ahora.getTime() - (i + 1) * 15 * 60 * 1000)
    const finIntervalo = new Date(ahora.getTime() - i * 15 * 60 * 1000)

    const turnosIntervalo = await prisma.turno.count({
      where: {
        horaEmision: {
          gte: inicioIntervalo,
          lt: finIntervalo
        }
      }
    })

    evolucionTurnos.push({
      hora: finIntervalo.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      turnos: turnosIntervalo
    })
  }

  // 7. Turnos por tipo (última hora)
  const turnosUltimaHoraDetalle = await prisma.turno.findMany({
    where: {
      horaEmision: {
        gte: haceUnaHora
      }
    }
  })

  const turnosPorTipo = turnosUltimaHoraDetalle.reduce((acc: any, turno) => {
    acc[turno.letra] = (acc[turno.letra] || 0) + 1
    return acc
  }, {})

  // 8. Tiempo promedio de espera y atención actual
  const turnosConTiempos = turnosHoy.filter(t => t.tiempoEspera !== null && t.tiempoAtencion !== null)
  const tiempoEsperaPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoEspera || 0), 0) / turnosConTiempos.length)
    : 0

  const tiempoAtencionPromedio = turnosConTiempos.length > 0
    ? Math.round(turnosConTiempos.reduce((sum, t) => sum + (t.tiempoAtencion || 0), 0) / turnosConTiempos.length)
    : 0

  // 9. Proyección de turnos para el resto del día
  const horaActual = ahora.getHours()
  const minutosTranscurridosHoy = ahora.getHours() * 60 + ahora.getMinutes()
  const minutosRestantes = (24 * 60) - minutosTranscurridosHoy

  const tasaTurnos = minutosTranscurridosHoy > 0
    ? totalTurnosHoy / minutosTranscurridosHoy
    : 0

  const turnosProyectados = Math.round(totalTurnosHoy + (tasaTurnos * minutosRestantes))

  // Calcular transacciones hoy por tótem
  const turnosPorTotem = turnosHoy.reduce((acc: any, t) => {
    if (t.totemId) {
      acc[t.totemId] = (acc[t.totemId] || 0) + 1
    }
    return acc
  }, {})

  return {
    timestamp: ahora,
    resumen: {
      turnosEnCola: 0, // TODO: Implementar si hay sistema de colas en tiempo real
      turnosUltimaHora,
      turnosHoy: totalTurnosHoy,
      turnosAtendidosHoy,
      turnosAbandonadosHoy,
      tasaAbandonoActual: Math.round(tasaAbandonoActual * 100) / 100,
      tiempoEsperaPromedio,
      tiempoAtencionPromedio,
      turnosProyectadosHoy: turnosProyectados
    },
    totems: {
      total: totems.length,
      activos: totemsActivos,
      inactivos: totemsInactivos,
      mantenimiento: totemsMantenimiento,
      detalle: totems.map(t => ({
        id: t.id,
        codigo: t.codigo,
        estado: t.estado,
        cac: {
          nombre: t.cac.nombre
        },
        ultimaActividad: t.ultimaActividad,
        transaccionesHoy: turnosPorTotem[t.id] || 0
      }))
    },
    alertas: {
      total: alertas.length,
      activas: alertas
    },
    evolucionTurnos,
    turnosPorTipo: Object.entries(turnosPorTipo).map(([tipo, count]) => ({
      tipo,
      cantidad: count
    })),
    indicadores: {
      cumpleTasaAbandono: tasaAbandonoActual <= 10,
      metaTasaAbandono: 10,
      estadoGeneral: alertas.some(a => a.tipo === 'error') ? 'crítico' :
                      alertas.some(a => a.tipo === 'warning') ? 'advertencia' : 'normal'
    }
  }
})
