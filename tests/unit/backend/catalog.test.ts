import {
  getAllTemplates,
  getTemplateById,
  searchTemplates,
  filterByCategory,
} from '../../../src/backend/src/services/catalog';

describe('Catalog Service', () => {
  describe('getAllTemplates', () => {
    it('returns all 6 templates', async () => {
      const templates = await getAllTemplates();
      expect(templates).toHaveLength(6);
    });

    it('returns an array of templates', async () => {
      const templates = await getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('getTemplateById', () => {
    it('returns the correct template for a known id', async () => {
      const template = await getTemplateById('basic-web-app');
      expect(template).toBeDefined();
      expect(template!.id).toBe('basic-web-app');
      expect(template!.name).toBe('Basic Web App');
    });

    it('returns undefined for an unknown id', async () => {
      const template = await getTemplateById('does-not-exist');
      expect(template).toBeUndefined();
    });

    it('returns each template with required fields', async () => {
      const templates = await getAllTemplates();
      for (const t of templates) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('bicepPath');
        expect(t).toHaveProperty('parameters');
        expect(typeof t.id).toBe('string');
        expect(typeof t.name).toBe('string');
        expect(typeof t.bicepPath).toBe('string');
        expect(Array.isArray(t.parameters)).toBe(true);
      }
    });
  });

  describe('searchTemplates', () => {
    it('finds templates by name keyword', async () => {
      const results = await searchTemplates('serverless');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((t) => t.id === 'serverless-api')).toBe(true);
    });

    it('finds templates by description keyword', async () => {
      const results = await searchTemplates('kubernetes');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((t) => t.id === 'aks-microservices')).toBe(true);
    });

    it('returns empty array for no matches', async () => {
      const results = await searchTemplates('zzz-no-match-zzz');
      expect(results).toHaveLength(0);
    });
  });

  describe('filterByCategory', () => {
    it('filters templates by category (case-insensitive)', async () => {
      const results = await filterByCategory('web');
      expect(results.length).toBeGreaterThanOrEqual(1);
      results.forEach((t) => {
        expect(t.category.toLowerCase()).toBe('web');
      });
    });

    it('returns empty array for unknown category', async () => {
      const results = await filterByCategory('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('filterByCategory("Web") returns 3 templates', async () => {
      const results = await filterByCategory('Web');
      expect(results).toHaveLength(3);
      const ids = results.map((t) => t.id).sort();
      expect(ids).toEqual(['baseline-web-app', 'basic-web-app', 'static-web-app']);
    });

    it('filterByCategory("Containers") returns 1 template', async () => {
      const results = await filterByCategory('Containers');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('aks-microservices');
    });

    it('filterByCategory("NonExistent") returns empty array', async () => {
      const results = await filterByCategory('NonExistent');
      expect(results).toHaveLength(0);
    });
  });
});
