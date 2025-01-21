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
    return result[0]?.total_person_hour.slice(0, -3) || '00:00';
  } catch (error) {
    console.error('Error fetching total person hour:', error);

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
  });
})

router.get('/api/total_person_hour', async (req, res) => {
  console.log("---カレンダーAPIリクエスト---");
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required'});
  }

  try {
    const total_person_hour_pm = await getMonthTotalPersonHour(year, month);
    res.json({ total_person_hour_pm });
  } catch(error) {
    console.error('総工数の取得に失敗しました');
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

module.exports = router;