import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { limiter } from './middlewares/rateLimiter';
import authRoutes from './routes/authRoutes';
import locationRoutes from './routes/locationRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import departmentRoutes from './routes/departmentRoutes';

// Load variables (resolve from this file, not cwd, so it works regardless of launch directory)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

// Apply rate limiting to all requests
app.use(limiter);

const allowedOrigins = [
  'https://seebucommunity.vercel.app',
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
// Small default body limit; reports/tasks accept base64 photo payloads and get a
// larger, route-scoped limit applied ahead of their routers below.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const imageUploadBodyLimit = express.json({ limit: '10mb' });

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
app.use('/api/v1/reports', imageUploadBodyLimit, reportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', imageUploadBodyLimit, taskRoutes);
app.use('/api/v1/departments', departmentRoutes);

// API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
