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

// 案件一覧表示
router.get('/', async (req, res) => {
  try {
    const results = await knex('jobs')
      .select(
        'id',
        'jobno',
        'name',
        knex.raw("DATE_FORMAT(start_date, '%Y/%m/%d') AS 'start_date'"),
        knex.raw("DATE_FORMAT(end_date, '%Y/%m/%d') AS 'end_date'")
      );

    res.render('jobMaintenance', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name,
      jobs: results,
      // relationJobnoIdList: await checkRelation.checkRelationId("daily_report", "jobno_id", jobno_id_list),
    });
  } catch (error) {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name
    });
  }
});

// 案件検索
router.get('/search', async (req, res) => {
  console.log("---案件検索GET---");
  // クエリパラメータの取得（trimして空文字列も考慮）
  const jobno_search = req.query.jobno_search?.trim();
  const name_search = req.query.name_search?.trim();
  const start_date_search = req.query.start_date_search?.trim();
  const end_date_search = req.query.end_date_search?.trim();

  console.log({ jobno_search, name_search, start_date_search, end_date_search });

  try {
    const query = knex('jobs');

    // jobno の部分一致検索
    if (jobno_search) {
      query.where('jobno', 'like', `%${jobno_search}%`);
    }
    // 案件名の部分一致検索
    if (name_search) {
      query.where('name', 'like', `%${name_search}%`);
    }
    // 開始日の検索：指定日以降
    if (start_date_search) {
      query.where('start_date', '>=', start_date_search);
    }
    // 終了日の検索：指定日以前
    if (end_date_search) {
      query.where('end_date', '<=', end_date_search);
    }

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
    console.error("検索エラー：", error);
    res.render('index', {
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.name
    });
  }
});

// 案件モーダル表示（ID 指定の案件取得）
router.get('/:id', async (req, res) => {
  console.log('---案件モーダル表示GET---');
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    console.error("無効なIDが渡されました:", req.params.id);
    return res.status(400).json({ error: "Invalid id parameter" });
  }
  try {
    const job = await knex("jobs")
      .where({ id: id })
      .select(
        'jobno',
        'name',
        knex.raw("DATE_FORMAT(start_date, '%Y-%m-%d') AS 'start_date'"),
        knex.raw("DATE_FORMAT(end_date, '%Y-%m-%d') AS 'end_date'")
      )
      .first();
    console.log("取得した案件：", job);
    res.json(job);
  } catch (error) {
    console.error("データ取得エラー：", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 案件削除
router.post('/delete', async (req, res) => {
  const id = parseInt(req.body.id, 10); // 数値変換
  if (isNaN(id)) {
    return res.status(400).send({ message: '有効なIDを指定してください' });
  }
  try {
    const deleteRows = await knex('jobs').where('id', id).del();
    if (deleteRows === 0) {
      return res.status(404).send({ message: `ID ${id} のレコードは存在しません` });
    }
    res.status(200).send({ message: '案件を削除しました' });
  } catch (error) {
    console.error("削除エラー：", error);
    res.status(500).send({ message: '案件の削除に失敗しました' });
  }
});

module.exports = router;
