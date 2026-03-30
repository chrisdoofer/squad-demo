import { Router, Request, Response } from 'express';
import { Deployment } from '../types';

const router = Router();

// In-memory store for demo purposes
const deployments: Deployment[] = [];

router.get('/', (_req: Request, res: Response) => {
  res.json(deployments);
});

router.get('/:id', (req: Request, res: Response) => {
  const deployment = deployments.find((d) => d.id === req.params.id);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(deployment);
});

export { router as deploymentRoutes };
