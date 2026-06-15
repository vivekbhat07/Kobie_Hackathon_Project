require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const client = require("prom-client");

const app = express();

app.use(cors());
app.use(express.json());

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "code"],
});

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();

  res.on("finish", () => {
    end({
      route: req.route ? req.route.path : req.path,
      code: res.statusCode,
      method: req.method,
    });
  });

  next();
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "postgres",
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      error: err.message,
    });
  }
});

// Prometheus endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});