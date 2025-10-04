import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 100

  const skip = (page - 1) * limit

  const where: any = {}

  const [encuestas, total] = await Promise.all([
    prisma.encuesta.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.encuesta.count({ where })
  ])

  return {
    data: encuestas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
