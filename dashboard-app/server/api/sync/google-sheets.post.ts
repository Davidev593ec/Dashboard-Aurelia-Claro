import prisma from '../../utils/prisma'

/**
 * Endpoint para sincronizar datos desde Google Forms/Sheets
 *
 * Instrucciones de uso:
 * 1. En Google Forms, configura un script que envíe datos a este endpoint
 * 2. O usa Google Sheets con Apps Script para hacer POST a este endpoint
 * 3. O usa Zapier/Make.com para conectar Google Forms con este endpoint
 *
 * Formato esperado del body:
 * {
 *   fecha: "2025-10-03" o "03/10/25",
 *   letra: "M",
 *   numero: 100,
 *   modulo: 5,
 *   tiempo: 25 (opcional),
 *   observacion: "texto" (opcional)
 * }
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validar campos requeridos
  if (!body.fecha || !body.letra || !body.numero || !body.modulo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campos requeridos: fecha, letra, numero, modulo'
    })
  }

  try {
    // Parsear fecha
    let fecha: Date

    if (body.fecha.includes('/')) {
      // Formato d/m/yy o dd/mm/yyyy
      const [day, month, year] = body.fecha.split('/')
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : parseInt(year) < 100 ? 1900 + parseInt(year) : parseInt(year)
      fecha = new Date(fullYear, parseInt(month) - 1, parseInt(day))
    } else {
      // Formato ISO (YYYY-MM-DD)
      fecha = new Date(body.fecha)
    }

    // Crear turno
    const turno = await prisma.turno.create({
      data: {
        fecha,
        letra: body.letra.trim(),
        numero: parseInt(body.numero),
        modulo: parseInt(body.modulo),
        tiempo: body.tiempo ? parseInt(body.tiempo) : null,
        observacion: body.observacion?.trim() || null
      }
    })

    return {
      success: true,
      message: 'Turno registrado exitosamente',
      data: turno
    }
  } catch (error: any) {
    console.error('Error al sincronizar turno:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al registrar el turno: ' + error.message
    })
  }
})
