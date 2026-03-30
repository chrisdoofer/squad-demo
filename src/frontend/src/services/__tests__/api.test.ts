import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTemplates,
  getTemplate,
  getTemplateBicep,
  getTemplateWorkflow,
  createDeployment,
  getDeployments,
  getDeployment,
} from '../api';
import type { Template, Deployment, DeploymentRequest } from '../../types';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

function textResponse(text: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
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
    it('calls correct endpoint without filters', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleTemplate]));
      const result = await getTemplates();
      expect(mockFetch).toHaveBeenCalledWith('/api/templates', undefined);
      expect(result).toEqual([sampleTemplate]);
    });

    it('adds category query param', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleTemplate]));
      await getTemplates({ category: 'Web' });
      expect(mockFetch).toHaveBeenCalledWith('/api/templates?category=Web', undefined);
    });

    it('adds search query param', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await getTemplates({ search: 'serverless' });
      expect(mockFetch).toHaveBeenCalledWith('/api/templates?search=serverless', undefined);
    });

    it('adds both category and search params', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      await getTemplates({ category: 'AI', search: 'bot' });
      expect(mockFetch).toHaveBeenCalledWith('/api/templates?category=AI&search=bot', undefined);
    });
  });

  describe('getTemplate', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleTemplate));
      const result = await getTemplate('basic-web-app');
      expect(mockFetch).toHaveBeenCalledWith('/api/templates/basic-web-app', undefined);
      expect(result).toEqual(sampleTemplate);
    });
  });

  describe('getTemplateBicep', () => {
    it('returns string content', async () => {
      const bicepContent = 'resource appPlan {}';
      mockFetch.mockResolvedValueOnce(textResponse(bicepContent));
      const result = await getTemplateBicep('basic-web-app');
      expect(mockFetch).toHaveBeenCalledWith('/api/templates/basic-web-app/bicep');
      expect(result).toBe(bicepContent);
    });
  });

  describe('getTemplateWorkflow', () => {
    it('returns string content', async () => {
      const workflowContent = 'name: deploy\non: push';
      mockFetch.mockResolvedValueOnce(textResponse(workflowContent));
      const result = await getTemplateWorkflow('basic-web-app');
      expect(mockFetch).toHaveBeenCalledWith('/api/templates/basic-web-app/workflow');
      expect(result).toBe(workflowContent);
    });
  });

  describe('createDeployment', () => {
    it('sends POST to /api/deploy/azure for azure target', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleDeployment));
      const req: DeploymentRequest = {
        templateId: 'basic-web-app',
        target: 'azure',
        parameters: { appName: 'myapp' },
        azureConfig: { subscriptionId: 'sub-1', resourceGroup: 'rg-1', location: 'eastus' },
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
      expect(mockFetch).toHaveBeenCalledWith('/api/deploy/github', expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('getDeployments', () => {
    it('calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([sampleDeployment]));
      const result = await getDeployments();
      expect(mockFetch).toHaveBeenCalledWith('/api/deployments', undefined);
      expect(result).toEqual([sampleDeployment]);
    });
  });

  describe('getDeployment', () => {
    it('calls correct endpoint with id', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(sampleDeployment));
      const result = await getDeployment('deploy-1');
      expect(mockFetch).toHaveBeenCalledWith('/api/deployments/deploy-1', undefined);
      expect(result).toEqual(sampleDeployment);
    });
  });

  describe('error handling', () => {
    it('throws on 500 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });
      await expect(getTemplates()).rejects.toThrow('Internal Server Error');
    });

    it('throws on 404 with generic message when body is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      });
      await expect(getTemplate('bad-id')).rejects.toThrow('Request failed: 404');
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(getTemplates()).rejects.toThrow('Failed to fetch');
    });
  });
});
