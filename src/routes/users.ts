import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (req, res) => {
    const createBodyUserSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })
    const { name, email } = createBodyUserSchema.parse(req.body)

    let sessionId = req.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return res.status(201).send()
  })
}
