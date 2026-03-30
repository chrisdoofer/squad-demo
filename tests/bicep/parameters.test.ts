import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

interface CatalogParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string | number | boolean;
}

interface CatalogTemplate {
  id: string;
  name: string;
  bicepPath: string;
  parameters: CatalogParameter[];
}

interface Catalog {
  templates: CatalogTemplate[];
}

/** Check whether `az bicep build` is available on this machine. */
function azBicepAvailable(): boolean {
  try {
    execSync('az bicep version', { stdio: 'pipe', timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

const HAS_AZ = azBicepAvailable();

const describeOrSkip = HAS_AZ ? describe : describe.skip;

describeOrSkip('Bicep Parameter Validation', () => {
  const catalogPath = path.join(PROJECT_ROOT, 'catalog', 'templates.json');
  const catalog: Catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  for (const template of catalog.templates) {
    describe(`${template.id} parameters`, () => {
      let armParameters: Record<string, unknown>;

      beforeAll(() => {
        const bicepPath = path.join(PROJECT_ROOT, template.bicepPath);
        const stdout = execSync(`az bicep build --file "${bicepPath}" --stdout`, {
          encoding: 'utf-8',
          timeout: 120_000,
        });
        const arm = JSON.parse(stdout) as Record<string, unknown>;
        armParameters = arm['parameters'] as Record<string, unknown>;
      });

      it('ARM template has parameters object', () => {
        expect(armParameters).toBeDefined();
        expect(typeof armParameters).toBe('object');
      });

      it('required catalog parameters exist in Bicep ARM output', () => {
        const requiredParams = template.parameters.filter((p) => p.required);
        for (const param of requiredParams) {
          expect(armParameters).toHaveProperty(
            param.name,
          );
        }
      });

      it('all catalog parameters are present in Bicep ARM output', () => {
        for (const param of template.parameters) {
          expect(armParameters).toHaveProperty(
            param.name,
          );
        }
      });
    });
  }
});
