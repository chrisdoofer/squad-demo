import { Template, Deployment, DeploymentRequest } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function requestText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.text();
}

export async function getTemplates(filters?: {
  category?: string;
  search?: string;
}): Promise<Template[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return request<Template[]>(`${API_BASE}/templates${qs ? `?${qs}` : ''}`);
}

export async function getTemplate(id: string): Promise<Template> {
  return request<Template>(`${API_BASE}/templates/${id}`);
}

export async function getTemplateBicep(id: string): Promise<string> {
  return requestText(`${API_BASE}/templates/${id}/bicep`);
}

export async function getTemplateWorkflow(id: string): Promise<string> {
  return requestText(`${API_BASE}/templates/${id}/workflow`);
}

export async function createDeployment(req: DeploymentRequest): Promise<Deployment> {
  const endpoint = req.target === 'azure' ? 'azure' : 'github';
  return request<Deployment>(`${API_BASE}/deploy/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}

export async function getDeployments(): Promise<Deployment[]> {
  return request<Deployment[]>(`${API_BASE}/deployments`);
}

export async function getDeployment(id: string): Promise<Deployment> {
  return request<Deployment>(`${API_BASE}/deployments/${id}`);
}
