require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex')

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);
const now = new Date();
const current_year = now.getFullYear();
const current_month = String(now.getMonth() + 1).padStart(2, '0');
console.log("今日の日付：", now.toString());
console.log(`今日の年月 : ${current_year}年 ${current_month}月`)

// 総工数/月を返す関数
async function getMonthTotalPersonHour(year, month) {
  console.log("---総工数/月の計算---");
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    const result = await knex('daily_report')
    .select( 
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour')
    )
    .whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]) // 年月でフィルタリング
    console.log(`${year}年${month}月`);
    console.log("総工数/月：", result[0]?.total_person_hour);
    if (result[0].total_person_hour === null) {
      return "00:00";
    }
    return result[0].total_person_hour.slice(0, -3);
  } catch (error) {
    console.error('Error fetching total person hour:', error);
  } 
}

// 総工数/日を返す関数
async function getTotalPersonHourPerDay(year, month) {
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    const results = await knex('daily_report')
    .whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]) // 年月でフィルタリング
    .groupByRaw("job_date") // 各日付でグループ化
    .select(
      knex.raw("DATE_FORMAT(job_date, '%Y-%m-%d') AS start"),
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS title') // 総工数の計算
    )
    .orderBy('job_date', 'asc') // 日付順にソート
    console.log('---総工数/日(JSON)---');
    console.log(JSON.stringify(results, null, 2));
    return JSON.stringify(results, null, 2);
  } catch (error) {
    console.error('Error:', error);
  }
}

router.get('/', async (req, res) => {
  console.log("---カレンダーGETリクエスト---");
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;

  res.render('calendar', {
    isAuthenticated: isAuthenticated,
    userName: userName,
    total_person_hour_pm: await getMonthTotalPersonHour(current_year, current_month), // 現在の年月の総工数を返す
    total_person_hour_pd: await getTotalPersonHourPerDay(current_year, current_month) // 日付ごとの総工数を返す
  });
})

router.get('/api/total_person_hour_pm', async (req, res) => {
  console.log("---総工数/月APIリクエスト---");
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required'});
  }

  try {
    const total_person_hour_pm = await getMonthTotalPersonHour(year, month);
    console.log(total_person_hour_pd);
    res.json({ total_person_hour_pm });
  } catch(error) {
    console.error('総工数/月の取得に失敗しました');
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

router.get('/api/total_person_hour_pd', async (req, res) => {
  console.log("---総工数/日APIリクエスト");
  const { year, month } = req.query;
  console.log('year', year);
  console.log('month', month);

  if(!year || !month ) {
    return res.status(400).json({ error: 'year and month are required' });
  }

  try {
    const total_person_hour_pd = await getTotalPersonHourPerDay(year, month);
    res.json( {total_person_hour_pd} );
  } catch(error) {
    console.error('総工数/日の取得に失敗しました');
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

module.exports = router;