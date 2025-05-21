/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user', function(table) {
    table.increments('id').unsigned().primary(); // 主キー（AUTO_INCREMENT + unsigned）

    table.string('name', 255).notNullable().defaultTo('0').unique();  // ユーザー名（ユニーク）
    table.string('email', 255).notNullable().defaultTo('0').unique(); // メールアドレス（ユニーク）

    table.integer('auth').unsigned().notNullable().defaultTo(0); // 権限（tinyint相当）
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user');
};
