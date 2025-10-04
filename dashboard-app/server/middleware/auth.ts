import { verifyToken } from '../utils/auth'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // Rutas públicas
  const publicRoutes = ['/api/auth/login', '/api/auth/register']

  if (publicRoutes.includes(path)) {
    return
  }

  // Verificar token en rutas protegidas de la API
  if (path.startsWith('/api/')) {
    const authHeader = getHeader(event, 'authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token inválido o expirado'
      })
    }

    // Agregar usuario al contexto
    event.context.user = decoded
  }
})
