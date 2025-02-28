require('dotenv').config({ path: '../.env.dev' });

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const knex = require('../db/knex');
const checkRelation = require('../db/checkRelation');
const flash = require('connect-flash');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);
const today = new Date();
const current_year = today.getFullYear();
const current_month = today.getMonth() + 1;
const current_day = today.getDate();

async function getTotalPersonHour(year, month, day, partner_name) {
  try {
    // 条件を設定
    let query = knex('daily_report')
      .join('user', 'daily_report.user_id', '=', 'user.id') // ユーザー名（後でパートナーの絞り込みに変更）
      .whereRaw('YEAR(job_date) = ?', [year])
      .andWhereRaw('MONTH(job_date) = ?', [month])
      .andWhereRaw('DAY(job_date) = ?', [day]);
    
    // ユーザー名が指定されている場合は、条件に追加
    if (partner_name && partner_name.trim() !== "") {
      query = query.andWhere('user.name', 'like', `%${partner_name}%`);
    }
    
    // 該当レコードの person_hour を秒に変換して合計し、再度時間形式に変換
    const result = await query.select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour'));
    
    // 合計値が null の場合は "00:00:00" を返す
    if (result.length === 0 || result[0].total_person_hour === null) {
      return "00:00";
    }
    return result[0].total_person_hour.slice(0, 5);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}


// 日報一覧表示
router.get('/', async (req, res) => {
  console.log('---日報一覧 GET---')
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  const authName = req.session.authname;
  const total_person_hour = await getTotalPersonHour(current_year, current_month, current_day);

  await knex('daily_report')
  .join('jobs', 'daily_report.jobno_id','=', 'jobs.id') // 案件名
  .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id') // 業務内容
  .join('user', 'daily_report.user_id', '=', 'user.id') // ユーザー名（後でパートナーの絞り込みに変更）
  .whereRaw('YEAR(job_date) = ?', [current_year]) // 今年
  .andWhereRaw('MONTH(job_date) = ?', [current_month]) // 今月
  .andWhereRaw('DAY(job_date) = ?', [current_day]) // 今日
  .select(
    'daily_report.id',
    'user.name as partner_name',
    knex.raw("DATE_FORMAT(daily_report.job_date, '%Y/%m/%d') AS 'job_date'"),
    'jobs.jobno as jobno',
    'jobs.name as job_name',
    'job_desc.name as job_desc_name',
    'daily_report.person_hour',
    'daily_report.note'
    )
    .then(daily_reports => {
      res.render('checkDailyReport', {
        isAuthenticated: isAuthenticated,
        userName: userName,
        authName: authName,
        daily_reports: daily_reports,
        total_person_hour: total_person_hour
      })
    })
    .catch(error => {
      console.error(error);
      res.render('index', {
        title: 'Daily Report App',
        isAuthenticated: req.session.isAuthenticated,
        userName: req.session.account?.name
      });
    })
});

// 日報検索
// 入力：検索パラメータ（年, 月, 日, ユーザーID）
// 機能：案件を検索して検索結果を返す
router.get('/search', async (req, res) => {
  console.log("---日報検索GET---");
  try{
    // クエリパラメータの取得
    const { year, month, day, partner_name } = req.query;

    // 日付条件を SQL の YEAR, MONTH, DAY 関数で絞り込み
    let query = knex('daily_report')
    .join('jobs', 'daily_report.jobno_id','=', 'jobs.id') // 案件名
    .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id') // 業務内容
    .join('user', 'daily_report.user_id', '=', 'user.id') // ユーザー名（後でパートナーの絞り込みに変更）
    .whereRaw('YEAR(job_date) = ?', [year])
    .andWhereRaw('MONTH(job_date) = ?', [month])
    .andWhereRaw('DAY(job_date) = ?', [day]);

    // ユーザー名が指定されている場合は、条件に追加（部分一致の例）
    if (partner_name && partner_name.trim() !== "") {
      query = query.andWhere('user.name', 'like', `%${partner_name}%`);
    }

    const records = await query.select(
      'daily_report.id',
      'user.name as partner_name',
      knex.raw("DATE_FORMAT(daily_report.job_date, '%Y/%m/%d') AS 'job_date'"),
      'jobs.jobno as jobno',
      'jobs.name as job_name',
      'job_desc.name as job_desc_name',
      'daily_report.person_hour',
      'daily_report.note'
      );
    console.log(records);
    let total_person_hour = await getTotalPersonHour(year, month, day, partner_name);
    res.json({
      records: records, 
      total_person_hour: total_person_hour
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = router;
