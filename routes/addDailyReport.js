require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex');

// 日付
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

router.post('/', (req, res) => {
  connection.connect((err) => {
    if (err) {
      console.log("error connecting: " + err.stack);
      return 
    }
    console.log("success")
  });
  
  res.render('index', {
    isAuthenticated: req.session.isAuthenticated,
    username: req.session.account?.username
  });
});

module.exports = router