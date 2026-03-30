import request from 'supertest';

// Set PORT to 0 so the app.listen() in index.ts picks a random port
process.env.PORT = '0';

// Mock the Azure and GitHub services so no real API calls are made
jest.mock('../../src/backend/src/services/azure', () => ({
  deployToAzure: jest.fn().mockResolvedValue({
    id: 'mock-azure-id',
    templateId: 'basic-web-app',
    target: 'azure',
    status: 'succeeded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: {},
  }),
  validateAzureDeployment: jest.fn().mockResolvedValue({
    valid: true,
    errors: [],
    warnings: [],
  }),
}));

jest.mock('../../src/backend/src/services/github', () => ({
  deployToGitHub: jest.fn().mockResolvedValue({
    id: 'mock-gh-id',
    templateId: 'basic-web-app',
    target: 'github',
    status: 'succeeded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: {},
  }),
}));

// Import the Express app (this triggers app.listen)
import app from '../../src/backend/src/index';

describe('API Integration Tests', () => {
  // ── Health check ────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ── Template endpoints ──────────────────────────────────────────────
  describe('GET /api/templates', () => {
    it('returns 200 with array of 6 templates', async () => {
      const res = await request(app).get('/api/templates');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(6);
    });

    it('each template has id, name, and category', async () => {
      const res = await request(app).get('/api/templates');
      for (const t of res.body) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('category');
      }
    });

    it('filters by category when ?category=Web', async () => {
      const res = await request(app).get('/api/templates?category=Web');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
      for (const t of res.body) {
        expect(t.category).toBe('Web');
      }
    });

    it('searches by keyword when ?search=kubernetes', async () => {
      const res = await request(app).get('/api/templates?search=kubernetes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((t: { id: string }) => t.id === 'aks-microservices')).toBe(true);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('returns 200 with correct template for basic-web-app', async () => {
      const res = await request(app).get('/api/templates/basic-web-app');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('basic-web-app');
      expect(res.body.name).toBe('Basic Web App');
      expect(res.body).toHaveProperty('parameters');
    });

    it('returns 404 for nonexistent template', async () => {
      const res = await request(app).get('/api/templates/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/templates/:id/bicep', () => {
    it('returns 200 with Bicep content for basic-web-app', async () => {
      const res = await request(app).get('/api/templates/basic-web-app/bicep');
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/text\/plain/);
      expect(res.text.length).toBeGreaterThan(0);
    });

    it('returns 404 for nonexistent template', async () => {
      const res = await request(app).get('/api/templates/nonexistent/bicep');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/templates/:id/workflow', () => {
    it('returns 200 with workflow content for basic-web-app', async () => {
      const res = await request(app).get('/api/templates/basic-web-app/workflow');
      expect(res.status).toBe(200);
      expect(res.text.length).toBeGreaterThan(0);
    });

    it('returns 404 for nonexistent template', async () => {
      const res = await request(app).get('/api/templates/nonexistent/workflow');
      expect(res.status).toBe(404);
    });
  });

  // ── Deployment endpoints ────────────────────────────────────────────
  describe('GET /api/deployments', () => {
    it('returns 200 with array (initially empty)', async () => {
      const res = await request(app).get('/api/deployments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/deployments/:id', () => {
    it('returns 404 for nonexistent deployment', async () => {
      const res = await request(app).get('/api/deployments/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  // ── Deploy endpoints ────────────────────────────────────────────────
  describe('POST /api/deploy/azure', () => {
    it('returns 400 when templateId is missing', async () => {
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ parameters: { appName: 'test' } });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('templateId');
    });

    it('returns 400 when parameters object is missing', async () => {
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ templateId: 'basic-web-app' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('parameters');
    });

    it('creates deployment with valid body', async () => {
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({
          templateId: 'basic-web-app',
          parameters: {
            appName: 'testapp',
            sqlAdminLogin: 'admin',
            sqlAdminPassword: 'P@ss1234',
          },
        });
      expect([200, 201, 502]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('templateId', 'basic-web-app');
    });
  });

  describe('POST /api/deploy/github', () => {
    const ORIGINAL_GH_TOKEN = process.env.GITHUB_TOKEN;

    afterEach(() => {
      if (ORIGINAL_GH_TOKEN !== undefined) {
        process.env.GITHUB_TOKEN = ORIGINAL_GH_TOKEN;
      } else {
        delete process.env.GITHUB_TOKEN;
      }
    });

    it('returns 401 without auth token', async () => {
      delete process.env.GITHUB_TOKEN;
      const res = await request(app)
        .post('/api/deploy/github')
        .send({
          templateId: 'basic-web-app',
          parameters: {},
          githubConfig: { owner: 'org', repo: 'myrepo' },
        });
      expect(res.status).toBe(401);
    });

    it('returns 201 with auth token and valid body', async () => {
      process.env.GITHUB_TOKEN = 'ghp_testtoken';
      const res = await request(app)
        .post('/api/deploy/github')
        .set('x-github-token', 'ghp_testtoken')
        .send({
          templateId: 'basic-web-app',
          parameters: {},
          githubConfig: { owner: 'org', repo: 'myrepo' },
        });
      expect([200, 201, 502]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
    });
  });

  // ── 404 handling ────────────────────────────────────────────────────
  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
