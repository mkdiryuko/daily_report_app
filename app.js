/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
// const flash = require('express-flash');
const connectFlash = require('connect-flash');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const mainRouter = require('./routes/main');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const jobMaintenanceRouter = require('./routes/jobMaintenance');
const calendarRouter = require('./routes/calendar');
const checkDailyReportRouter = require('./routes/checkDailyReport');

// initialize express
const app = express();

app.use(cookieParser('keyboard cat'));

/**
 * 永続的なユーザーセッションに express-session ミドルウェアを使用します。利用可能なオプションをよく理解してください。
 * Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // TODO set this to true on production
    maxAge: 3600000 // クッキーの有効時間：1時間 (3600000ミリ秒)
  }
}));

// express-flashの設定
app.use(connectFlash());

// flashメッセージをすべてのビューで使えるようにローカル変数に設定
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/jobMaintenance', jobMaintenanceRouter);
app.use('/main', mainRouter);
app.use('/calendar', calendarRouter);
app.use('/checkDailyReport', checkDailyReportRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;