import * as fs from 'fs';
import * as path from 'path';
import { Template, TemplateCatalog } from '../types';

/** Root of the monorepo — catalog and template paths are relative to this. */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const CATALOG_PATH = path.join(PROJECT_ROOT, 'catalog', 'templates.json');

let cachedCatalog: TemplateCatalog | null = null;

function loadCatalog(): TemplateCatalog {
  if (cachedCatalog) return cachedCatalog;
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  cachedCatalog = JSON.parse(raw) as TemplateCatalog;
  return cachedCatalog;
}

/** Return all templates in the catalog. */
export async function getAllTemplates(): Promise<Template[]> {
  return loadCatalog().templates;
}

/** Find a single template by ID. */
export async function getTemplateById(id: string): Promise<Template | undefined> {
  return loadCatalog().templates.find((t) => t.id === id);
}

/** Full-text search across template name, description, and services. */
export async function searchTemplates(query: string): Promise<Template[]> {
  const q = query.toLowerCase();
  return loadCatalog().templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.services.some((s) => s.toLowerCase().includes(q)),
  );
}

/** Filter templates by category (case-insensitive). */
export async function filterByCategory(category: string): Promise<Template[]> {
  const cat = category.toLowerCase();
  return loadCatalog().templates.filter(
    (t) => t.category.toLowerCase() === cat,
  );
}

/** Read the raw Bicep template content from disk. */
export async function getBicepContent(template: Template): Promise<string> {
  const absPath = path.join(PROJECT_ROOT, template.bicepPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Bicep file not found: ${template.bicepPath}`);
  }
  return fs.readFileSync(absPath, 'utf-8');
}

/** Read the raw workflow YAML content from disk. */
export async function getWorkflowContent(template: Template): Promise<string> {
  const absPath = path.join(PROJECT_ROOT, template.workflowPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Workflow file not found: ${template.workflowPath}`);
  }
  return fs.readFileSync(absPath, 'utf-8');
}
