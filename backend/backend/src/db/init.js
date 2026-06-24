import pool from './pool.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS otps (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps (email);

CREATE TABLE IF NOT EXISTS alerts (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_name       TEXT NOT NULL,
  deployment_name  TEXT NOT NULL,
  alert_type       TEXT NOT NULL,
  severity         TEXT NOT NULL,
  threshold        TEXT,
  file_path        TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts (user_id);
`;

export async function initDb() {
  await pool.query(SCHEMA);
}

// Allow running directly: `npm run init-db`
if (import.meta.url === `file://${process.argv[1]}`) {
  initDb()
    .then(() => {
      console.log('Database schema is ready.');
      return pool.end();
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}
