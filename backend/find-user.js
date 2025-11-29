require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function findUser() {
  try {
    const res = await pool.query("SELECT * FROM users WHERE name LIKE '%Devang%'");
    console.log("Users found:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

findUser();
