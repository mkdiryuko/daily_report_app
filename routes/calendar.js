require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const knex = require('../db/knex');
const isAuthenticated = require('../auth/isAuthenticated');

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

// 指定した月の総工数を計算する関数
// 出力：指定した年、月、ユーザーIDの総工数/月(hh:mm)
async function getMonthTotalPersonHour(year, month, user_id) {
  console.log("---総工数/月の計算---(getMonthTotalPersonHour)");
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    const result = await knex('daily_report')
    .select( 
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour')
    )
    .where({'user_id': user_id})
    .whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]) // 年月でフィルタリング
    const total_person_hour = result[0]?.total_person_hour;
    console.log(total_person_hour);
    
    if (!total_person_hour) {
      console.log("指定した年月に工数が登録されていませんでした");
      return "00:00";
    }
    return total_person_hour.slice(0, -3); // 秒を削除し、 "hh:mm" フォーマットに
  } catch (error) {
    console.error('Error fetching total person hour:', error);
    return "00:00";
  } 
}

// 総工数/日を返す関数
// 出力：指定した年、月、ユーザーIDの総工数/日のリスト(hh:mm:ss)
async function getTotalPersonHourPerDay(year, month, user_id) {
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`; // 左0詰め
    const results = await knex('daily_report')
    .where({'user_id': user_id})
    .whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]) // 年月でフィルタリング
    .groupBy("job_date") // 登録日でグループ化
    .select(
      knex.raw("DATE_FORMAT(job_date, '%Y-%m-%d') AS job_date"),
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour') // 総工数の計算
    )
    .orderBy('job_date', 'asc') // 日付順にソート
    console.log('---総工数/日(JSON)---');
    console.log(results)
    return results;
  } catch (error) {
    console.error('Error in getTotalPersonHOurPerDay:', error);
    return null;
  }
}

// 休みの日を返す関数
// 出力：指定した年、月、ユーザーIDの休みの日のリスト(YY-MM-DD)
async function getAbsenceDays(year, month, user_id) {
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    const results = await knex('absence')
    .where({'user_id': user_id})
    .whereRaw("DATE_FORMAT(`date`, '%Y-%m') = ?", [targetMonth])
    .select(
      knex.raw("DATE_FORMAT(date, '%Y-%m-%d') AS date")
    )
    .orderBy('date', 'asc');
    console.log("フィルタ結果：", results);
    return results;
  } catch (error) {
    console.error('Error in getAbsenceDays:', error);
    return null;
  }
}

// 初期表示
router.get('/', isAuthenticated, async (req, res) => {
  console.log("---カレンダーGETリクエスト---");
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userId = req.session.userId;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;

  res.render('calendar', {
    isAuthenticated: isAuthenticated,
    userName: userName,
    userAuth: userAuth,
    authName: authName,
    total_person_hour_pm: await getMonthTotalPersonHour(current_year, current_month, userId), // 現在の年月の総工数を返す
    total_person_hour_pd: await getTotalPersonHourPerDay(current_year, current_month, userId) // 日付ごとの総工数を返す
  });
})

// 総工数/月を計算して返すAPI
// 出力：指定した月の総工数(JSON形式)
router.get('/api/total_person_hour_pm', isAuthenticated, async (req, res) => {
  console.log("---総工数/月APIリクエスト---");
  const userId = req.session.userId;
  const { year, month } = req.query;
  console.log("年：", year, "月：", month);
  
  // yearやmonthが数値以外またはmonthが無効な月だったらエラーを出す
  if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  try {
    console.log("総工数/月の計算開始!!");
    const total_person_hour_pm = await getMonthTotalPersonHour(year, month, userId);
    console.log("取得した総工数/月：", total_person_hour_pm);

    if (!total_person_hour_pm) {
      return res.status(200).json({ total_person_hour_pm: '00:00' });
    }
    res.json({ total_person_hour_pm });
  } catch(error) {
    console.error('総工数/月の取得に失敗しました(API Error):', error);
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

// 総工数/日（ひと月分）を計算して返すAPI
// 出力：総工数/日（ひと月分）(JSON形式)
router.get('/api/total_person_hour_pd', isAuthenticated, async (req, res) => {
  console.log("---総工数/日APIリクエスト");
  const userId = req.session.userId;
  const { year, month } = req.query;
  console.log(year,'年', month, '月');

  // yearやmonthが数値以外またはmonthが無効な月だったらエラーを出す
  if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  try {
    console.log("総工数/日の計算開始!!")
    const total_person_hour_pd = await getTotalPersonHourPerDay(year, month, userId);

    // データ取得失敗時の処理
    if (!total_person_hour_pd) {
      return res.status(500).json({ error: 'Failed to fetch total person hours' });
    }
    // 結果をJSONとして返す
    res.json( total_person_hour_pd );
  } catch(error) {
    console.error('総工数/日の取得に失敗しました');
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

// DBから休みの日を取得して返すAPI
// 出力：指定した年月の休みの日全部(JSON形式)
router.get('/api/absence', isAuthenticated, async (req, res) => {
  console.log('---休みの日取得APIリクエスト---');
  const userId = req.session.userId;
  const { year, month } = req.query;

  // yearやmonthが数値以外またはmonthが無効な月だったらエラーを出す
  if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  try {
    console.log('---休みの日を取得---');
    const absence_day = await getAbsenceDays(year, month, userId);

    if (!absence_day) {
      return res.status(500).json({ error: 'Failed to fetch absence day' });
    }

    res.json( absence_day );
  } catch (error) {
    console.error('休みの日の取得に失敗しました');
    res.status(500).json({ error: 'サーバーエラー'});
  }
})

module.exports = router;