require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
`)
  .then(res => {
    console.log("Tables found:");
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
    pool.end();
  })
  .catch(err => {
    console.error("Error listing tables:", err);
    pool.end();
  });
