import http from 'node:http';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config.js';
import './server/db/database.js';
import { createRateLimiter } from './server/middleware/auth.js';
import { authRouter } from './server/routes/auth.js';
import { confessionsRouter } from './server/routes/confessions.js';
import { privateRouter } from './server/routes/private.js';
import { createCommunityRouter } from './server/routes/community.js';
import { helplinesRouter } from './server/routes/helplines.js';
import { musicRouter } from './server/routes/music.js';
import { spiritualRouter } from './server/routes/spiritual.js';
import { moderationRouter } from './server/routes/moderation.js';
import { growthRouter } from './server/routes/growth.js';
import { companionRouter } from './server/routes/companion.js';
import { setupStrangerChatWebSocket } from './server/ws/strangerChat.js';

const app = express();

app.set('trust proxy', 1);

// Security headers tuned for PWA + iframe preview compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

// Strict CORS when ALLOWED_ORIGIN is explicitly configured in production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.length > 0) {
    if (config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-heali-token,x-heali-pin-token');
    } else if (req.path.startsWith('/api/')) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Bounded body parser — never log request bodies to protect user privacy
app.use(express.json({ limit: '512kb' }));

// Global rate limit for write endpoints
const writeLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 90,
  keyPrefix: 'api_write',
});

app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    writeLimiter(req, res, next);
    return;
  }
  next();
});

let wsStatsGetter = () => 0;

app.use('/api/auth', authRouter);
app.use('/api/confessions', confessionsRouter);
app.use('/api/private', privateRouter);
app.use('/api', createCommunityRouter(() => wsStatsGetter()));
app.use('/api/helplines', helplinesRouter);
app.use('/api/music', musicRouter);
app.use('/api/spiritual', spiritualRouter);
app.use('/api/admin', moderationRouter);
app.use('/api/companion', companionRouter);
app.use('/api', growthRouter);

// Health endpoint for deployment checks (zero PII)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'heali', paidSpiritualEnabled: config.featurePaidSpiritual });
});

async function startServer() {
  const httpServer = http.createServer(app);
  const wsHub = setupStrangerChatWebSocket(httpServer);
  wsStatsGetter = wsHub.getActiveCount;

  if (!config.isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`[Heali Server] listening on http://0.0.0.0:${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Heali server:', err);
  process.exit(1);
});
