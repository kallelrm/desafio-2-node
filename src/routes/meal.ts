/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export const mealRoutes = async (app: FastifyInstance) => {
  app.post('/', async (req, res) => {
    const createMealSchema = z.object({
      name: z.string(),
      date_and_time: z.string(),
      description: z.string(),
      is_diet: z.boolean(),
    })

    const { name, date_and_time, description, is_diet } =
      createMealSchema.parse(req.body)
    const { sessionId } = req.cookies

    const [{ id }] = await knex('users').where('session_id', sessionId).limit(1)

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      date_and_time,
      is_diet,
      user_id: id,
    })

    return res.status(201).send({ message: 'meal created successfully' })
  })
  app.put('/:id', async (req, res) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      return res.status(401).send({ message: "you're not authenticated" })
    }

    const editMealParamsSchema = z.object({
      id: z.string(),
    })
    const editMealBodySchema = z
      .object({
        name: z.string(),
        date_and_time: z.string(),
        description: z.string(),
        is_diet: z.boolean(),
      })
      .partial()
      .refine(
        ({ name, date_and_time, description, is_diet }) =>
          name !== undefined ||
          date_and_time !== undefined ||
          description !== undefined ||
          is_diet !== undefined,
        { message: 'One of the fields must be defined' },
      )

    const { id } = editMealParamsSchema.parse(req.params)
    if (!id) {
      return res.status(400).send({ message: 'meal id not provided' })
    }

    const { name, date_and_time, description, is_diet } =
      editMealBodySchema.parse(req.body)

    const meal = await knex('meals')
      .where('id', id)
      .update({ name, date_and_time, description, is_diet })
      .returning('*')

    console.log(meal)

    return res.status(200).send({ message: 'meal updated successfully' })
  })

  app.delete('/:id', async (req, res) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      return res.status(401).send({ message: "you're not authenticated" })
    }

    const deleteMealParamsSchema = z.object({
      id: z.string(),
    })
    const { id } = deleteMealParamsSchema.parse(req.params)
    if (!id) {
      return res.status(400).send({ message: 'meal id not provided' })
    }

    await knex('meals').where('id', id).delete()

    return res.status(204).send()
  })

  app.get('/', async (req, res) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      return res.status(401).send({ message: "you're not authenticated" })
    }

    const [{ id }] = await knex('users').where('session_id', sessionId).limit(1)
    const meals = await knex('meals').where('user_id', id)

    return { meals }
  })

  app.get('/:id', async (req, res) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      return res.status(401).send({ message: "you're not authenticated" })
    }

    const getMealParamsSchema = z.object({
      id: z.string(),
    })

    const { id } = getMealParamsSchema.parse(req.params)
    const [{ id: user_id }] = await knex('users')
      .where('session_id', sessionId)
      .limit(1)

    const [meal] = await knex('meals')
      .where('user_id', user_id)
      .andWhere('id', id)

    return meal
  })

  app.get('/metrics', async (req, res) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      return res.status(401).send({ message: "you're not authenticated" })
    }

    const [{ id }] = await knex('users').where('session_id', sessionId).limit(1)

    const data = await knex('meals').where('user_id', id)

    let bestSequence = 0
    let acc = 0
    let count = 0

    for (const cur of data) {
      console.log({ acc, count, is_diet: cur.is_diet })

      if (cur.is_diet) {
        if (acc === count) {
          count++
        }
        acc++
        bestSequence = acc > count ? acc : count
      } else {
        acc = 0
      }
    }

    const metrics = {
      totalMeals: data.length,
      inDietMeals: data.reduce((acc, cur) => {
        if (cur.is_diet) {
          acc++
        }
        return acc
      }, 0),
      outDietMeals: data.reduce((acc, cur) => {
        if (!cur.is_diet) {
          acc++
        }
        return acc
      }, 0),
      bestSequence,
      // data.reduce((acc, cur) => {
      //   console.log(acc, count, cur.is_diet)
      //   if (cur.is_diet) {
      //     if (acc === count) {
      //       count++
      //     }
      //     acc++
      //     return acc >= count ? acc : count
      //   } else {
      //     acc = 0
      //     return acc
      //   }
      // }, 0),
    }

    return { metrics }
  })
}
