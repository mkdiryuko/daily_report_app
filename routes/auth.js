/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const authProvider = require('../auth/AuthProvider');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI, GRAPH_USER_ENDPOINT } = require('../authConfig');
const knex = require('../db/knex');
const mysql = require('mysql');
const fetch = require('../fetch');
const router = express.Router();

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/signin', authProvider.login({
  scopes: [],
  redirectUri: REDIRECT_URI,
  successRedirect: '/'
}));

router.get('/acquireToken', authProvider.acquireToken({
  scopes: ['User.Read'],
  redirectUri: REDIRECT_URI,
  successRedirect: '/users/profile'
}));

router.get('/acquireTokenUserMaintenance', authProvider.acquireToken({
  scopes: ['User.Read.All'],
  redirectUri: REDIRECT_URI,
  successRedirect: '/users/user_maintenance'
}));

router.post('/redirect', authProvider.handleRedirect());

router.get('/signout', authProvider.logout({
  postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI
}));

// ユーザー表示
router.get('/user_maintenance', async function (req, res, next) {
  // TODO GRAPH API を使用して、ZMTのテナントに所属する社員の名前とメールアドレスを取得する
  try {
    const graphResponse = await fetch(GRAPH_USER_ENDPOINT, req.session.accessToken)
    console.log( graphResponse );
  } catch (error) {
    console.log('エラー発生\n', error);
  }

  const auth_dict = {
    0: "パートナー", 
    1: "マネージャー",
    2: "管理者"
  }
  knex("user")
  .select("*")
  .then(users => {
    console.log(users);
    users.forEach(function (value) {
      switch(value.auth) {
        case 0:
          value.auth = auth_dict[0];
          break;
        case 1:
          value.auth = auth_dict[1];
          break;
        case 2:
          value.auth = auth_dict[2];
          break;
      }
    })
    console.log(users);
    res.render('user_maintenance', {
      title: 'Daily Report App',
      users: users,
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username,
    })
  })
  .catch(error => {
    console.error(error);
    res.render('index', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username
    })
  })
})

// ユーザー編集
router.post('/user_edit', (req, res) => {
  const user_id = req.session.id;
  const auth = req.body.auth;
  
  knex("user")
  .insert({
    auth: auth
  })
  .then(() => {
    res.redirect('/auth/user');
  })
  .catch(error => {
    console.error(error);
    res.render('/auth/user', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username,
    })
  })
})

// 全ユーザー情報の取得

module.exports = router;