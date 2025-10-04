import prisma from '../../utils/prisma'
import { comparePassword, generateToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email y contraseña son requeridos'
    })
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas'
    })
  }

  const isValidPassword = await comparePassword(password, user.password)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas'
    })
  }

  const token = generateToken(user.id, user.email)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    token
  }
})
