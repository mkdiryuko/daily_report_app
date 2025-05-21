/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_assignments', function(table) {
    table.increments('id').unsigned().primary(); // 主キー（AUTO_INCREMENT）
    table.integer('job_id').unsigned().notNullable().defaultTo(0); // jobsテーブルへの外部キー
    table.integer('user_id').unsigned().notNullable().defaultTo(0); // userテーブルへの外部キー

    // 外部キー制約
    table.foreign('job_id')
         .references('id')
         .inTable('jobs')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    table.foreign('user_id')
         .references('id')
         .inTable('user')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    // インデックス（キー）
    table.index(['job_id'], 'fk_job_id_assign');
    table.index(['user_id'], 'fk_user_id_assign');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_assignments');
};
