require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log("Attempting to connect with:");
console.log(`User: ${process.env.DB_USER}`);
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Database: ${process.env.DB_DATABASE}`);
console.log(`Port: ${process.env.DB_PORT}`);

pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL connected successfully");
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });
