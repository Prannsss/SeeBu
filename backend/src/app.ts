import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import { limiter } from './middlewares/rateLimiter';
import authRoutes from './routes/authRoutes';
import locationRoutes from './routes/locationRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import departmentRoutes from './routes/departmentRoutes';
import invitationRoutes from './routes/invitationRoutes';

// Load variables (resolve from this file, not cwd, so it works regardless of launch directory)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
// Behind Render/Vercel proxies: use the first X-Forwarded-For hop as req.ip (rate limiting)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Apply rate limiting to all requests
app.use(limiter);

const allowedOrigins = [
  'https://seebu.prannsss.dev',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body limits: up to 50MB for base64 image uploads (reports/tasks), 1MB elsewhere.
// The upload parser runs first; the global parser then skips already-parsed bodies.
const uploadJson = express.json({ limit: '50mb' });
app.use('/api/v1/reports', uploadJson);
app.use('/api/v1/tasks', uploadJson);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

console.log(`[cache] REDIS_URL ${process.env.REDIS_URL ? 'set' : 'unset (in-memory cache)'}`);

// Health check endpoint for Render/Root URL
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'SeeBu API',
    timestamp: new Date().toISOString() 
  });
});

// Root route - Render shows this when accessing the base URL
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'SeeBu API',
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/invitations', invitationRoutes);

// API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// JSON error responses (instead of Express's default HTML page)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Upload too large. Please use fewer or smaller photos.' });
  if (err?.message === 'Not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed' });
  const status = err?.status || 500;
  if (status < 500) return res.status(status).json({ error: 'Invalid request' });
  console.error('[unhandled]', err);
  return res.status(status).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Render's free tier sleeps after 15 min without inbound traffic. Hitting our own public URL
// (RENDER_EXTERNAL_URL is set by Render; unset locally, so this is a no-op in dev) counts as
// inbound traffic and keeps the instance awake.
// ponytail: self-ping can't wake an instance that's already asleep (e.g. after a crash);
// add an external pinger (cron-job.org / UptimeRobot) if that ever matters.
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  setInterval(() => {
    fetch(`${SELF_URL}/health`, { signal: AbortSignal.timeout(10_000) })
      .catch((err) => console.warn('[keep-alive] ping failed:', err?.message));
  }, 14 * 60 * 1000);
}
