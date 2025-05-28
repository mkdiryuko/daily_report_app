require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql2')
const knex = require('../db/knex')
const flash = require('connect-flash');
const isAuthenticated = require('../auth/isAuthenticated');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);
const today = new Date().toISOString().split('T')[0];

// 日付、ユーザーIDを指定して総工数を計算する関数
async function getDayTotalPersonHour(date, user_id) {
  try {
    const result = await knex('daily_report')
    .where({'job_date': date, 'user_id': user_id})
    .select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour'))
    if (result[0].total_person_hour === null) {
      return "00:00";
    }
    return result[0].total_person_hour;
  } catch (error) {
    console.error('Error:', error);
  }
}

// TODOマネージャーがパートナーに応じて、案件を割り当てるので、jobsを自分の案件のみに絞る
router.get('/', isAuthenticated, async (req, res, next) => {
  console.log("---main GET---")
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userId = req.session.userId;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;
  const selectedDate = req.query.date || today;
  const total_person_hour = await getDayTotalPersonHour(selectedDate, userId);
  await knex('daily_report')
  .join('jobs', 'daily_report.jobno_id','=', 'jobs.id')
  .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id')
  .where({'job_date': selectedDate, 'user_id': userId}) // ユーザー個々のレコードを表示
  .select(
    'daily_report.id',
    'daily_report.user_id',
    'jobs.jobno as jobno',
    'jobs.name as job_name',
    'daily_report.person_hour',
    'job_desc.name as job_desc_name',
    'daily_report.note'
  )
  .then(daily_reports => {
    return Promise.all([
      knex('jobs').select('*'),
      knex('job_desc').select('*'),
      knex('absence').select('date').where({'date': selectedDate}).first()
    ]).then(([jobs, job_descs, absence]) => {
      res.render('main', {
        isAuthenticated: isAuthenticated,
        userName: userName,
        userAuth: userAuth,
        authName: authName,
        daily_reports: daily_reports,
        jobs: jobs,
        job_descs: job_descs,
        selectedDate: selectedDate,
        total_person_hour: total_person_hour.slice(0, 5),
        absence: !!absence
      });
    });
  })
  .catch(error => {
    console.error(error);
    error.message = '工数登録ページの読込に失敗しました';
    error.status = 500;
    next(error);
  });
});

// 既に登録された日報を、編集・削除モーダル中のフォームに格納するために取得する
router.get('/:id', isAuthenticated, async (req, res, next) => {
  console.log('---モーダル表示GET---');
  const id = parseInt(req.params.id, 10);
  try { 
    const selected_daily_report = await knex("daily_report")
    .join('jobs', 'daily_report.jobno_id','=', 'jobs.id')
    .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id')
    .where({'daily_report.id': id})
    .select(
      'jobs.jobno as jobno',
      'jobs.name as job_name',
      'daily_report.person_hour',
      'job_desc.name as job_desc_name',
      'daily_report.note'
    )
    .first();
    
    // 該当する日報が存在しない場合は404エラーを返す
    if (!selected_daily_report) {
      const err = new Error('該当する日報が存在しません');
      err.status = 404;
      console.log(err);
      return next(err);
    }

    console.log('取得した日報：', selected_daily_report);
    res.json(selected_daily_report);

  } catch(error) {
    console.error("サーバーエラー：", error);
    error.message = '工数の取得に失敗しました';
    error.status = 500;
    next(error);
  }
})

// 新規登録
router.post('/register/:date', isAuthenticated, async (req, res, next) => {
  console.log("---新規登録POST---");
  const user_id = req.session.userId;
  const job_date = req.params.date;  // 日付をクライアントから取得
  const jobno = req.body.jobNo;
  const job_desc = req.body.job_desc;
  const person_hour = req.body.person_hour;
  const note = req.body.note;
  let jobno_id = 0;
  let job_desc_id = 0;
  
  // jobnoがjobs DBに存在するかをチェック
  await knex("jobs")
  .select('id')
  .where({"jobno" : jobno})
  .first()
  .then(result => {
    if (result) {
      jobno_id = result.id;
      console.log('job_id', jobno_id);
    } else {
      console.log('job_idが存在しません');
    }
  })
  .catch(error => {
    console.log(error);
  })

  // job_descがjob_desc DBに存在するかをチェック
  await knex("job_desc")
  .select("id")
  .where({"name" : job_desc})
  .first()
  .then(result => {
    if (result) {
      job_desc_id = result.id;
      console.log("job_desc_id", job_desc_id);
    } else {
      console.log("job_desc_idが存在しません");
    }
  })
  .catch(error => {
    console.error(error);
  })
  
  // daily_reportに業務日報を登録する
  await knex("daily_report")
  .insert({
    user_id: user_id,
    job_date: job_date,
    jobno_id: jobno_id,
    person_hour: person_hour,
    job_desc_id: job_desc_id,
    note: note
  })
  .then(() => {
    req.flash('success', '日報を登録しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect(`/main?date=${job_date}`);
    })
  })
  .catch(error => {
    console.error(error);
    error.message = '工数の登録に失敗しました';
    error.status = 500;
    next(error);
  })
});

// 編集
router.post('/edit/:id', isAuthenticated, async (req, res, next) => {
  console.log("---編集用POSTルート---");
  const id = req.params.id;
  const jobno = req.body.jobNo;
  const job_desc = req.body.job_desc;
  const person_hour = req.body.person_hour;
  const note = req.body.note;
  const job_date = req.query.date;
  
  // jobnoがjobs DBに存在するかをチェック
  await knex("jobs")
  .select('id')
  .where({"jobno" : jobno})
  .first()
  .then(result => {
    if (result) {
      jobno_id = result.id;
      console.log('job_id', jobno_id);
    } else {
      console.log('job_idが存在しません');
    }
  })
  .catch(error => {
    console.log(error);
  })

  // job_descがjob_desc DBに存在するかをチェック
  await knex("job_desc")
  .select("id")
  .where({"name" : job_desc})
  .first()
  .then(result => {
    if (result) {
      job_desc_id = result.id;
      console.log("job_desc_id", job_desc_id);
    } else {
      console.log("job_desc_idが存在しません");
    }
  })
  .catch(error => {
    console.error(error);
  })

  await knex("daily_report")
  .where({ id: id})
  .update(
    {
      jobno_id: jobno_id,
      person_hour: person_hour,
      job_desc_id: job_desc_id,
      note: note
    }
  )
  .then(() => {
    req.flash('success', '日報を編集しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect(`/main?date=${job_date}`);
    })
  })
  .catch(error => {
    console.error(error);
    error.message = '工数の編集に失敗しました';
    error.status = 500;
    next(error);
  })
})

// 削除
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  console.log('---削除POST---');
  const id = req.params.id;
  const job_date = req.query.date;
  
  await knex('daily_report')
  .where({id: id})
  .first()
  .delete()
  .then(() => {
    req.flash('success', '日報を削除しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect(`/main?date=${job_date}`);
    })
  })
  .catch(error => {
    console.error(error);
    error.message = '工数の削除に失敗しました';
    error.status = '500';
    next(error);
  })
})

// 休暇申請
router.post('/absence', async (req, res) => {
  console.log('---休暇申請POST---');
  const user_id = req.session.userId;
  const date = req.body.date || today;
  const reason = req.body.reason;
  
  // absenceに休む日を登録する
  await knex("absence")
  .insert({
    user_id: user_id,
    date: date,
    reason: reason
  })
  .then(() => {
    req.flash('success', '休暇申請を受領しました');
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect(`/main?date=${date}`);
    })
  })
  .catch(error => {
    console.error(error);
    error.message = '休暇申請の登録に失敗しました';
    error.status = '500';
    next(error);
  })
})

// 休暇申請削除
router.post('/absence/delete', isAuthenticated, async (req, res) => {
  console.log('---休暇取消POST---');
  const date = req.query.date;

  await knex("absence")
  .where({date: date})
  .first()
  .delete()
  .then(() => {
    req.flash('success', '休暇申請を取り消しました')
    // セッションの保存が完了してからリダイレクトする
    req.session.save(() => {
      res.redirect(`/main?date=${date}`);
    })
  })
  .catch(error => {
    console.log("休暇申請の削除に失敗しました");
    console.error(error);
    error.message = '休暇申請の削除に失敗しました';
    error.status = '500';
    next(error);
  })
})

module.exports = router;