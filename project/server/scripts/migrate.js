/**
 * Runs migrations/001_init_schema.sql against the configured MySQL server.
 * Usage: npm run migrate   (from /server)
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_init_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('[migrate] Applying schema...');
  await connection.query(sql);
  console.log('[migrate] Done.');
  await connection.end();
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
