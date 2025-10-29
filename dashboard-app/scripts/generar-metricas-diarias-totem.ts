import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Generando métricas diarias del tótem...\n')

  // Obtener el tótem
  const totem = await prisma.totem.findUnique({
    where: { codigo: 'TOTEM-SM-01' }
  })

  if (!totem) {
    console.error('❌ No se encontró el tótem TOTEM-SM-01')
    return
  }

  console.log(`✅ Tótem encontrado: ${totem.codigo} (ID: ${totem.id})`)

  // Limpiar métricas existentes
  const deleted = await prisma.metricaTotem.deleteMany({
    where: { totemId: totem.id }
  })
  console.log(`🧹 Métricas antiguas eliminadas: ${deleted.count}`)

  // Obtener turnos del tótem agrupados por día
  const turnosPorDia = await prisma.$queryRaw<Array<{
    fecha: string
    total: number
  }>>`
    SELECT
      DATE(fecha / 1000, 'unixepoch') as fecha,
      COUNT(*) as total
    FROM Turno
    WHERE totemId = ${totem.id}
    GROUP BY DATE(fecha / 1000, 'unixepoch')
    ORDER BY fecha ASC
  `

  console.log(`\n📊 Días con actividad del tótem: ${turnosPorDia.length}`)

  let metricasCreadas = 0

  for (const dia of turnosPorDia) {
    const fecha = new Date(dia.fecha)
    fecha.setHours(0, 0, 0, 0)

    await prisma.metricaTotem.create({
      data: {
        totemId: totem.id,
        fecha: fecha,
        uptime: 100.0, // Asumimos 100% de uptime
        totalTransacciones: Number(dia.total),
        totalErrores: 0,
        tiempoPromedioRespuesta: 1200 // 1.2 segundos promedio
      }
    })

    metricasCreadas++
    console.log(`   ${dia.fecha}: ${dia.total} turnos`)
  }

  console.log(`\n✅ Métricas creadas: ${metricasCreadas}`)
  console.log(`📊 Total de turnos del tótem: ${turnosPorDia.reduce((sum, dia) => sum + Number(dia.total), 0)}`)

  // Verificar
  const totalMetricas = await prisma.metricaTotem.count({
    where: { totemId: totem.id }
  })

  console.log(`\n🎉 Verificación: ${totalMetricas} métricas en base de datos`)
}

main()
  .catch((e) => {
    console.error('💥 Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
