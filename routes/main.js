require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex')
const flash = require('connect-flash');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);
const today = new Date().toISOString().split('T')[0];

async function getDayTotalPersonHour(date) {
  try {
    const result = await knex('daily_report')
    .where({'job_date': date})
    .select(knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(person_hour))) AS total_person_hour'))
    if (result[0].total_person_hour === null) {
      return "00:00:00";
    }
    return result[0].total_person_hour;
  } catch (error) {
    console.error('Error:', error);
  }
}

// TODOマネージャーがパートナーに応じて、案件を割り当てるので、jobsを自分の案件のみに絞る
router.get('/', async (req, res, next) => {
  console.log("---main GET---")
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  const selectedDate = req.query.date || today;
  const total_person_hour = await getDayTotalPersonHour(selectedDate);
  await knex('daily_report')
  .join('jobs', 'daily_report.jobno_id','=', 'jobs.id')
  .join('job_desc', 'daily_report.job_desc_id','=', 'job_desc.id')
  .where({'job_date': selectedDate})
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
    res.render('index', {
      isAuthenticated: isAuthenticated,
      userName: userName,
    });
  });
});

router.get('/:id', (req, res) => {
  console.log('---モーダル表示GET---');
  const id = parseInt(req.params.id, 10);
  try {
    const selected_daily_report = knex("daily_report")
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
    .first()
    .then(selected_daily_report => {
      console.log("取得した日報：", selected_daily_report);
      res.json(selected_daily_report);
    })
    .catch(error => {
      console.error(error);
      res.render('index', {
        isAuthenticated: isAuthenticated,
        userName: userName
      })
    })
  } catch(error) {
    console.error("サーバーエラー：", error);
  }
})

// TODO 決め打ちしているuser_id, job_dateを変更する
router.post('/register/:date', async (req, res) => {
  console.log("---新規登録POST---");
  const user_id = 1;
  const job_date = req.params.date;
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
  knex("daily_report")
  .insert({
    user_id: user_id,
    job_date: job_date, 
    jobno_id: jobno_id,
    person_hour: person_hour,
    job_desc_id: job_desc_id,
    note: note
  })
  .then(() => {
    res.redirect(`/main?date=${job_date}`);
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.username,
    })
  })
});

router.post('/edit/:id', async (req, res) => {
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
    console.log("工数を更新しました");
    res.redirect(`/main?date=${job_date}`);
  })
  .catch(error => {
    console.log("データ更新に失敗したよ");
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.username,
    })
  })
})

router.post('/delete/:id', async (req, res) => {
  console.log('---削除POST---');
  const id = req.params.id;
  const job_date = req.query.date;
  
  await knex('daily_report')
  .where({id: id})
  .first()
  .delete()
  .then(() => {
    console.log("工数を削除しました");
    res.redirect(`/main?date=${job_date}`);
  })
  .catch(error => {
    console.log("工数の削除に失敗しました");
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.username,
    })
  })
})

router.post('/absence', async (req, res) => {
  console.log('---休暇申請POST---');
  const user_id = 1;
  const date = req.body.date;
  const reason = req.body.reason;
  
  // absenceに休む日を登録する
  knex("absence")
  .insert({
    user_id: user_id,
    date: date,
    reason: reason
  })
  .then(() => {
    res.redirect(`/main?date=${date}`);
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.username,
    })
  })
})

// 休暇申請削除
router.post('/absence/delete', async (req, res) => {
  console.log('---休暇取消POST---');
  const date = req.query.date;

  knex("absence")
  .where({date: date})
  .first()
  .delete()
  .then(() => {
    console.log("休暇申請を削除しました");
    res.redirect(`/main?date=${date}`);
  })
  .catch(error => {
    console.log("休暇申請の削除に失敗しました");
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      userName: req.session.account?.username,
    })
  })
})

module.exports = router;