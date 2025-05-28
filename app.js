require('dotenv').config({path: '.env.dev'});

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');
const redisClient = createClient(6379, 'redis');
const connectFlash = require('connect-flash');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const mainRouter = require('./routes/main');
const authRouter = require('./routes/auth');
const jobMaintenanceRouter = require('./routes/jobMaintenance');
const calendarRouter = require('./routes/calendar');
const checkDailyReportRouter = require('./routes/checkDailyReport');

redisClient.connect().catch(console.error);
const redisStore = new RedisStore({
  client: redisClient,
});

// initialize express
const app = express();

// authorization
require("./auth/passport")();

app.use(session({
  store: redisStore,
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // TODO set this to true on production
    maxAge: 24 * 60 * 60* 1000 // クッキーの有効時間：24時間
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
app.use(cookieParser('keyboard cat'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// passport
app.use(passport.initialize());
app.use(passport.session());

// routing
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/jobMaintenance', jobMaintenanceRouter);
app.use('/main', mainRouter);
app.use('/calendar', calendarRouter);
app.use('/checkDailyReport', checkDailyReportRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// global error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message; // エラーメッセージを設定
  res.locals.error = req.app.get('env') === 'development' ? err : {}; // 開発環境なら、エラーオブジェクト全体を設定（製品版なら空のオブジェクトを設定）

  // HTTP ステータスを設定
  const status = err.status || 500;
  res.status(status);

  res.render('error', {
    status: status,
    message: err.message,
    error: res.locals.error,
    isAuthenticated: req.session.isAuthenticated,
    userName: req.session.username,
    userAuth: req.session.userAuth,
    authName: req.session.authname
  });
});

app.get('/', (req, res) => {
  res.redirect('/siginin');
})

module.exports = app;