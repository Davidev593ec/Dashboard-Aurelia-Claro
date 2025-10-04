import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function parseCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  // Saltar primera línea (encabezados)
  const dataLines = lines.slice(1)

  const turnos = []

  for (const line of dataLines) {
    const parts = line.split(';')

    if (parts.length < 4) continue

    const [fechaStr, letra, numeroStr, moduloStr, tiempoStr, observacion] = parts

    // Parsear fecha (formato d/m/yy)
    const [day, month, year] = fechaStr.split('/')
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)
    const fecha = new Date(fullYear, parseInt(month) - 1, parseInt(day))

    turnos.push({
      fecha,
      letra: letra.trim(),
      numero: parseInt(numeroStr),
      modulo: parseInt(moduloStr),
      tiempo: tiempoStr ? parseInt(tiempoStr) : null,
      observacion: observacion?.trim() || null
    })
  }

  return turnos
}

async function main() {
  console.log('🚀 Iniciando importación de datos...')

  const csvPath = path.join(process.cwd(), '..', 'Libro1.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Archivo CSV no encontrado:', csvPath)
    process.exit(1)
  }

  const turnos = await parseCSV(csvPath)

  console.log(`📊 Se encontraron ${turnos.length} turnos`)

  // Limpiar datos existentes (opcional)
  await prisma.turno.deleteMany()
  console.log('🗑️  Datos existentes eliminados')

  // Insertar en lotes
  const batchSize = 100
  let imported = 0

  for (let i = 0; i < turnos.length; i += batchSize) {
    const batch = turnos.slice(i, i + batchSize)
    await prisma.turno.createMany({
      data: batch
    })
    imported += batch.length
    console.log(`✅ Importados ${imported}/${turnos.length} turnos`)
  }

  console.log('✨ Importación completada exitosamente!')

  // Crear usuario admin por defecto
  const adminEmail = 'admin@claro.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    // Hash manual de la contraseña "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10)

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador'
      }
    })
    console.log('👤 Usuario admin creado: admin@claro.com / admin123')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
