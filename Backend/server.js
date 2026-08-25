import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import AuthRouter from './routes/AuthRouter.js';
import AIRouter from './routes/AIRouter.js';
import ServiceRouter from './routes/ServiceRouter.js';
import AvailabilityRouter from './routes/AvailabilityRouter.js';
import AppointmentRouter from './routes/AppointmentRouter.js';
import NotificationRouter from './routes/NotificationRouter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Codeinyourself AI Appointments API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', AuthRouter);
app.use('/api/ai', AIRouter);
app.use('/api/services', ServiceRouter);
app.use('/api/availability', AvailabilityRouter);
app.use('/api/appointments', AppointmentRouter);
app.use('/api/admin/appointments', AppointmentRouter);
app.use('/api/notifications', NotificationRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

async function startServer(retries = 3) {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Codeinyourself AI Appointments API listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retries > 0) {
        console.warn(`[Server] Port ${PORT} busy, waiting 1s before retrying (${retries} retries left)...`);
        setTimeout(() => {
          server.close();
          startServer(retries - 1);
        }, 1000);
      } else {
        console.error(`\n[Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`To free port ${PORT}, run in PowerShell:`);
        console.error(`Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
        process.exit(1);
      }
    } else {
      console.error('[Server Error]:', err.message);
      process.exit(1);
    }
  });

  // Graceful shutdown on nodemon restart or termination
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGUSR2', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
