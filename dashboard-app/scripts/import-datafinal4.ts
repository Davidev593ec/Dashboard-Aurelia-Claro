import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface TurnoCSV {
  fecha: string
  agencia: string
  idCaso: string
  ticket: string
  tiempoUsoTotem: string
  iniEspera: string
  inicio: string
  fin: string
  espera: string
  atencion: string
  tipoServicio: string
  categoria: string
  subcategoriaIngreso: string
  usuarioR: string
  subcategoriaSalida: string
  estacion: string
  prioridad: string
  cliente: string
  estado: string
  cacValida: string
  categoriaValida: string
  subCategoriaValida: string
  region: string
  zona: string
  rangosTE: string
  validaCitas: string
  ciudad: string
  contrato: string
  usuarioClasificacion: string
}

function parsearFecha(fechaStr: string): Date {
  // Formato: DD/MM/YYYY
  // Crear fecha sin conversión de zona horaria
  const [dia, mes, anio] = fechaStr.split('/').map(Number)
  return new Date(anio, mes - 1, dia, 0, 0, 0, 0)
}

function parsearHora(horaStr: string, fechaBase: Date): Date | null {
  // Formato: HH:MM:SS
  if (!horaStr || horaStr.trim() === '') return null

  try {
    const [horas, minutos, segundos] = horaStr.split(':').map(Number)
    if (isNaN(horas) || isNaN(minutos) || isNaN(segundos)) return null

    // Crear fecha con la hora exacta, compensando el offset de timezone
    // El sistema está en CST (UTC+8) y necesitamos preservar las horas exactas del CSV
    const fecha = new Date(
      fechaBase.getFullYear(),
      fechaBase.getMonth(),
      fechaBase.getDate(),
      horas + 8, // Ajustar +8 horas para compensar el offset
      minutos,
      segundos,
      0
    )
    return fecha
  } catch (error) {
    return null
  }
}

function parsearDuracion(duracionStr: string): number {
  // Formato: H:MM:SS o MM:SS
  if (!duracionStr || duracionStr.trim() === '') return 0

  const partes = duracionStr.split(':')

  if (partes.length === 3) {
    // H:MM:SS
    const [horas, minutos, segundos] = partes.map(Number)
    return horas * 3600 + minutos * 60 + segundos
  } else if (partes.length === 2) {
    // MM:SS
    const [minutos, segundos] = partes.map(Number)
    return minutos * 60 + segundos
  }

  return 0
}

function extraerLetraYNumero(ticket: string): { letra: string; numero: number } {
  // Formato esperado: RR607, M191, V123, etc.
  const match = ticket.match(/^([A-Z]+)(\d+)$/)

  if (match) {
    return {
      letra: match[1],
      numero: parseInt(match[2], 10)
    }
  }

  // Fallback: extraer lo que se pueda
  const letraMatch = ticket.match(/[A-Z]+/)
  const numeroMatch = ticket.match(/\d+/)

  return {
    letra: letraMatch ? letraMatch[0] : 'X',
    numero: numeroMatch ? parseInt(numeroMatch[0], 10) : 0
  }
}

function extraerModulo(estacion: string): number {
  // Formato esperado: "Puesto 14", "Puesto 8", etc.
  const match = estacion.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

async function main() {
  console.log('🚀 Iniciando importación de datafinal4.csv...')

  const csvPath = path.join(process.cwd(), '..', 'datafinal4.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Archivo no encontrado: ${csvPath}`)
    process.exit(1)
  }

  // PASO 1: Limpiar datos existentes
  console.log('\n🧹 PASO 1: Limpiando datos existentes...')

  const turnosAntiguos = await prisma.turno.count()
  console.log(`   Turnos actuales: ${turnosAntiguos}`)

  // Eliminar métricas de totem primero (por foreign key)
  await prisma.metricaTotem.deleteMany({})
  console.log('   ✅ Métricas de totem eliminadas')

  // Eliminar horarios pico
  await prisma.horarioPico.deleteMany({})
  console.log('   ✅ Horarios pico eliminados')

  // Eliminar turnos
  await prisma.turno.deleteMany({})
  console.log('   ✅ Turnos eliminados')

  console.log('   🎉 Base de datos limpiada exitosamente')

  // PASO 2: Leer archivo CSV
  console.log('\n📄 PASO 2: Leyendo archivo CSV...')
  const contenido = fs.readFileSync(csvPath, 'utf-8')
  const lineas = contenido.split('\n').filter((l) => l.trim())

  console.log(`   Total de líneas: ${lineas.length}`)
  console.log(`   Turnos a importar: ${lineas.length - 1}`)

  // Primera línea es el encabezado (ignorar)
  const encabezado = lineas[0]
  console.log('   Encabezado:', encabezado.substring(0, 80) + '...')

  // PASO 3: Crear o encontrar CACs
  console.log('\n📍 PASO 3: Procesando CACs...')
  const cacsMap = new Map<string, number>()

  const cacSanMarino = await prisma.cAC.upsert({
    where: { nombre: 'CAC SAN MARINO' },
    update: {},
    create: {
      nombre: 'CAC SAN MARINO',
      ciudad: 'GUAYAQUIL',
      direccion: 'Av. San Marino',
      activo: true
    }
  })
  cacsMap.set('CAC SAN MARINO', cacSanMarino.id)
  console.log(`   ✅ CAC San Marino (ID: ${cacSanMarino.id})`)

  // PASO 4: Crear el tótem único
  console.log('\n🖥️  PASO 4: Configurando tótem...')
  const totem = await prisma.totem.upsert({
    where: { codigo: 'TOTEM-SM-01' },
    update: { ultimaActividad: new Date() },
    create: {
      codigo: 'TOTEM-SM-01',
      cacId: cacSanMarino.id,
      estado: 'activo',
      ultimaActividad: new Date()
    }
  })
  console.log(`   ✅ Tótem: ${totem.codigo}`)

  // PASO 5: Procesar turnos
  console.log('\n📊 PASO 5: Importando turnos...')
  let procesados = 0
  let errores = 0
  const batchSize = 500
  let batch: any[] = []

  for (let i = 1; i < lineas.length; i++) {
    try {
      const linea = lineas[i].trim()
      if (!linea) continue

      const campos = linea.split(';')

      if (campos.length < 29) {
        errores++
        continue
      }

      // Mapear campos - 29 columnas (sin USUARIO_T)
      const [
        fecha,
        agencia,
        idCaso,
        ticket,
        tiempoUsoTotem,
        iniEspera,
        inicio,
        fin,
        espera,
        atencion,
        tipoServicio,
        categoria,
        subcategoriaIngreso,
        usuarioR,
        subcategoriaSalida,
        estacion,
        prioridad,
        cliente,
        estado,
        cacValida,
        categoriaValida,
        subCategoriaValida,
        region,
        zona,
        rangosTE,
        validaCitas,
        ciudad,
        contrato,
        usuarioClasificacion
      ] = campos

      // Validar campos obligatorios
      if (!fecha || !ticket || fecha.trim() === '' || ticket.trim() === '') {
        errores++
        continue
      }

      const fechaParseada = parsearFecha(fecha)
      if (isNaN(fechaParseada.getTime())) {
        errores++
        continue
      }

      const { letra, numero } = extraerLetraYNumero(ticket)
      const modulo = extraerModulo(estacion)

      const cacId = cacsMap.get(cacValida) || null
      // Asignar el tótem a TODOS los turnos (todos son generados por el tótem)
      // El indicador es usuarioR = "anfitrion"
      const totemId =
        usuarioR?.toLowerCase() === 'anfitrion'
          ? totem.id
          : null

      const horaEmisionParseada = parsearHora(iniEspera, fechaParseada)
      const horaAtencionParseada = parsearHora(inicio, fechaParseada)

      const turnoData = {
        fecha: fechaParseada,
        letra,
        numero,
        modulo,
        estado: estado.toLowerCase() === 'atendido' ? 'atendido' : 'abandonado',
        tiempoUsoTotem: tiempoUsoTotem ? parseInt(tiempoUsoTotem, 10) : null,
        tiempoEspera: parsearDuracion(espera),
        tiempoAtencion: parsearDuracion(atencion),
        tiempo: parsearDuracion(espera) + parsearDuracion(atencion),
        horaEmision: horaEmisionParseada || fechaParseada,
        horaAtencion: horaAtencionParseada,
        ticketCompleto: ticket,
        cacId,
        totemId,
        observacion: usuarioClasificacion
      }

      batch.push(turnoData)

      // Insertar en lotes
      if (batch.length >= batchSize) {
        try {
          await prisma.turno.createMany({
            data: batch
          })
          procesados += batch.length
          const porcentaje = ((procesados / (lineas.length - 1)) * 100).toFixed(1)
          console.log(`   ✅ Procesados: ${procesados}/${lineas.length - 1} turnos (${porcentaje}%)`)
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
    await prisma.turno.createMany({
      data: batch
    })
    procesados += batch.length
    console.log(`   ✅ Lote final procesado: ${batch.length} turnos`)
  }

  console.log('\n📈 PASO 6: Resumen de importación:')
  console.log(`   ✅ Turnos procesados: ${procesados}`)
  console.log(`   ❌ Errores: ${errores}`)
  console.log(`   📊 Total líneas CSV: ${lineas.length - 1}`)
  console.log(`   📊 Tasa de éxito: ${((procesados / (lineas.length - 1)) * 100).toFixed(2)}%`)

  // PASO 7: Crear métrica del tótem basada en datos reales
  console.log('\n📊 PASO 7: Creando métricas del tótem...')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const turnosTotem = await prisma.turno.count({
    where: { totemId: totem.id }
  })

  await prisma.metricaTotem.upsert({
    where: {
      totemId_fecha: {
        totemId: totem.id,
        fecha: hoy
      }
    },
    update: {},
    create: {
      totemId: totem.id,
      fecha: hoy,
      uptime: 100.0,
      totalTransacciones: turnosTotem,
      totalErrores: 0,
      tiempoPromedioRespuesta: 1200
    }
  })
  console.log(`   ✅ Métrica creada: ${turnosTotem} transacciones del totem`)

  console.log('\n✅ ¡Importación completada exitosamente!')
  console.log('=' .repeat(60))
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
