import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logStream, logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import vendorRoutes from './routes/vendor.routes';
import poRoutes from './routes/po.routes';
import grRoutes from './routes/gr.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = env.CORS_ORIGIN.split(',').map((o) => o.trim());
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts' },
});

app.use(globalLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Logging ────────────────────────────────────────────────────────────────

if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logStream }));
}

// ─── Health Checks ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'workwise-api',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
  });
});

app.get('/ready', async (_req, res) => {
  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/purchase-orders', poRoutes);
app.use('/api/v1/goods-receipts', grRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// API version info
app.get('/api/v1', (_req, res) => {
  res.json({
    name: 'WorkWise API',
    version: 'v1',
    status: 'operational',
    endpoints: [
      '/api/v1/auth',
      '/api/v1/vendors',
      '/api/v1/purchase-orders',
      '/api/v1/goods-receipts',
      '/api/v1/dashboard',
    ],
  });
});

// ─── Error Handling ─────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express application configured', { nodeEnv: env.NODE_ENV });

export default app;
