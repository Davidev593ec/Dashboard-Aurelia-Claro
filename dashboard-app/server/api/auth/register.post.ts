import prisma from '../../utils/prisma'
import { hashPassword, generateToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email y contraseña son requeridos'
    })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'El usuario ya existe'
    })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null
    }
  })

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
