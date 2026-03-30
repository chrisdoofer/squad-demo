import { Router, Request, Response } from 'express';
import { getAllDeployments, getDeployment } from '../services/deploymentStore';

const router = Router();

/**
 * GET /api/deployments — List all deployments, newest first.
 */
router.get('/', (_req: Request, res: Response) => {
  const deployments = getAllDeployments();
  res.json(deployments);
});

/**
 * GET /api/deployments/:id — Get a single deployment by ID.
 */
router.get('/:id', (req: Request, res: Response) => {
  const deployment = getDeployment(req.params.id);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(deployment);
});

export { router as deploymentRoutes };
