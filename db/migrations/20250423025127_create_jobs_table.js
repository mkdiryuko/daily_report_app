/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('jobs', function(table) {
    table.increments('id').unsigned().primary(); // 主キー（AUTO_INCREMENT）
    table.integer('jobno').unsigned().notNullable().defaultTo(0).unique(); // job番号（一意）
    table.string('name', 255).notNullable().defaultTo('0').unique(); // 作業名（varchar, 一意）
    table.date('start_date').notNullable().defaultTo(knex.fn.now()); // 開始日
    table.date('end_date').notNullable().defaultTo(knex.fn.now());   // 終了日
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('jobs');
};
