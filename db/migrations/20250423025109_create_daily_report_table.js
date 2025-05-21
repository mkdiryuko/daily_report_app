/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('daily_report', function(table) {
    table.increments('id').unsigned().primary(); // 主キー: 自動インクリメント & unsigned
    table.integer('user_id').unsigned().notNullable().defaultTo(0); // ユーザーID
    table.date('job_date').notNullable().defaultTo(knex.fn.now()); // 日付（MySQLのcurdate()に相当）
    table.integer('jobno_id').unsigned().notNullable().defaultTo(0); // job ID
    table.time('person_hour').notNullable().defaultTo('00:00:00'); // 時間（hh:mm:ss）
    table.integer('job_desc_id').unsigned().notNullable().defaultTo(0); // 作業種別
    table.string('note', 500).defaultTo('0'); // 備考

    // 外部キー制約
    table.foreign('user_id')
         .references('id')
         .inTable('user')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    table.foreign('job_desc_id')
         .references('id')
         .inTable('job_desc')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    table.foreign('jobno_id')
         .references('id')
         .inTable('jobs')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');

    // インデックス
    table.index(['user_id'], 'fk_user_id');
    table.index(['job_desc_id'], 'fk_job_desc_id');
    table.index(['jobno_id'], 'fk_job_id'); // BTREEはMySQLのデフォルトなので省略可
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('daily_report');
};
