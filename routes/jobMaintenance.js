require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex')

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/', async (req, res, next) => {
    knex('jobs')
    .select(
      'id',
      'jobno',
      'name',
      knex.raw("DATE_FORMAT(start_date, '%Y/%m/%d') AS 'start_date'"),
      knex.raw("DATE_FORMAT(end_date, '%Y/%m/%d') AS 'end_date'")
    )
    .then(result => {
      console.log(result);
      res.render('jobMaintenance', {
        title: 'Daily Report App',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username,
        jobs: result
      })
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