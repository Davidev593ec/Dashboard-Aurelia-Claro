import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando importación de encuesta4.csv...\n')

  const csvPath = path.join(process.cwd(), '..', 'encuesta4.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Archivo no encontrado: ${csvPath}`)
    process.exit(1)
  }

  // PASO 1: Limpiar encuestas existentes
  console.log('🧹 PASO 1: Limpiando encuestas existentes...')
  const encuestasAntiguos = await prisma.encuesta.count()
  console.log(`   Encuestas actuales: ${encuestasAntiguos}`)

  await prisma.encuesta.deleteMany({})
  console.log('   ✅ Encuestas eliminadas')
  console.log('   🎉 Base de datos limpiada exitosamente\n')

  // PASO 2: Leer archivo CSV
  console.log('📄 PASO 2: Leyendo archivo CSV...')
  const contenido = fs.readFileSync(csvPath, 'utf-8')
  const lineas = contenido.split('\n').filter((l) => l.trim())

  console.log(`   Total de líneas: ${lineas.length}`)
  console.log(`   Encuestas a importar: ${lineas.length - 1}\n`)

  // Primera línea es el encabezado
  const encabezado = lineas[0]
  console.log('   Encabezado:', encabezado)

  // PASO 3: Procesar encuestas
  console.log('\n📊 PASO 3: Importando encuestas...')
  let procesados = 0
  let errores = 0
  const batchSize = 50
  let batch: any[] = []

  for (let i = 1; i < lineas.length; i++) {
    try {
      const linea = lineas[i].trim()
      if (!linea) continue

      const campos = linea.split(';')

      if (campos.length < 5) {
        console.log(`   ⚠️  Línea ${i}: campos insuficientes (${campos.length})`)
        errores++
        continue
      }

      const [id, nps, calificacion, comentario, rangoEdad] = campos

      // Validar campos obligatorios
      if (!nps || !calificacion) {
        console.log(`   ⚠️  Línea ${i}: nps o calificación vacíos`)
        errores++
        continue
      }

      const npsNum = parseInt(nps, 10)
      if (isNaN(npsNum) || npsNum < 0 || npsNum > 10) {
        console.log(`   ⚠️  Línea ${i}: NPS inválido (${nps})`)
        errores++
        continue
      }

      const encuestaData = {
        nps: npsNum,
        calificacion: calificacion.trim(),
        comentario: comentario?.trim() || null,
        rangoEdad: rangoEdad?.trim() || null
      }

      batch.push(encuestaData)

      // Insertar en lotes
      if (batch.length >= batchSize) {
        try {
          await prisma.encuesta.createMany({
            data: batch
          })
          procesados += batch.length
          const porcentaje = ((procesados / (lineas.length - 1)) * 100).toFixed(1)
          console.log(`   ✅ Procesados: ${procesados}/${lineas.length - 1} encuestas (${porcentaje}%)`)
          batch = []
        } catch (batchError) {
          console.error(`   ❌ Error al insertar lote:`, batchError)
          errores += batch.length
          batch = []
        }
      }
    } catch (error) {
      console.error(`   ❌ Error en línea ${i}:`, error)
      errores++
    }
  }

  // Insertar lote final
  if (batch.length > 0) {
    await prisma.encuesta.createMany({
      data: batch
    })
    procesados += batch.length
    console.log(`   ✅ Lote final procesado: ${batch.length} encuestas`)
  }

  console.log('\n📈 PASO 4: Resumen de importación:')
  console.log(`   ✅ Encuestas procesadas: ${procesados}`)
  console.log(`   ❌ Errores: ${errores}`)
  console.log(`   📊 Total líneas CSV: ${lineas.length - 1}`)
  console.log(`   📊 Tasa de éxito: ${((procesados / (lineas.length - 1)) * 100).toFixed(2)}%`)

  // PASO 5: Estadísticas de las encuestas importadas
  console.log('\n📊 PASO 5: Estadísticas de encuestas:')

  const totalEncuestas = await prisma.encuesta.count()
  console.log(`   Total encuestas en BD: ${totalEncuestas}`)

  // Distribución de NPS
  const promedioNPS = await prisma.encuesta.aggregate({
    _avg: { nps: true }
  })
  console.log(`   Promedio NPS: ${promedioNPS._avg.nps?.toFixed(2)}`)

  // Distribución por calificación
  const porCalificacion = await prisma.$queryRaw<Array<{
    calificacion: string
    total: number
  }>>`
    SELECT calificacion, COUNT(*) as total
    FROM Encuesta
    GROUP BY calificacion
    ORDER BY total DESC
  `

  console.log('\n   Distribución por calificación:')
  for (const cal of porCalificacion) {
    const porcentaje = ((Number(cal.total) / totalEncuestas) * 100).toFixed(1)
    console.log(`     ${cal.calificacion}: ${cal.total} (${porcentaje}%)`)
  }

  // Distribución por rango de edad
  const porEdad = await prisma.$queryRaw<Array<{
    rangoEdad: string
    total: number
  }>>`
    SELECT rangoEdad, COUNT(*) as total
    FROM Encuesta
    WHERE rangoEdad IS NOT NULL
    GROUP BY rangoEdad
    ORDER BY total DESC
  `

  console.log('\n   Distribución por edad:')
  for (const edad of porEdad) {
    const porcentaje = ((Number(edad.total) / totalEncuestas) * 100).toFixed(1)
    console.log(`     ${edad.rangoEdad}: ${edad.total} (${porcentaje}%)`)
  }

  console.log('\n✅ ¡Importación completada exitosamente!')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
