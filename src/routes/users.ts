import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (req, res) => {
    const createBodyUserSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    })
    const { name, email, password } = createBodyUserSchema.parse(req.body)

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
      password,
      session_id: sessionId,
    })

    return res.status(201).send()
  })

  app.post('/login', async (req, res) => {
    const createSessionUserSchema = z.object({
      email: z.string(),
      password: z.string(),
    })

    const { email, password } = createSessionUserSchema.parse(req.body)

    const [user] = await knex('users').where('email', email).limit(1)

    if (!user) {
      return res.status(400).send({ message: 'email not found' })
    }

    const userLogin = user.password === password
    if (!userLogin) {
      return res.status(401).send({ message: 'wrong password' })
    }

    user.session_id = randomUUID()

    res.cookie('sessionId', user.session_id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    await knex('users').where('email', email).update({
      session_id: user.session_id,
    })

    return { session_id: user.session_id }
  })
}
