import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import { initDb } from './db/init.js';
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import metricsRoutes from './routes/metrics.js';   // ← add


const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: false,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/alerts', alertRoutes);
app.use('/metrics', metricsRoutes);                 


// Fallback error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

async function start() {
  try {
    await initDb();
    console.log('Database schema ready.');
  } catch (err) {
    console.error('Could not initialize the database. Is PostgreSQL reachable?');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Alert Portal API listening on http://localhost:${config.port}`);
    if (!config.github.token) {
      console.warn('GITHUB_TOKEN is not set — Git commits/deletes will be skipped.');
    }
  });
}

start();
