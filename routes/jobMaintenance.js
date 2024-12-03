require('dotenv').config({path: '../.env.dev'});

const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const knex = require('../db/knex')
const checkRelation = require('../db/checkRelation');
const flash = require('connect-flash');

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
  .then(async result => {
    let jobno_id_list = [];
    for (let i=0; i<result.length; i++) {
      jobno_id_list.push(result[i].id);
    };
    res.render('jobMaintenance', {
      title: 'Daily Report App',
      isAuthenticated: req.session.isAuthenticated,
      username: req.session.account?.username,
      jobs: result,
      relationJobnoIdList: await checkRelation.checkRelationId("daily_report", "jobno_id", jobno_id_list)
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

// 案件削除
router.post('/delete', async (req, res) => {
  const id = req.body.id; // クライアントから送信されたjob_idを取得
  
  if (!id) {
    return res.status(400).send({ message: 'ID is required' });
  }
  try {
    const deleteRows = await knex('jobs').where('id', id).del();
    if (deleteRows === 0) {
      return res.status(404).send({ message : `No record found with ID ${id}` })
    }
    res.status(200).send({ message: '案件を削除しました' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `案件の削除に失敗しました` })
  }
})


module.exports = router;