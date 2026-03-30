import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { templateRoutes } from './routes/templates';
import { deployRoutes } from './routes/deploy';
import { deploymentRoutes } from './routes/deployments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/templates', templateRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/deployments', deploymentRoutes);

app.listen(PORT, () => {
  console.log(`IDP Backend running on port ${PORT}`);
});

export default app;
