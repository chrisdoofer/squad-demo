import { Router, Request, Response } from 'express';
import { getAllTemplates, getTemplateById } from '../services/catalog';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

export { router as templateRoutes };
