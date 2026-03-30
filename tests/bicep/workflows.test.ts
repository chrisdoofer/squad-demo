import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const TEMPLATE_IDS = [
  'basic-web-app',
  'baseline-web-app',
  'aks-microservices',
  'serverless-api',
  'static-web-app',
  'hub-spoke-network',
];

describe('Workflow YAML Validation', () => {
  for (const templateId of TEMPLATE_IDS) {
    const workflowPath = path.join(
      PROJECT_ROOT,
      'templates',
      'workflows',
      templateId,
      'deploy.yml',
    );

    describe(`templates/workflows/${templateId}/deploy.yml`, () => {
      let content: string;
      let parsed: Record<string, unknown>;

      beforeAll(() => {
        content = fs.readFileSync(workflowPath, 'utf-8');
        parsed = yaml.load(content) as Record<string, unknown>;
      });

      it('file exists and is non-empty', () => {
        expect(fs.existsSync(workflowPath)).toBe(true);
        const stat = fs.statSync(workflowPath);
        expect(stat.size).toBeGreaterThan(0);
      });

      it('is valid YAML', () => {
        expect(() => yaml.load(content)).not.toThrow();
        expect(parsed).toBeDefined();
        expect(typeof parsed).toBe('object');
      });

      it('has a "name" field', () => {
        expect(parsed).toHaveProperty('name');
        expect(typeof parsed['name']).toBe('string');
      });

      it('has "on" field with workflow_dispatch', () => {
        expect(parsed).toHaveProperty('on');
        const onField = parsed['on'] as Record<string, unknown>;
        expect(onField).toHaveProperty('workflow_dispatch');
      });

      it('has permissions with id-token: write', () => {
        expect(parsed).toHaveProperty('permissions');
        const perms = parsed['permissions'] as Record<string, unknown>;
        expect(perms['id-token']).toBe('write');
      });

      it('has at least one job', () => {
        expect(parsed).toHaveProperty('jobs');
        const jobs = parsed['jobs'] as Record<string, unknown>;
        expect(Object.keys(jobs).length).toBeGreaterThanOrEqual(1);
      });

      it('references the correct Bicep template path', () => {
        const expectedBicepRef = `templates/bicep/${templateId}/main.bicep`;
        // Search the raw YAML content for the bicep path reference
        expect(content).toContain(expectedBicepRef);
      });
    });
  }
});
