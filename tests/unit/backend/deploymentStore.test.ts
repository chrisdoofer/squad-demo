import {
  saveDeployment,
  getDeployment,
  getAllDeployments,
  updateDeploymentStatus,
  deleteDeployment,
} from '../../../src/backend/src/services/deploymentStore';
import { Deployment } from '../../../src/backend/src/types';

function makeDeployment(overrides: Partial<Deployment> = {}): Deployment {
  return {
    id: 'test-id-1',
    templateId: 'basic-web-app',
    target: 'azure',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: { appName: 'myapp' },
    ...overrides,
  };
}

describe('DeploymentStore', () => {
  beforeEach(() => {
    // Clear the store by deleting any known test deployments
    for (const d of getAllDeployments()) {
      deleteDeployment(d.id);
    }
  });

  describe('saveDeployment / getDeployment', () => {
    it('stores and retrieves a deployment', () => {
      const deployment = makeDeployment({ id: 'save-retrieve-1' });
      saveDeployment(deployment);

      const retrieved = getDeployment('save-retrieve-1');
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('save-retrieve-1');
      expect(retrieved!.templateId).toBe('basic-web-app');
      expect(retrieved!.status).toBe('pending');
    });

    it('returns a copy, not the original reference', () => {
      const deployment = makeDeployment({ id: 'copy-test' });
      saveDeployment(deployment);

      const a = getDeployment('copy-test');
      const b = getDeployment('copy-test');
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('getAllDeployments', () => {
    it('returns all saved deployments', () => {
      saveDeployment(makeDeployment({ id: 'all-1', createdAt: '2024-01-01T00:00:00Z' }));
      saveDeployment(makeDeployment({ id: 'all-2', createdAt: '2024-01-02T00:00:00Z' }));
      saveDeployment(makeDeployment({ id: 'all-3', createdAt: '2024-01-03T00:00:00Z' }));

      const all = getAllDeployments();
      expect(all).toHaveLength(3);
    });

    it('returns deployments sorted newest first', () => {
      saveDeployment(makeDeployment({ id: 'old', createdAt: '2024-01-01T00:00:00Z' }));
      saveDeployment(makeDeployment({ id: 'new', createdAt: '2024-06-01T00:00:00Z' }));

      const all = getAllDeployments();
      expect(all[0].id).toBe('new');
      expect(all[1].id).toBe('old');
    });

    it('returns empty array when no deployments exist', () => {
      const all = getAllDeployments();
      expect(all).toEqual([]);
    });
  });

  describe('updateDeploymentStatus', () => {
    it('changes the status of an existing deployment', () => {
      saveDeployment(makeDeployment({ id: 'update-1' }));

      const updated = updateDeploymentStatus('update-1', 'in_progress');
      expect(updated).toBeDefined();
      expect(updated!.status).toBe('in_progress');
    });

    it('updates the updatedAt timestamp', () => {
      const original = makeDeployment({ id: 'update-ts', updatedAt: '2024-01-01T00:00:00Z' });
      saveDeployment(original);

      const updated = updateDeploymentStatus('update-ts', 'succeeded');
      expect(updated!.updatedAt).not.toBe('2024-01-01T00:00:00Z');
    });

    it('attaches result when provided', () => {
      saveDeployment(makeDeployment({ id: 'update-result' }));

      const updated = updateDeploymentStatus('update-result', 'succeeded', {
        result: { provisioningState: 'Succeeded' },
      });
      expect(updated!.result).toEqual({ provisioningState: 'Succeeded' });
    });

    it('attaches error when provided', () => {
      saveDeployment(makeDeployment({ id: 'update-error' }));

      const updated = updateDeploymentStatus('update-error', 'failed', {
        error: 'Something went wrong',
      });
      expect(updated!.error).toBe('Something went wrong');
    });

    it('returns undefined for unknown id', () => {
      const updated = updateDeploymentStatus('nonexistent', 'failed');
      expect(updated).toBeUndefined();
    });
  });

  describe('getDeployment', () => {
    it('returns undefined for unknown id', () => {
      const result = getDeployment('does-not-exist');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteDeployment', () => {
    it('deletes an existing deployment', () => {
      saveDeployment(makeDeployment({ id: 'delete-me' }));
      expect(deleteDeployment('delete-me')).toBe(true);
      expect(getDeployment('delete-me')).toBeUndefined();
    });

    it('returns false for unknown id', () => {
      expect(deleteDeployment('nonexistent')).toBe(false);
    });
  });
});
