/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const knex = require('../db/knex');
const router = express.Router();
const mysql = require('mysql');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/', function (req, res, next) {
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.account?.name;
  const userEmail = req.session.account?.username;

  if (isAuthenticated) {
    knex('user')
    .select('email')
    .where( { email: userEmail })
    .first()
    .then(result => {
      if (result) {
        console.log('このユーザーは既に登録されています');
        return;
      } else {
        knex('user')
        .insert({name: userName, email: userEmail, auth: 0})
        .then(() => {
            console.log('新規ユーザーを登録しました')
            console.log('name : ', userName)
            console.log('email : ', userEmail)
          }
        )
      }
    })
    .catch(error => {
      console.error(error);
    })
  }
  res.render('index', {
    title: '業務日報管理アプリ',
    isAuthenticated: isAuthenticated,
    userEmail: userName,
    userName: userEmail
  });
});

module.exports = router;
