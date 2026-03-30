import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTemplates, getTemplate, createDeployment, getDeployments } from '../services/api';
import type { Template, Deployment, DeploymentRequest } from '../types';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

const sampleTemplate: Template = {
  id: 'basic-web-app',
  name: 'Basic Web App',
  description: 'A basic web app',
  category: 'Web',
  complexity: 'beginner',
  sourceUrl: 'https://example.com',
  services: ['App Service'],
  bicepPath: 'templates/bicep/basic-web-app/main.bicep',
  workflowPath: 'templates/workflows/basic-web-app/deploy.yml',
  parameters: [],
};

const sampleDeployment: Deployment = {
  id: 'deploy-1',
  templateId: 'basic-web-app',
  target: 'azure',
  status: 'succeeded',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:01:00Z',
  parameters: { appName: 'myapp' },
};

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTemplates', () => {
    it('calls /api/templates', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleTemplate]));

      const result = await getTemplates();
      expect(mockFetch).toHaveBeenCalledWith('/api/templates', undefined);
      expect(result).toEqual([sampleTemplate]);
    });

    it('passes category filter as query param', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleTemplate]));

      await getTemplates({ category: 'Web' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates?category=Web',
        undefined,
      );
    });

    it('passes search filter as query param', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleTemplate]));

      await getTemplates({ search: 'serverless' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates?search=serverless',
        undefined,
      );
    });
  });

  describe('getTemplate', () => {
    it('calls /api/templates/:id', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleTemplate));

      const result = await getTemplate('basic-web-app');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/basic-web-app',
        undefined,
      );
      expect(result).toEqual(sampleTemplate);
    });
  });

  describe('createDeployment', () => {
    it('sends POST to /api/deploy/azure for azure target', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleDeployment));

      const req: DeploymentRequest = {
        templateId: 'basic-web-app',
        target: 'azure',
        parameters: { appName: 'myapp' },
      };

      const result = await createDeployment(req);
      expect(mockFetch).toHaveBeenCalledWith('/api/deploy/azure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      expect(result).toEqual(sampleDeployment);
    });

    it('sends POST to /api/deploy/github for github target', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleDeployment));

      const req: DeploymentRequest = {
        templateId: 'basic-web-app',
        target: 'github',
        parameters: {},
        githubConfig: { owner: 'org', repo: 'repo' },
      };

      await createDeployment(req);
      expect(mockFetch).toHaveBeenCalledWith('/api/deploy/github', expect.any(Object));
    });
  });

  describe('getDeployments', () => {
    it('calls /api/deployments', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleDeployment]));

      const result = await getDeployments();
      expect(mockFetch).toHaveBeenCalledWith('/api/deployments', undefined);
      expect(result).toEqual([sampleDeployment]);
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(getTemplates()).rejects.toThrow('Internal Server Error');
    });

    it('throws generic message when body cannot be read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      });

      await expect(getTemplate('bad-id')).rejects.toThrow('Request failed: 404');
    });
  });
});
