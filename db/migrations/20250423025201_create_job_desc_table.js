/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_desc', function(table) {
    table.increments('id').unsigned().primary();           // 主キー（AUTO_INCREMENT + unsigned）
    table.string('name', 255).notNullable().defaultTo('0').unique(); // 作業名（ユニーク）
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_desc');
};
