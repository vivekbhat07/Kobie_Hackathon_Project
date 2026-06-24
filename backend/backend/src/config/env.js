import dotenv from 'dotenv';

dotenv.config();

function list(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function bool(value) {
  return String(value).toLowerCase() === 'true';
}

const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigins: list(process.env.CORS_ORIGIN, ['http://localhost:5173']),

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  allowedDomains: list(process.env.ALLOWED_EMAIL_DOMAINS, ['pes.edu', 'kobie.ai']),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,

  db: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'alert_portal',
    ssl: bool(process.env.PGSSL) ? { rejectUnauthorized: false } : false,
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Alert Portal <no-reply@example.com>',
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || 'vaishjp',
    repo: process.env.GITHUB_REPO || 'oneclick-gitops',
    branch: process.env.GITHUB_BRANCH || 'main',
    alertsDir: (process.env.GITHUB_ALERTS_DIR || 'apps/alerts').replace(/\/+$/, ''),
  },
};

export default config;
