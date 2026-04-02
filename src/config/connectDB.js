import mysql from "mysql2/promise";
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),

  // fix date
  timezone: "+07:00",
  dateStrings: ["DATETIME", "TIMESTAMP"],
});

export default pool;
