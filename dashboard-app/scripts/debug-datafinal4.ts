import * as fs from 'fs'
import * as path from 'path'

function parsearFecha(fechaStr: string): Date {
  const [dia, mes, anio] = fechaStr.split('/')
  return new Date(`${anio}-${mes}-${dia}`)
}

const csvPath = path.join(process.cwd(), '..', 'datafinal4.csv')
const contenido = fs.readFileSync(csvPath, 'utf-8')
const lineas = contenido.split('\n').filter((l) => l.trim())

console.log(`Total de líneas: ${lineas.length}`)
console.log(`Registros a procesar: ${lineas.length - 1}\n`)

let erroresCampos = 0
let erroresFecha = 0
let erroresTicket = 0
let validos = 0

const erroresDetalle: Array<{ linea: number; razon: string; datos: string }> = []

for (let i = 1; i < lineas.length; i++) {
  const linea = lineas[i].trim()
  if (!linea) continue

  const campos = linea.split(';')

  if (campos.length < 29) {
    erroresCampos++
    if (erroresDetalle.length < 10) {
      erroresDetalle.push({
        linea: i,
        razon: `Campos insuficientes: ${campos.length}`,
        datos: linea.substring(0, 100)
      })
    }
    continue
  }

  const [fecha, agencia, idCaso, ticket] = campos

  // Validar campos obligatorios
  if (!fecha || !ticket || fecha.trim() === '' || ticket.trim() === '') {
    erroresTicket++
    if (erroresDetalle.length < 10) {
      erroresDetalle.push({
        linea: i,
        razon: 'Fecha o Ticket vacío',
        datos: `Fecha:'${fecha}' Ticket:'${ticket}'`
      })
    }
    continue
  }

  try {
    const fechaParseada = parsearFecha(fecha)
    if (isNaN(fechaParseada.getTime())) {
      erroresFecha++
      if (erroresDetalle.length < 10) {
        erroresDetalle.push({
          linea: i,
          razon: 'Fecha inválida',
          datos: `Fecha:'${fecha}'`
        })
      }
      continue
    }
  } catch (error) {
    erroresFecha++
    if (erroresDetalle.length < 10) {
      erroresDetalle.push({
        linea: i,
        razon: 'Error al parsear fecha',
        datos: `Fecha:'${fecha}'`
      })
    }
    continue
  }

  validos++
}

console.log('='.repeat(60))
console.log('RESUMEN DE VALIDACIÓN')
console.log('='.repeat(60))
console.log(`✅ Registros válidos: ${validos}`)
console.log(`❌ Errores por campos insuficientes: ${erroresCampos}`)
console.log(`❌ Errores por fecha inválida: ${erroresFecha}`)
console.log(`❌ Errores por fecha/ticket vacío: ${erroresTicket}`)
console.log(`📊 Total errores: ${erroresCampos + erroresFecha + erroresTicket}`)
console.log(`📊 Tasa de éxito: ${((validos / (lineas.length - 1)) * 100).toFixed(2)}%`)

if (erroresDetalle.length > 0) {
  console.log('\n' + '='.repeat(60))
  console.log('PRIMEROS 10 ERRORES ENCONTRADOS')
  console.log('='.repeat(60))
  erroresDetalle.forEach((error) => {
    console.log(`\nLínea ${error.linea}: ${error.razon}`)
    console.log(`  Datos: ${error.datos}`)
  })
}
