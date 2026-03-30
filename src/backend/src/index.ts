import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './middleware/auth';
import { templateRoutes } from './routes/templates';
import { deployRoutes } from './routes/deploy';
import { deploymentRoutes } from './routes/deployments';
import { ApiError } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply auth middleware to all API routes below
app.use('/api', authMiddleware);

// Routes
app.use('/api/templates', templateRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/deployments', deploymentRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found', statusCode: 404 });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[error] Unhandled error: ${err.message}`);
  const body: ApiError = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    statusCode: 500,
  };
  res.status(500).json(body);
});

app.listen(PORT, () => {
  console.log(`IDP Backend running on port ${PORT}`);
});

export default app;
