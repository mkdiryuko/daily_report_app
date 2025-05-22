const passport = require('passport');
const { Strategy } = require('passport-custom');
const knex = require("../db/knex");

module.exports = () => {
  // ユーザーをセッションに保存する
  passport.serializeUser((user, done) => {
    console.log("serializeUser");
    done(null, user.id);
  });

  // セッションからユーザーを復元する
  passport.deserializeUser(async (id, done) => {
    console.log("deserializeUser");
    try {
      const user = await knex('user').where({ id }).first();
      if (!user) {
        return done(new Error('User not found'), null);
      }
      return done(null, user);
    } catch (error) {
      console.error(error);
      return done(error, null);
    }
  });

  // メールアドレスだけでログイン
  passport.use('email-signin', new Strategy(async (req, done) => {
    const email = req.body.email;
    try {
      const user = await knex('user').where({ email }).first();
      if (!user) {
        return done(null, false, { message: 'そのメールアドレスは登録されていません。' });
      }
      console.log("ログイン成功!!");
      return done(null, user); // ログイン成功
    } catch (error) {
      console.error(error);
      return done(error, false);
    }
  }));
};
