import { Router, Request, Response } from 'express';
import { deployToAzure, validateAzureDeployment } from '../services/azure';
import { deployToGitHub } from '../services/github';
import { getTemplateById } from '../services/catalog';
import { DeploymentRequest } from '../types';
import { requireGitHubToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/deploy/azure — Submit an Azure ARM deployment.
 */
router.post('/azure', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;

    if (!request.templateId) {
      return res.status(400).json({ error: 'Bad Request', message: 'templateId is required', statusCode: 400 });
    }
    if (!request.parameters || typeof request.parameters !== 'object') {
      return res.status(400).json({ error: 'Bad Request', message: 'parameters object is required', statusCode: 400 });
    }

    const template = await getTemplateById(request.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: `Template "${request.templateId}" not found`, statusCode: 404 });
    }

    // Validate required parameters
    const missing = template.parameters
      .filter((p) => p.required && !(p.name in request.parameters))
      .map((p) => p.name);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required parameters: ${missing.join(', ')}`,
        statusCode: 400,
      });
    }

    const deployment = await deployToAzure({ ...request, target: 'azure' });
    const statusCode = deployment.status === 'failed' ? 502 : 201;
    res.status(statusCode).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Azure deployment failed';
    res.status(500).json({ error: 'Internal Server Error', message, statusCode: 500 });
  }
});

/**
 * POST /api/deploy/github — Scaffold a GitHub repo with template files.
 * Requires a GitHub token in the Authorization header.
 */
router.post('/github', requireGitHubToken, async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;

    if (!request.templateId) {
      return res.status(400).json({ error: 'Bad Request', message: 'templateId is required', statusCode: 400 });
    }
    if (!request.githubConfig?.owner || !request.githubConfig?.repo) {
      return res.status(400).json({ error: 'Bad Request', message: 'githubConfig.owner and githubConfig.repo are required', statusCode: 400 });
    }

    const template = await getTemplateById(request.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: `Template "${request.templateId}" not found`, statusCode: 404 });
    }

    const deployment = await deployToGitHub({ ...request, target: 'github' });
    const statusCode = deployment.status === 'failed' ? 502 : 201;
    res.status(statusCode).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub deployment failed';
    res.status(500).json({ error: 'Internal Server Error', message, statusCode: 500 });
  }
});

/**
 * POST /api/deploy/validate — Validate an Azure deployment without executing.
 * Runs a what-if preview and returns the results.
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const request: DeploymentRequest = req.body;

    if (!request.templateId) {
      return res.status(400).json({ error: 'Bad Request', message: 'templateId is required', statusCode: 400 });
    }

    const template = await getTemplateById(request.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: `Template "${request.templateId}" not found`, statusCode: 404 });
    }

    const result = await validateAzureDeployment(request);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    res.status(500).json({ error: 'Internal Server Error', message, statusCode: 500 });
  }
});

export { router as deployRoutes };
