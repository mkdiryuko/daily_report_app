require('dotenv').config({ path: '../.env.dev' });

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const knex = require('../db/knex');
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

// 削除対象の案件と紐づいた日報がある場合、警告を出す
async function checkChildRecords(table_name, fk_name, fk_value) {
  try {
    // daily_report DBから、jobno_idが一致するレコードを1件取得
    const record = await knex(table_name)
    .where(fk_name, fk_value)
    .first();

    // レコードが取得出来たら存在すると判断
    const hasChildRecords = !!record;
    return hasChildRecords;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 初期表示(案件一覧表示)
// マネージャーまたは管理者権限が必要
router.get('/', isAuthenticated, checkAuth(1), async (req, res, next) => {
  console.log('---案件一覧GET---');
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;

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
      isAuthenticated: isAuthenticated,
      userName: userName,
      userAuth: userAuth,
      authName: authName,
      jobs: results,
    });
  } catch (error) {
    console.error(error);
    error.message = '案件一覧の取得に失敗しました';
    error.status = '500';
    next(error);
  }
});

// 案件検索
// 検索パラメータ（jobno, 案件名, 開始日, 終了日）
router.get('/search', isAuthenticated, checkAuth(1), async (req, res, next) => {
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
      ...req.query,
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.username,
      userAuth: req.session.userAuth,
      authName: req.session.authname,
      jobs: results,
    });
  } catch (error) {
    console.error("検索エラー：", error);
    error.message = '案件の検索に失敗しました';
    error.status = '500';
    next(error);
  }
});

// 案件モーダル表示（ID 指定の案件取得）
router.get('/:id', isAuthenticated, checkAuth(1), async (req, res, next) => {
  console.log('---案件モーダル表示GET---');
  const id = parseInt(req.params.id, 10); // 案件id
  const hasChildRecord = await checkChildRecords('daily_report', 'jobno_id', `${id}`); // 案件idと紐づく日報があるかどうかを判定

  if (isNaN(id)) {
    console.error("無効なIDが渡されました:", req.params.id);
    const err = new Error('無効なIDが渡されました。該当する案件が存在しません。');
    err.status = 404;
    return next(err);
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
    res.json({
      job: job,
      hasChildRecord: hasChildRecord
    });
  } catch (error) {
    console.error("データ取得エラー：", error);
    error.message = '案件の取得に失敗しました';
    error.status = 500;
    next(error);
  }
});

// 案件登録
// 入力：jobno, 案件名, 開始日, 終了日
// 機能：案件の登録
router.post('/register', isAuthenticated, checkAuth(1), async (req, res, next) => {
  console.log('---案件登録POST---');
  const jobno = req.body.jobno;
  const job_name = req.body.jobName;
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;

  await knex("jobs")
  .insert({
    jobno: jobno,
    name: job_name,
    start_date: start_date,
    end_date: end_date
  })
  .then(() => {
    req.flash('success', '案件を登録しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect('/jobMaintenance');
    })
  })
  .catch(error => {
    console.error(error);
    error.message = '案件の取得に失敗しました';
    error.status = 500;
    next(error);
  })
})

// 案件更新
// 入力：更新対象レコードのid, jobno, 案件名, 開始日, 終了日
// 機能：登録済み案件の内容を更新する
router.post('/edit/:id', isAuthenticated, checkAuth(1), async (req, res, next) => {
  const id = req.params.id; // 更新対象レコードのid
  const jobno = req.body.jobno;
  const job_name = req.body.jobName;
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;

  if (isNaN(id)) {
    return res.status(400).send({ message: '有効なIDを指定してください'});
  }

  await knex('jobs')
  .where({id: id})
  .update(
    {
      jobno: jobno,
      name: job_name,
      start_date: start_date,
      end_date: end_date
    }
  )
  .then(() => {
    req.flash('success', '案件を編集しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect('/jobMaintenance');
    })
  })
  .catch(error => {
    console.log("案件の更新に失敗しました");
    console.error("サーバーエラー：", error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.username,
      userAuth: req.session.userAuth,
      authName: req.session.authname
    })
  })
})

// 案件削除
router.post('/delete/:id', isAuthenticated, checkAuth(1), (req, res, next) => {
  const id = req.params.id; // 削除対象レコードのid

  if (isNaN(id)) {
    return res.status(400).send({ message: '有効なIDを指定してください' });
  }

  knex('jobs')
    .where('id', id)
    .delete()
    .then(deleteRows => {
      if (deleteRows === 0) {
        return res.status(404).send({ message: `ID ${id} のレコードは存在しません` });
      }
      req.flash('success', '案件を削除しました');
      // セッションの保存が完了してからリダイレクトする
      req.session.save(() => {
        res.redirect('/jobMaintenance');
      })
    })
    .catch(error => {
      console.error("削除エラー：", error);
      res.render('index', {
        title: 'Daily Report App',
        isAuthenticated: req.session.isAuthenticated,
        userName: req.session.username,
        userAuth: req.session.userAuth,
        authName: req.session.authname
      })
    });
});

module.exports = router;
