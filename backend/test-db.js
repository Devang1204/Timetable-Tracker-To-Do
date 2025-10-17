// test-db.js
import pool from './db.js';

console.log("Attempting to query the database...");

pool.query('SELECT NOW()')
  .then(res => {
    console.log("✅ Success! Database responded with current time:", res.rows[0].now);
    pool.end(); // Close the connection
  })
  .catch(err => {
    console.error("❌ Error connecting to the database:", err);
    pool.end();
  });