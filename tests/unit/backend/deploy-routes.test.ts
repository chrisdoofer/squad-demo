import express from 'express';
import request from 'supertest';
import { deployRoutes } from '../../../src/backend/src/routes/deploy';

// Mock the Azure and GitHub services so no real API calls are made
jest.mock('../../../src/backend/src/services/azure', () => ({
  deployToAzure: jest.fn().mockResolvedValue({
    id: 'mock-id',
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

jest.mock('../../../src/backend/src/services/github', () => ({
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

// Create a mini Express app with the deploy routes
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/deploy', deployRoutes);
  return app;
}

describe('Deploy Routes', () => {
  const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;

  beforeAll(() => {
    process.env.GITHUB_TOKEN = 'test-github-token';
  });

  afterAll(() => {
    if (ORIGINAL_TOKEN !== undefined) {
      process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
    } else {
      delete process.env.GITHUB_TOKEN;
    }
  });

  describe('POST /api/deploy/azure', () => {
    it('returns 400 without templateId', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ parameters: { appName: 'test' } });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('templateId');
    });

    it('returns 400 without parameters', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ templateId: 'basic-web-app' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('parameters');
    });

    it('returns 400 when parameters is not an object', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ templateId: 'basic-web-app', parameters: 'not-an-object' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('parameters');
    });

    it('returns 404 for unknown template', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({ templateId: 'nonexistent-template', parameters: { foo: 'bar' } });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('returns 400 for missing required parameters', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/azure')
        .send({
          templateId: 'basic-web-app',
          parameters: { appName: 'test' }, // missing sqlAdminLogin, sqlAdminPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Missing required parameters');
    });
  });

  describe('POST /api/deploy/github', () => {
    it('returns 400 without templateId', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/github')
        .set('x-github-token', 'test-token')
        .send({ githubConfig: { owner: 'org', repo: 'repo' } });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('templateId');
    });

    it('returns 400 without githubConfig', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/github')
        .set('x-github-token', 'test-token')
        .send({ templateId: 'basic-web-app', parameters: {} });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('githubConfig');
    });

    it('returns 401 without a GitHub token', async () => {
      // Temporarily remove the token
      const saved = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/github')
        .send({ templateId: 'basic-web-app', parameters: {} });

      expect(res.status).toBe(401);

      process.env.GITHUB_TOKEN = saved;
    });

    it('returns 404 for unknown template', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/deploy/github')
        .set('x-github-token', 'test-token')
        .send({
          templateId: 'nonexistent',
          githubConfig: { owner: 'org', repo: 'repo' },
          parameters: {},
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});
