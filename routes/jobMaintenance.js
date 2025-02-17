require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex')
const checkRelation = require('../db/checkRelation');
const flash = require('connect-flash');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/', async (req, res, next) => {
  // DBからjobno、案件名、開始日、終了日を取得
  knex('jobs')
  .select(
    'id',
    'jobno',
    'name',
    knex.raw("DATE_FORMAT(start_date, '%Y/%m/%d') AS 'start_date'"),
    knex.raw("DATE_FORMAT(end_date, '%Y/%m/%d') AS 'end_date'")
  )
  .then(async results => {
    // let jobno_id_list = [];
    // jobno id のリストを作成
    // for (let i=0; i<results.length; i++) {
    //   jobno_id_list.push(results[i].id);
    // };
    // relationJobnoIdList = await checkRelation.checkRelationId('dailly_report', 'jobno_id', jobno_id_list);
    res.render('jobMaintenance', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name,
      jobs: results,
      // relationJobnoIdList: await checkRelation.checkRelationId("daily_report", "jobno_id", jobno_id_list), 
    })
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name
    })
  })
});

// 案件削除
router.post('/delete', async (req, res) => {
  const id = req.body.id; // クライアントから送信されたjob_idを取得
  
  if (!id) {
    return res.status(400).send({ message: 'ID is required' });
  }
  try {
    const deleteRows = await knex('jobs').where('id', id).del();
    if (deleteRows === 0) {
      return res.status(404).send({ message : `No record found with ID ${id}` })
    }
    res.status(200).send({ message: '案件を削除しました' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `案件の削除に失敗しました` })
  }
})

// 案件検索
router.get('/search', async (req, res) => {
  // クエリパラメータから入力値を取得
  // 空文字列の場合も考慮して、trimしてチェック
  const jobno_search    = req.query.jobno_search && req.query.jobno_search.trim();
  const name_search     = req.query.name_search && req.query.name_search.trim();
  const start_date_search = req.query.start_date_search && req.query.start_date_search.trim();
  const end_date_search   = req.query.end_date_search && req.query.end_date_search.trim();

  try {
    // クエリビルダーを初期化
    const query = knex('jobs');

    // jobnoの検索　部分一致検索
    if (jobno_search) {
      query.where('jobno', 'like', `%${jobno_search}%`);
    }

    // 案件名の検索　部分一致検索
    if (name_search) {
      query.where('name', 'like', `%${name_search}%`);
    }

    // 開始日の検索：入力があれば、指定日以降のデータを抽出
    if (start_date_search) {
      query.where('start_date', '>=', start_date_search);
    }

    // 終了日の検索：入力があれば、指定日以前のデータを抽出
    if (end_date_search) {
      query.where('end_date', '<=', end_date_search);
    }

    // 検索結果を取得
    const results = await query.select(
      'id', 
      'jobno', 
      'name', 
      knex.raw("DATE_FORMAT(start_date, '%Y/%m/%d') AS 'start_date'"),
      knex.raw("DATE_FORMAT(end_date, '%Y/%m/%d') AS 'end_date'")
    );
    console.log("検索結果：", results);

    res.render('jobMaintenance', {
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name,
      jobs: results
    });
  } catch (error) {
    console.error(error);
    res.render('index', {
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name,
    });
  }
});

module.exports = router;