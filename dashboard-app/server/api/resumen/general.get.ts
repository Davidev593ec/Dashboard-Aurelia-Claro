/**
 * API para obtener resumen general del dashboard
 * GET /api/resumen/general
 */

import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  // 1. TURNOS - Datos GLOBALES (todos los turnos históricos)
  const todosTurnos = await prisma.turno.findMany()

  const totalTurnosGlobal = todosTurnos.length
  const turnosAtendidosGlobal = todosTurnos.filter(t => t.estado === 'atendido').length
  const turnosAbandonadosGlobal = todosTurnos.filter(t => t.estado === 'abandonado').length
  const tasaAtencionGlobal = totalTurnosGlobal > 0
    ? (turnosAtendidosGlobal / totalTurnosGlobal) * 100
    : 0
  const tasaAbandonoGlobal = totalTurnosGlobal > 0
    ? (turnosAbandonadosGlobal / totalTurnosGlobal) * 100
    : 0

  // Calcular promedio de turnos por día
  const fechasUnicas = [...new Set(todosTurnos.map(t =>
    new Date(t.fecha).toISOString().split('T')[0]
  ))].length
  const promedioPorDia = fechasUnicas > 0 ? Math.round(totalTurnosGlobal / fechasUnicas) : 0

  // Tiempo promedio total (espera + atención)
  const turnosConTiempo = todosTurnos.filter(t => t.tiempo !== null)
  const tiempoPromedioTotal = turnosConTiempo.length > 0
    ? Math.round(turnosConTiempo.reduce((sum, t) => sum + (t.tiempo || 0), 0) / turnosConTiempo.length)
    : 0

  // Tipo de turno más solicitado (histórico)
  const turnosPorTipo = todosTurnos.reduce((acc: any, t) => {
    acc[t.letra] = (acc[t.letra] || 0) + 1
    return acc
  }, {})

  const tipoMasSolicitado = Object.entries(turnosPorTipo)
    .sort(([, a]: any, [, b]: any) => b - a)[0]

  // Turnos del día actual (para otras métricas)
  const turnosHoy = await prisma.turno.findMany({
    where: {
      fecha: {
        gte: hoy
      }
    }
  })

  const totalTurnosHoy = turnosHoy.length
  const turnosAtendidos = turnosHoy.filter(t => t.estado === 'atendido').length
  const turnosAbandonados = turnosHoy.filter(t => t.estado === 'abandonado').length
  const tasaAtencion = totalTurnosHoy > 0
    ? (turnosAtendidos / totalTurnosHoy) * 100
    : 0

  // 2. ENCUESTAS - Resumen
  const encuestas = await prisma.encuesta.findMany()
  const totalEncuestas = encuestas.length
  const npsPromedio = totalEncuestas > 0
    ? encuestas.reduce((sum, e) => sum + e.nps, 0) / totalEncuestas
    : 0

  // Distribución de calificaciones
  const calificaciones = encuestas.reduce((acc: any, e) => {
    acc[e.calificacion] = (acc[e.calificacion] || 0) + 1
    return acc
  }, {})

  const calificacionMasComun = Object.entries(calificaciones)
    .sort(([, a]: any, [, b]: any) => b - a)[0]

  // 3. MONITOREO - Estado actual
  const totemsInactivos = await prisma.totem.count({
    where: { estado: 'inactivo' }
  })

  const totemsMantenimiento = await prisma.totem.count({
    where: { estado: 'mantenimiento' }
  })

  const tasaAbandonoActual = totalTurnosHoy > 0
    ? (turnosAbandonados / totalTurnosHoy) * 100
    : 0

  // Estado general del sistema
  let estadoSistema = 'normal'
  let totalAlertas = 0

  if (tasaAbandonoActual > 10) {
    estadoSistema = 'crítico'
    totalAlertas++
  }
  if (totemsInactivos > 0) {
    if (estadoSistema !== 'crítico') estadoSistema = 'advertencia'
    totalAlertas++
  }
  if (totemsMantenimiento > 0) {
    totalAlertas++
  }

  // 4. ANALYTICS - Horario pico
  const horariosPico = await prisma.horarioPico.findMany({
    orderBy: { totalTurnos: 'desc' },
    take: 1
  })

  const horarioPicoMax = horariosPico[0]
  const horarioPico = horarioPicoMax
    ? `${horarioPicoMax.hora.toString().padStart(2, '0')}:00`
    : '-'

  // 5. CACs - Información general
  const totalCACs = await prisma.cAC.count({
    where: { activo: true }
  })

  const cacConMasTurnos = await prisma.turno.groupBy({
    by: ['cacId'],
    where: {
      fecha: { gte: hoy },
      cacId: { not: null }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  })

  let cacMasDemandado = null
  if (cacConMasTurnos.length > 0 && cacConMasTurnos[0].cacId) {
    const cac = await prisma.cAC.findUnique({
      where: { id: cacConMasTurnos[0].cacId }
    })
    cacMasDemandado = {
      nombre: cac?.nombre || 'N/A',
      turnos: cacConMasTurnos[0]._count.id
    }
  }

  // 6. TÓTEMS - Estado general
  const totalTotems = await prisma.totem.count()
  const totemsActivos = await prisma.totem.count({
    where: { estado: 'activo' }
  })

  const uptimePromedio = totalTotems > 0
    ? (totemsActivos / totalTotems) * 100
    : 100

  // 7. MÓDULOS - Actividad
  const modulosActivos = await prisma.turno.groupBy({
    by: ['modulo'],
    where: {
      fecha: { gte: hoy }
    },
    _count: { id: true }
  })

  const totalModulosActivos = modulosActivos.length

  const moduloMasActivo = modulosActivos.length > 0
    ? modulosActivos.reduce((max, m) =>
        m._count.id > max._count.id ? m : max
      , modulosActivos[0])
    : null

  // 8. TIPOS DE TURNO - Distribución
  const totalTiposTurno = Object.keys(turnosPorTipo).length

  // Calcular recomendaciones
  const recomendaciones = []
  if (tasaAbandonoActual > 10) {
    recomendaciones.push({
      tipo: 'urgente',
      mensaje: 'Tasa de abandono alta. Requiere atención inmediata.'
    })
  }
  if (totemsInactivos > 0) {
    recomendaciones.push({
      tipo: 'warning',
      mensaje: `${totemsInactivos} tótem(s) inactivo(s). Verificar estado.`
    })
  }
  if (npsPromedio < 7) {
    recomendaciones.push({
      tipo: 'info',
      mensaje: 'NPS por debajo del objetivo. Revisar satisfacción del cliente.'
    })
  }

  return {
    timestamp: ahora,
    kpis: {
      turnosHoy: totalTurnosHoy,
      tasaAtencion: Math.round(tasaAtencion * 100) / 100,
      npsPromedio: Math.round(npsPromedio * 10) / 10,
      tiempoPromedioMinutos: Math.round(tiempoPromedioTotal / 60)
    },
    segmentos: {
      turnos: {
        titulo: 'Turnos',
        url: '/turnos',
        stats: [
          { label: 'Total Histórico', value: totalTurnosGlobal, format: 'number' },
          { label: 'Atendidos', value: turnosAtendidosGlobal, format: 'number' },
          { label: 'Abandonados', value: turnosAbandonadosGlobal, format: 'number' },
          { label: 'Tasa Atención', value: tasaAtencionGlobal, format: 'percentage' },
          { label: 'Tasa Abandono', value: tasaAbandonoGlobal, format: 'percentage' },
          { label: 'Promedio/Día', value: promedioPorDia, format: 'number' }
        ],
        estado: tasaAtencionGlobal >= 90 ? 'excelente' : tasaAtencionGlobal >= 80 ? 'bueno' : 'regular'
      },
      encuestas: {
        titulo: 'Encuestas',
        url: '/encuestas',
        stats: [
          { label: 'NPS Promedio', value: npsPromedio, format: 'decimal' },
          { label: 'Total Respuestas', value: totalEncuestas, format: 'number' },
          { label: 'Más Común', value: calificacionMasComun ? calificacionMasComun[0] : '-', format: 'text' }
        ],
        estado: npsPromedio >= 8 ? 'excelente' : npsPromedio >= 7 ? 'bueno' : 'regular'
      },
      analytics: {
        titulo: 'Analytics',
        url: '/analytics',
        stats: [
          { label: 'Horario Pico', value: horarioPico, format: 'text' },
          { label: 'Turnos Pico', value: horarioPicoMax?.totalTurnos || 0, format: 'number' },
          { label: 'Tasa Abandono', value: horarioPicoMax?.tasaAbandono || 0, format: 'percentage' }
        ],
        estado: 'info'
      },
      monitoreo: {
        titulo: 'Monitoreo',
        url: '/monitoreo',
        stats: [
          { label: 'Estado Sistema', value: estadoSistema.toUpperCase(), format: 'text' },
          { label: 'Alertas Activas', value: totalAlertas, format: 'number' },
          { label: 'Tasa Abandono', value: tasaAbandonoActual, format: 'percentage' }
        ],
        estado: estadoSistema
      },
      cacs: {
        titulo: 'CACs',
        url: '/turnos',
        stats: [
          { label: 'Total Activos', value: totalCACs, format: 'number' },
          { label: 'Mayor Demanda', value: cacMasDemandado?.nombre || '-', format: 'text' },
          { label: 'Turnos', value: cacMasDemandado?.turnos || 0, format: 'number' }
        ],
        estado: 'info'
      },
      totems: {
        titulo: 'Tótems',
        url: '/turnos',
        stats: [
          { label: 'Total Activos', value: totemsActivos, format: 'number' },
          { label: 'Total', value: totalTotems, format: 'number' },
          { label: 'Uptime', value: uptimePromedio, format: 'percentage' }
        ],
        estado: uptimePromedio >= 95 ? 'excelente' : uptimePromedio >= 85 ? 'bueno' : 'regular'
      },
      modulos: {
        titulo: 'Módulos',
        url: '/turnos',
        stats: [
          { label: 'Activos Hoy', value: totalModulosActivos, format: 'number' },
          { label: 'Más Activo', value: moduloMasActivo ? `Módulo ${moduloMasActivo.modulo}` : '-', format: 'text' },
          { label: 'Turnos', value: moduloMasActivo?._count.id || 0, format: 'number' }
        ],
        estado: 'info'
      },
      tipos: {
        titulo: 'Tipos de Turno',
        url: '/turnos',
        stats: [
          { label: 'Categorías', value: totalTiposTurno, format: 'number' },
          { label: 'Más Usado', value: tipoMasSolicitado ? tipoMasSolicitado[0] : '-', format: 'text' },
          { label: 'Cantidad', value: tipoMasSolicitado ? tipoMasSolicitado[1] : 0, format: 'number' }
        ],
        estado: 'info'
      }
    },
    alertas: {
      total: totalAlertas,
      items: [
        ...(tasaAbandonoActual > 10 ? [{
          tipo: 'error',
          mensaje: `Tasa de abandono (${tasaAbandonoActual.toFixed(1)}%) supera el 10%`
        }] : []),
        ...(totemsInactivos > 0 ? [{
          tipo: 'warning',
          mensaje: `${totemsInactivos} tótem(s) inactivo(s)`
        }] : []),
        ...(totemsMantenimiento > 0 ? [{
          tipo: 'info',
          mensaje: `${totemsMantenimiento} tótem(s) en mantenimiento`
        }] : [])
      ]
    },
    recomendaciones
  }
})
