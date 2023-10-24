import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meal', (table) => {
    table.string('name').notNullable()
    table.string('description').notNullable()
    table.dateTime('date_and_time').notNullable()
    table.boolean('is_diet').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('modified_at').defaultTo(knex.fn.now())
    table.string('user_id')
    table.foreign('user_id').references('id').inTable('users')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meal')
}
