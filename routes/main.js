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

async function getTotalPersonHour(date) {
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
  const total_person_hour = await getTotalPersonHour(selectedDate);
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
      knex('absence').select('date').where({'date': selectedDate})
    ]).then(([jobs, job_descs]) => {
      res.render('main', {
        isAuthenticated: isAuthenticated,
        userName: userName,
        daily_reports: daily_reports,
        jobs: jobs,
        job_descs: job_descs,
        selectedDate: selectedDate,
        total_person_hour: total_person_hour.slice(0, 5),
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
router.post('/', async (req, res) => {
  console.log("---新規登録POST---");
  const user_id = 1;
  const job_date = req.query.date;
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
    res.redirect('/main');
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username,
    })
  })
});

router.post('/edit', async (req, res) => {
  console.log("---編集用POSTルート---");
  const id = req.body.id;
  const jobno = req.body.jobNo;
  const job_desc = req.body.job_desc;
  const person_hour = req.body.person_hour;
  const note = req.body.note;
  console.log("jobno", jobno);
  console.log("job_desc", job_desc);
  console.log("person_hour", person_hour);
  
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
    console.log("フロントエンドに戻るよ");
    res.status(200).send({ message: '工数を更新しました'});
  })
  .catch(error => {
    console.log("データ更新に失敗したよ");
    console.error(error);
    res.status(500).send({ message: `工数の更新に失敗しました`})
  })
})

router.post('/delete', async (req, res) => {
  console.log('---削除POST---');
  const id = req.body.id;
  console.log("削除するid:", id);
  await knex('daily_report')
  .where({id: id})
  .first()
  .delete()
  .then(() => {
    console.log("工数を削除しました");
    res.status(200).send({ message: '工数を削除しました'});
  })
  .catch(error => {
    console.log("工数の削除に失敗しました");
    console.error(error);
    res.status(500).send({ message: '工数の削除に失敗しました'});
  })
})

router.post('/absence', async (req, res) => {
  console.log('---休暇申請POST---');
  const user_id = 1;
  const date = req.body.date;
  const reason = req.body.reason;
  
  // absenceに業務日報を登録する
  knex("absence")
  .insert({
    user_id: user_id,
    date: date,
    reason: reason
  })
  .then(() => {
    res.redirect('/main');
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username,
    })
  })
})

module.exports = router;