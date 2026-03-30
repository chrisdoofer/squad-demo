import { Router, Request, Response } from 'express';
import {
  getAllTemplates,
  getTemplateById,
  searchTemplates,
  filterByCategory,
  getBicepContent,
  getWorkflowContent,
} from '../services/catalog';

const router = Router();

/**
 * GET /api/templates
 * Optional query params: ?category=Web&search=serverless
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let templates;
    if (typeof search === 'string' && search.trim()) {
      templates = await searchTemplates(search.trim());
    } else if (typeof category === 'string' && category.trim()) {
      templates = await filterByCategory(category.trim());
    } else {
      templates = await getAllTemplates();
    }

    res.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    res.status(500).json({ error: 'Failed to fetch templates', message, statusCode: 500 });
  }
});

/** GET /api/templates/:id — Full template details. */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: 'Template not found', statusCode: 404 });
    }
    res.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    res.status(500).json({ error: 'Failed to fetch template', message, statusCode: 500 });
  }
});

/** GET /api/templates/:id/bicep — Raw Bicep template content. */
router.get('/:id/bicep', async (req: Request, res: Response) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: 'Template not found', statusCode: 404 });
    }
    const content = await getBicepContent(template);
    res.type('text/plain').send(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read Bicep template';
    res.status(500).json({ error: 'Failed to read Bicep template', message, statusCode: 500 });
  }
});

/** GET /api/templates/:id/workflow — Raw workflow YAML content. */
router.get('/:id/workflow', async (req: Request, res: Response) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Not Found', message: 'Template not found', statusCode: 404 });
    }
    const content = await getWorkflowContent(template);
    res.type('text/yaml').send(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read workflow';
    res.status(500).json({ error: 'Failed to read workflow', message, statusCode: 500 });
  }
});

export { router as templateRoutes };
