import { Router, Request, Response } from 'express';
import { deployToAzure } from '../services/azure';
import { deployToGitHub } from '../services/github';
import { DeploymentRequest } from '../types';

const router = Router();

/**
 * POST /api/deploy/azure — Submit an Azure ARM deployment.
 */
router.post('/azure', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;

    if (!request.templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }
    if (!request.parameters || typeof request.parameters !== 'object') {
      return res.status(400).json({ error: 'parameters object is required' });
    }

    const deployment = await deployToAzure({ ...request, target: 'azure' });
    const statusCode = deployment.status === 'failed' ? 502 : 201;
    res.status(statusCode).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Azure deployment failed';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/deploy/github — Scaffold a GitHub repo with template files.
 */
router.post('/github', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;

    if (!request.templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }
    if (!request.githubConfig?.owner || !request.githubConfig?.repo) {
      return res.status(400).json({ error: 'githubConfig.owner and githubConfig.repo are required' });
    }

    const deployment = await deployToGitHub({ ...request, target: 'github' });
    const statusCode = deployment.status === 'failed' ? 502 : 201;
    res.status(statusCode).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub deployment failed';
    res.status(500).json({ error: message });
  }
});

export { router as deployRoutes };
