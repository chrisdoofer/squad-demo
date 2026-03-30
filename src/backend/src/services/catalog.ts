import * as fs from 'fs';
import * as path from 'path';
import { Template } from '../types';

interface TemplateCatalog {
  templates: Template[];
}

const CATALOG_PATH = path.resolve(__dirname, '../../../catalog/templates.json');

let cachedCatalog: TemplateCatalog | null = null;

function loadCatalog(): TemplateCatalog {
  if (cachedCatalog) return cachedCatalog;
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  cachedCatalog = JSON.parse(raw) as TemplateCatalog;
  return cachedCatalog;
}

export async function getAllTemplates(): Promise<Template[]> {
  const catalog = loadCatalog();
  return catalog.templates;
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const catalog = loadCatalog();
  return catalog.templates.find((t) => t.id === id);
}
