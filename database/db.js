// database/db.js
// SQLite connection using 'sqlite' (promise wrapper over sqlite3)
// Schema is applied automatically on first connection.

const sqlite3 = require('sqlite3');
const { open }  = require('sqlite');
const path = require('path');
const fs   = require('fs');
require('dotenv').config();

const DB_PATH    = process.env.DB_PATH || './database/transitops.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let _db = null;

async function getDb() {
  if (_db) return _db;
  _db = await open({
    filename: path.resolve(DB_PATH),
    driver: sqlite3.Database,
  });

  await _db.run('PRAGMA journal_mode = WAL');
  await _db.run('PRAGMA foreign_keys = ON');
  await _db.run('PRAGMA synchronous = NORMAL');

  // Apply schema using exec() which supports multi-statement SQL
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await _db.exec(schema);

  console.log(`✅ Database connected: ${path.resolve(DB_PATH)}`);
  return _db;
}

module.exports = { getDb };
