const mysql = require("mysql");

const util = require('util')

const dbConf = mysql.createPool({
  host: process.env.DB_HOST,
  user:  process.env.DB_USER,
  password:  process.env.DB_PASSWORD,
  database:  process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const dbQuery = util.promisify(dbConf.query).bind(dbConf)

module.exports = { dbConf, dbQuery };