/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('absence', function(table) {
    table.increments('id').unsigned().primary(); // 自動インクリメント、主キー
    table.date('date').notNullable().defaultTo(knex.fn.now()); // 現在の日付をデフォルト
    table.integer('user_id').unsigned().notNullable().defaultTo(0); // 外部キー
    table.string('reason', 500).defaultTo('0'); // 文字列（500文字）

    table.foreign('user_id')
         .references('id')
         .inTable('user')
         .onDelete('CASCADE');

    table.index(['user_id'], 'fk_user_id_absence'); // インデックス名を明示
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('absence');
};
