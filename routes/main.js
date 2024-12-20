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

router.get('/', (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  
  Promise.all([
    knex('jobs').select('*'),
    knex('job_desc').select('*')
  ])
  .then(([jobs, job_desc]) => {
    console.log(jobs);
    console.log(job_desc);
    res.render('main', {
      isAuthenticated: isAuthenticated,
      username: userName,
      jobs: jobs,
      job_desc: job_desc
    });
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      isAuthenticated: isAuthenticated,
      currentDate: yyyymmdd
    })
  })
})

module.exports = router;