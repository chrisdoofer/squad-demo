import { Router, Request, Response } from 'express';
import { getAllDeployments, getDeployment, deleteDeployment } from '../services/deploymentStore';

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
    return res.status(404).json({ error: 'Not Found', message: 'Deployment not found', statusCode: 404 });
  }
  res.json(deployment);
});

/**
 * DELETE /api/deployments/:id — Cancel/remove a deployment record.
 */
router.delete('/:id', (req: Request, res: Response) => {
  const existed = deleteDeployment(req.params.id);
  if (!existed) {
    return res.status(404).json({ error: 'Not Found', message: 'Deployment not found', statusCode: 404 });
  }
  res.status(204).send();
});

export { router as deploymentRoutes };
