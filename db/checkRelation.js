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

async function checkRelationId(childDBName, relationRowName, parentIds) {
    try {
        const childIds = await knex(childDBName).whereIn(relationRowName, parentIds).distinct(relationRowName);
        if (childIds.length === 0){
            console.log(`${childDBName}とリレーションを持つレコードはありません`);
            return [];
        } else {
            console.log(`${childDBName}: ${relationRowName}`)
            object_childIds = JSON.parse(JSON.stringify(childIds)); 
            let id_list = [];
            for (const childId of object_childIds) {
                id_list.push(childId[relationRowName].toString());
            }
            console.log(id_list);
            return id_list;
        }
    } catch(error) {
        console.log(`${childDBName}へのアクセスに失敗しました`);
        console.error(error);
        return [];
    }
}

module.exports = {
    checkRelationId,
}