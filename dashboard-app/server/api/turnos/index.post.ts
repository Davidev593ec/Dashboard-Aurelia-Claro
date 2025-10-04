import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { fecha, letra, numero, modulo, tiempo, observacion } = await readBody(event)

  if (!fecha || !letra || !numero || !modulo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Fecha, letra, numero y modulo son requeridos'
    })
  }

  const turno = await prisma.turno.create({
    data: {
      fecha: new Date(fecha),
      letra,
      numero: parseInt(numero),
      modulo: parseInt(modulo),
      tiempo: tiempo ? parseInt(tiempo) : null,
      observacion: observacion || null
    }
  })

  return {
    success: true,
    data: turno
  }
})
