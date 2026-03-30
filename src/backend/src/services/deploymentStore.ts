import { Deployment } from '../types';

/**
 * In-memory deployment store.
 * Provides CRUD operations for Deployment records.
 * Swap this out for a database-backed implementation later.
 */
const store = new Map<string, Deployment>();

/**
 * Persist a new deployment record.
 * Overwrites any existing record with the same ID.
 */
export function saveDeployment(deployment: Deployment): void {
  store.set(deployment.id, { ...deployment });
  console.log(`[deploymentStore] saved deployment ${deployment.id} (status=${deployment.status})`);
}

/**
 * Retrieve a single deployment by ID.
 * @returns The deployment, or undefined if not found.
 */
export function getDeployment(id: string): Deployment | undefined {
  const d = store.get(id);
  return d ? { ...d } : undefined;
}

/**
 * Return every deployment in the store, newest first.
 */
export function getAllDeployments(): Deployment[] {
  return Array.from(store.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Update the status (and optional result / error) of an existing deployment.
 * Also bumps the `updatedAt` timestamp.
 *
 * @returns The updated deployment, or undefined if the ID was not found.
 */
export function updateDeploymentStatus(
  id: string,
  status: Deployment['status'],
  extra?: { result?: Record<string, unknown>; error?: string },
): Deployment | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;

  const updated: Deployment = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
    ...(extra?.result !== undefined ? { result: extra.result } : {}),
    ...(extra?.error !== undefined ? { error: extra.error } : {}),
  };

  store.set(id, updated);
  console.log(`[deploymentStore] updated deployment ${id} → ${status}`);
  return { ...updated };
}

/** Delete a deployment record. Returns true if it existed. */
export function deleteDeployment(id: string): boolean {
  const existed = store.delete(id);
  if (existed) {
    console.log(`[deploymentStore] deleted deployment ${id}`);
  }
  return existed;
}
