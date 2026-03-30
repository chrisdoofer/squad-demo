import { Router, Request, Response } from 'express';
import { deployToAzure } from '../services/azure';
import { deployToGitHub } from '../services/github';
import { DeploymentRequest } from '../types';

const router = Router();

router.post('/azure', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;
    const deployment = await deployToAzure(request);
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'Azure deployment failed' });
  }
});

router.post('/github', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;
    const deployment = await deployToGitHub(request);
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: 'GitHub deployment failed' });
  }
});

export { router as deployRoutes };
