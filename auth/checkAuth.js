/**
 * ユーザー権限をチェックするミドルウェア関数
 * @param {number} requiredPermission - アクセスに必要な最低権限（例：0, 1, 2）
 * @returns Express のミドルウェア関数
 */
const checkAuth = (requiredAuth) => {
  return (req, res, next) => {
    // ユーザー情報が存在しない場合は、ログイン状態でないと判断
    if (!req.session.isAuthenticated) {
      return res.redirect('/auth/signin'); // sign-in route にリダイレクト
    }

    // ユーザーの権限レベルを取得
    const userAuth = req.session.userAuth;

    // ユーザーの権限が要求値に満たない場合、権限不足エラーを返す
    if (userAuth < requiredAuth) {
      res.render('error', {
        status: 403,
        message: 'このページにアクセスする権限がありません',
        error: res.locals.error,
        isAuthenticated: req.session.isAuthenticated,
        userName: req.session.username,
        userAuth: req.session.userAuth,
        authName: req.session.authname
      })
      return;
    }

    // 権限が十分な場合は、次のミドルウェアまたはルートハンドラへ進む
    next();
  };
};

module.exports = checkAuth;
