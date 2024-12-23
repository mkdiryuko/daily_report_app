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

// TODOマネージャーがパートナーに応じて、案件を割り当てるので、jobsを自分の案件のみに絞る
router.get('/', async (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  const selectedDate = req.query.date || today;
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
    'daily_report.holiday',
    'daily_report.note'
  )
  .then(daily_reports => {
    console.log("日報：", daily_reports);
    return Promise.all([
      knex('jobs').select('*'),
      knex('job_desc').select('*')
    ]).then(([jobs, job_descs]) => {
      res.render('main', {
        isAuthenticated: isAuthenticated,
        userName: userName,
        daily_reports: daily_reports,
        jobs: jobs,
        job_descs: job_descs,
        selectedDate: selectedDate
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

// TODO 決め打ちしているuser_id, job_dateを変更する
router.post('/', async (req, res) => {
  const user_id = req.session.userId;
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
    job_date: "2024-11-11", 
    jobno_id: jobno_id,
    person_hour: person_hour,
    job_desc_id: job_desc_id,
    holiday: 0,
    note: note
  })
  .then(() => {
    res.redirect('/addDailyReport');
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

module.exports = router;