import pool, { initDb } from './db.js';

async function test() {
  try {
    const client = await pool.connect();
    console.log("Connected to db");
    client.release();
    process.exit(0);
  } catch(e) {
    console.error("DB connection error", e);
    process.exit(1);
  }
}
test();
