require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkCounts() {
  try {
    const tables = ['users', 'timetables', 'todos'];
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${res.rows[0].count} rows`);
    }
  } catch (err) {
    console.error("Error counting rows:", err);
  } finally {
    pool.end();
  }
}

checkCounts();
