require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex');

// 今日の日付
const today = new Date();
const y = today.getFullYear();
const m = today.getMonth() + 1;
const d = today.getDate(); 
const yyyy = y.toString();
const mm = ("00" + m).slice(-2);
const dd = ("00" + d).slice(-2);
const yyyymmdd = yyyy + "/" + mm + "/" + dd;

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/', (req, res, next) => {
  Promise.all([
    knex('jobs').select('*'),
    knex('job_desc').select('*')
  ])
    .then(([jobs, job_desc]) => {
      console.log(jobs);
      console.log(job_desc);
      res.render('addDailyReport', {
        title: 'Daily Report App',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username,
        currentDate: yyyymmdd,
        jobs: jobs,
        job_desc: job_desc
      });
    })
    .catch(error => {
      console.error(error);
      res.render('addDailyReport', {
        title: 'Daily Report App',
        isAuthenticated: req.session.isAuthenticated,
        currentDate: yyyymmdd
      })
    })
});

// TODO 決め打ちしているuser_id, job_dateを変更する
router.post('/', async (req, res) => {
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
    user_id: 1,
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

module.exports = router