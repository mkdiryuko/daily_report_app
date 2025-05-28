const express = require('express');
const knex = require('../db/knex');
const router = express.Router();
const mysql = require('mysql2');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/', function (req, res, next) {
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;

  res.render('index', {
    title: '業務日報管理アプリ',
    isAuthenticated: isAuthenticated,
    userName: userName,
    userAuth: userAuth,
    authName: authName
  });
});

module.exports = router;
