import express from 'express';
import client from 'prom-client';

const router = express.Router();

// Collect default Node.js metrics (event loop, heap, GC, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Example custom counter — track alert API hits
export const alertRequestsTotal = new client.Counter({
  name: 'alert_requests_total',
  help: 'Total number of requests to the /alerts endpoint',
  labelNames: ['method', 'status'],
  registers: [register],
});

// GET /metrics — Prometheus scrape endpoint
router.get('/', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error('Error generating metrics:', err);
    res.status(500).end();
  }
});

export { register };
export default router;