require('dotenv').config({ path: '../.env.dev' });

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const knex = require('../db/knex');
const checkRelation = require('../db/checkRelation');
const flash = require('connect-flash');
const isAuthenticated = require('../auth/isAuthenticated');
const checkAuth = require("../auth/checkAuth");

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

// 指定した月の総工数を返す関数
// 入力：年、月、パートナー名（任意）
// 出力：月単位の総工数
async function getTotalPersonHourByMonth(year, month, partner_name) {
  console.log("---指定した月の総工数の計算---(getTotalPersonHourByMonth)");
  try {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    let query = knex('daily_report')
      .join('user', 'daily_report.user_id', '=', 'user.id')
      .whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]);
    
    // パートナー名が指定されていれば、検索条件に加える
    if (partner_name && partner_name.trim() !== "") {
      query = query.andWhere('user.name', 'like', `%${partner_name}%`);
    }
    
    // 該当レコードの person_hour を秒に変換して合計し、再度時間形式に変換
    const result = await query.select(
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour')
    );
    
    const total_person_hour = result[0]?.total_person_hour;
    if (!total_person_hour) {
      console.log("指定した年月に工数が登録されていませんでした");
      return "00:00";
    }
    return total_person_hour.slice(0, 5); // 秒を削除し、 "hh:mm" フォーマットに
  } catch (error) {
    console.error('Error fetching total person hour:', error);
    return "00:00";
  } 
}

// 指定した日付の工数を返す関数
// 入力：年、月、日、パートナー名（任意）
// 出力：日単位の総工数
async function getTotalPersonHourByDay(year, month, day, partner_name) {
  console.log("---指定した日の総工数の計算---(getTotalPersonHourByDay)");
  try {
    let query = knex('daily_report')
      .join('user', 'daily_report.user_id', '=', 'user.id')
      .whereRaw('YEAR(job_date) = ?', [year])
      .andWhereRaw('MONTH(job_date) = ?', [month])
      .andWhereRaw('DAY(job_date) = ?', [day]);

    // パートナー名が指定されていれば、検索条件に加える
    if (partner_name && partner_name.trim() !== "") {
      query = query.andWhere('user.name', 'like', `%${partner_name}%`);
    }
    
    // 該当レコードの person_hour を秒に変換して合計し、再度時間形式に変換
    const result = await query.select(
      knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour')
    );
    
    // 合計値が null の場合は "00:00" を返す
    if (result.length === 0 || result[0].total_person_hour === null) {
      return "00:00";
    }
    return result[0].total_person_hour.slice(0, 5);
  } catch (error) {
    console.error('Error:', error);
    return "00:00";
  }
}

// 日付で検索する場合の関数
function searchByDay(query, year, month, day, partner_name) {
  query = query
    .whereRaw('YEAR(job_date) = ?', [year])
    .andWhereRaw('MONTH(job_date) = ?', [month])
    .andWhereRaw('DAY(job_date) = ?', [day]);

  // パートナー名が指定されていれば、検索条件に加える
  if (partner_name && partner_name.trim() !== "") {
    query = query.andWhere('user.name', 'like', `%${partner_name}%`);
  }
  return query;
}

// 月単位で検索する場合の関数
function searchByMonth(query, year, month, partner_name) {
  const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
  query = query.whereRaw("DATE_FORMAT(job_date, '%Y-%m') = ?", [targetMonth]);

  // パートナー名が指定されていれば、検索条件に加える
  if (partner_name && partner_name.trim() !== "") {
    query = query.andWhere('user.name', 'like', `%${partner_name}%`);
  }

  return query;
}

// 日報一覧表示
router.get('/', isAuthenticated, checkAuth(2), async (req, res) => {
  console.log('---日報一覧 GET---')
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;
  const total_person_hour = await getTotalPersonHourByDay(current_year, current_month, current_day); // 今日の総工数を取得する

  // 今日の日報一覧を取得する
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
        userAuth: userAuth,
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
        userName: userName,
        userAuth: userAuth,
        authName: authName
      });
    })
});

// 日報検索
// 入力：検索パラメータ（年, 月, 日, ユーザーID）
// 機能：案件の検索
// 出力：検索結果（id, パートナー名, 作業日, jobno, 案件名, 業務内容, 工数, 備考, 総工数）
router.get('/search', isAuthenticated, checkAuth(2), async (req, res) => {
  console.log("---日報検索GET---");
  try{
    // クエリパラメータの取得
    const { year, month, day, partner_name } = req.query;

    // 日付条件を SQL の YEAR, MONTH, DAY 関数で絞り込み
    let query = knex('daily_report')
    .join('jobs', 'daily_report.jobno_id','=', 'jobs.id')            // 案件名
    .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id') // 業務内容
    .join('user', 'daily_report.user_id', '=', 'user.id')            // ユーザー名（後でパートナーの絞り込みに変更）

    // レコード検索　日付条件：dayが指定されていればその日で、なければ月全体を対象にする
    if (day && day.trim() !== "") {
      query = searchByDay(query, year, month, day, partner_name);
    } else {
      query = searchByMonth(query, year, month, partner_name);
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
    
    let total_person_hour = "00:00";

    // 総工数の計算　日付条件：dayが指定されていればその日で、なければ月全体を対象にする
    if (day && day.trim() !== "") {
      total_person_hour = await getTotalPersonHourByDay(year, month, day, partner_name); // 総工数/日の取得
    } else {
      total_person_hour = await getTotalPersonHourByMonth(year, month, partner_name);    // 総工数/月の取得
    }
    
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
