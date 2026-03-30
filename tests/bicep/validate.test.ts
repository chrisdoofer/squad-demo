import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const TEMPLATE_IDS = [
  'basic-web-app',
  'baseline-web-app',
  'aks-microservices',
  'serverless-api',
  'static-web-app',
  'hub-spoke-network',
];

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

describe('Bicep Template Validation', () => {
  for (const templateId of TEMPLATE_IDS) {
    const bicepPath = path.join(PROJECT_ROOT, 'templates', 'bicep', templateId, 'main.bicep');

    describe(`templates/bicep/${templateId}/main.bicep`, () => {
      it('file exists', () => {
        expect(fs.existsSync(bicepPath)).toBe(true);
      });

      it('file is non-empty', () => {
        const stat = fs.statSync(bicepPath);
        expect(stat.size).toBeGreaterThan(0);
      });

      describeOrSkip('az bicep build', () => {
        let armJson: Record<string, unknown>;

        beforeAll(() => {
          const stdout = execSync(`az bicep build --file "${bicepPath}" --stdout`, {
            encoding: 'utf-8',
            timeout: 120_000,
          });
          armJson = JSON.parse(stdout) as Record<string, unknown>;
        });

        it('compiles successfully (exit code 0)', () => {
          expect(armJson).toBeDefined();
        });

        it('has a $schema property', () => {
          expect(armJson).toHaveProperty('$schema');
          expect(typeof armJson['$schema']).toBe('string');
        });

        it('has contentVersion "1.0.0.0"', () => {
          expect(armJson).toHaveProperty('contentVersion', '1.0.0.0');
        });

        it('has parameters section', () => {
          expect(armJson).toHaveProperty('parameters');
          expect(typeof armJson['parameters']).toBe('object');
        });

        it('has resources section', () => {
          expect(armJson).toHaveProperty('resources');
        });
      });
    });
  }
});
