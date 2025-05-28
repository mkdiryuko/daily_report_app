require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql2')
const knex = require('../db/knex')
const flash = require('connect-flash');
const isAuthenticated = require('../auth/isAuthenticated');
const passport = require('passport');

const DBconfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const connection = mysql.createConnection(DBconfig);

router.get('/signin', (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;

  res.render('signin', {
    title: '業務日報管理システム',
    isAuthenticated: isAuthenticated,
    userName: userName,
    userAuth: userAuth,
    authName: authName
  })
})

router.post('/signin', (req, res, next) => {
  passport.authenticate('email-signin', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/signin');

    req.login(user, (err) => {
      if (err) return next(err);

      // セッションに保存
      req.session.userId = user.id;
      req.session.username = user.name;
      req.session.userAuth = user.auth;
      req.session.isAuthenticated = true;

      // セッションに権限名を格納する
      switch ( user.auth ) {
        case 0:
          req.session.authname = "パートナー";
          break;
        case 1:
          req.session.authname = "マネージャー";
          break;
        case 2:
          req.session.authname = "管理者";
          break;
        default:
          req.session.authname = "パートナー";
          break;
      }

      res.redirect('/calendar');
    })
  })(req, res, next);
});

router.get('/signout', (req, res) => {
  req.logout(() => {
    res.redirect('signin');
  });
});

router.get('/create_account', (req, res) => {
  console.log('---アカウントの新規登録---GET')
  const isAuthenticated = req.session.isAuthenticated;
  const userName = req.session.username;
  const userAuth = req.session.userAuth;
  const authName = req.session.authname;

  res.render('createAccount', {
    title: '業務日報管理システム',
    isAuthenticated: isAuthenticated,
    userName: userName,
    userAuth: userAuth,
    authName: authName
  })
})

router.post('/create_account', async (req, res, next) => {
  console.log('---アカウントの新規作成---POST');
  const username = req.body.username;
  const email = req.body.email;

  await knex('user')
  .insert({
    name: username,
    email: email,
    auth: 0 // デフォルトはパートナー
  })
  .then(() => {
    req.flash('success', 'ユーザー登録が完了しました');
    res.redirect('/auth/signin');
  })
  .catch(error => {
    console.error(error);
    error.message = 'ユーザー登録に失敗しました';
    error.status = 500;
    next(error);
  }) 
})

module.exports = router;