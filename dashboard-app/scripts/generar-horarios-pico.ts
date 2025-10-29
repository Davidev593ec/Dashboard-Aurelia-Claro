import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Generando horarios pico desde turnos...\n')

  // Limpiar horarios pico existentes
  const deleted = await prisma.horarioPico.deleteMany({})
  console.log(`🧹 Horarios pico eliminados: ${deleted.count}`)

  // Obtener turnos agrupados por fecha y hora
  const turnosPorHora = await prisma.$queryRaw<Array<{
    fecha: string
    hora: number
    total_turnos: number
    atendidos: number
    abandonados: number
    tiempo_espera_total: number
  }>>`
    SELECT
      DATE(horaEmision / 1000, 'unixepoch') as fecha,
      CAST(strftime('%H', datetime(horaEmision / 1000, 'unixepoch')) AS INTEGER) as hora,
      COUNT(*) as total_turnos,
      SUM(CASE WHEN estado = 'atendido' THEN 1 ELSE 0 END) as atendidos,
      SUM(CASE WHEN estado = 'abandonado' THEN 1 ELSE 0 END) as abandonados,
      SUM(COALESCE(tiempoEspera, 0)) as tiempo_espera_total
    FROM Turno
    WHERE horaEmision IS NOT NULL
    GROUP BY DATE(horaEmision / 1000, 'unixepoch'), hora
    ORDER BY fecha ASC, hora ASC
  `

  console.log(`📊 Horarios únicos encontrados: ${turnosPorHora.length}`)

  let creados = 0
  const batchSize = 100
  let batch: any[] = []

  for (const horario of turnosPorHora) {
    const fecha = new Date(horario.fecha)
    fecha.setHours(Number(horario.hora), 0, 0, 0)

    const totalTurnos = Number(horario.total_turnos)
    const atendidos = Number(horario.atendidos)
    const abandonados = Number(horario.abandonados)
    const tiempoEsperaTotal = Number(horario.tiempo_espera_total)

    const tasaAbandono = totalTurnos > 0
      ? (abandonados / totalTurnos) * 100
      : 0

    const tiempoEsperaPromedio = totalTurnos > 0
      ? Math.round(tiempoEsperaTotal / totalTurnos)
      : 0

    batch.push({
      fecha: fecha,
      hora: Number(horario.hora),
      totalTurnos: totalTurnos,
      turnosAtendidos: atendidos,
      turnosAbandonados: abandonados,
      tasaAbandono: tasaAbandono,
      tiempoEsperaPromedio: tiempoEsperaPromedio
    })

    if (batch.length >= batchSize) {
      await prisma.horarioPico.createMany({
        data: batch
      })
      creados += batch.length
      console.log(`   ✅ Creados: ${creados}/${turnosPorHora.length} horarios pico`)
      batch = []
    }
  }

  // Insertar lote final
  if (batch.length > 0) {
    await prisma.horarioPico.createMany({
      data: batch
    })
    creados += batch.length
  }

  console.log(`\n✅ Total horarios pico creados: ${creados}`)

  // Verificar
  const total = await prisma.horarioPico.count()
  console.log(`🎉 Horarios pico en BD: ${total}`)

  // Mostrar top 5
  const top5 = await prisma.horarioPico.findMany({
    orderBy: { totalTurnos: 'desc' },
    take: 5
  })

  console.log('\n🔥 Top 5 horarios con más turnos:')
  top5.forEach((h, i) => {
    const fecha = new Date(h.fecha)
    console.log(`   ${i + 1}. ${fecha.toLocaleDateString('es-EC')} ${h.hora}:00 - ${h.totalTurnos} turnos (${h.tasaAbandono.toFixed(1)}% abandono)`)
  })
}

main()
  .catch((e) => {
    console.error('💥 Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
