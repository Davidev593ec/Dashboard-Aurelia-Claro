import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const csvPath = path.join(process.cwd(), '..', 'Libro2.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const lines = csvContent.split('\n')

  // Skip header lines (first 2 lines)
  const dataLines = lines.slice(2).filter(line => line.trim())

  console.log(`📊 Importando ${dataLines.length} encuestas...`)

  let imported = 0
  let errors = 0

  for (const line of dataLines) {
    try {
      // Parse CSV line (usando ; como separador)
      const parts = line.split(';')

      if (parts.length < 5) {
        console.warn(`⚠️  Línea inválida: ${line}`)
        errors++
        continue
      }

      const numero = parseInt(parts[0].trim())
      const nps = parseInt(parts[1].trim())
      const calificacion = parts[2].trim()
      const comentario = parts[3]?.trim() || null
      const rangoEdad = parts[4]?.trim() || null

      // Validar NPS
      if (isNaN(nps) || nps < 0 || nps > 10) {
        console.warn(`⚠️  NPS inválido en línea ${numero}: ${nps}`)
        errors++
        continue
      }

      await prisma.encuesta.create({
        data: {
          nps,
          calificacion,
          comentario,
          rangoEdad
        }
      })

      imported++
      if (imported % 10 === 0) {
        console.log(`✅ Importadas ${imported} encuestas...`)
      }
    } catch (error) {
      console.error(`❌ Error procesando línea: ${line}`, error)
      errors++
    }
  }

  console.log(`\n✨ Importación completada!`)
  console.log(`✅ Encuestas importadas: ${imported}`)
  console.log(`❌ Errores: ${errors}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
