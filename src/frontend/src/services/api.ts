import { Template, Deployment, DeploymentRequest } from '../types';

const API_BASE = '/api';

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function getTemplate(id: string): Promise<Template> {
  const res = await fetch(`${API_BASE}/templates/${id}`);
  if (!res.ok) throw new Error('Failed to fetch template');
  return res.json();
}

export async function createDeployment(request: DeploymentRequest): Promise<Deployment> {
  const endpoint = request.target === 'azure' ? 'azure' : 'github';
  const res = await fetch(`${API_BASE}/deploy/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to create deployment');
  return res.json();
}

export async function getDeployments(): Promise<Deployment[]> {
  const res = await fetch(`${API_BASE}/deployments`);
  if (!res.ok) throw new Error('Failed to fetch deployments');
  return res.json();
}

export async function getDeployment(id: string): Promise<Deployment> {
  const res = await fetch(`${API_BASE}/deployments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch deployment');
  return res.json();
}
