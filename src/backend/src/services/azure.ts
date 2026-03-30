import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { DeploymentRequest, Deployment } from '../types';
import { getTemplateById } from './catalog';
import { saveDeployment, updateDeploymentStatus } from './deploymentStore';
import { v4 as uuidv4 } from 'uuid';

const execFileAsync = promisify(execFile);

/** Validate an Azure deployment without executing (what-if). */
export async function validateAzureDeployment(
  request: DeploymentRequest,
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.templateId) {
    errors.push('templateId is required');
  }

  const template = await getTemplateById(request.templateId);
  if (!template) {
    errors.push(`Template "${request.templateId}" not found in catalog`);
    return { valid: false, errors, warnings };
  }

  const bicepAbsPath = path.join(PROJECT_ROOT, template.bicepPath);
  if (!fs.existsSync(bicepAbsPath)) {
    errors.push(`Bicep template not found at ${template.bicepPath}`);
  }

  const missing = template.parameters
    .filter((p) => p.required && !(p.name in (request.parameters || {})))
    .map((p) => p.name);
  if (missing.length > 0) {
    errors.push(`Missing required parameters: ${missing.join(', ')}`);
  }

  const subscriptionId =
    request.azureConfig?.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
  const resourceGroup =
    request.azureConfig?.resourceGroup || process.env.AZURE_RESOURCE_GROUP;

  if (!subscriptionId) {
    warnings.push('No Azure subscriptionId — set azureConfig.subscriptionId or AZURE_SUBSCRIPTION_ID');
  }
  if (!resourceGroup) {
    warnings.push('No Azure resourceGroup — set azureConfig.resourceGroup or AZURE_RESOURCE_GROUP');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Root of the monorepo — Bicep paths in the catalog are relative to this. */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

/**
 * Deploy infrastructure to Azure using the ARM REST API.
 *
 * Flow:
 *  1. Validate the request & resolve the template from the catalog.
 *  2. Read the Bicep file from disk and build an ARM deployment payload.
 *  3. Submit the deployment via the Azure SDK and poll until complete.
 *  4. Return a {@link Deployment} record reflecting the final status.
 */
export async function deployToAzure(request: DeploymentRequest): Promise<Deployment> {
  const id = uuidv4();
  const now = new Date().toISOString();

  // ── 0. Build the initial deployment record ──────────────────────────
  const deployment: Deployment = {
    id,
    templateId: request.templateId,
    target: 'azure',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    parameters: request.parameters,
  };
  saveDeployment(deployment);

  try {
    // ── 1. Validate inputs ──────────────────────────────────────────
    if (!request.templateId) {
      throw new Error('templateId is required');
    }
    if (request.target !== 'azure') {
      throw new Error(`Invalid target "${request.target}" — expected "azure"`);
    }

    const template = await getTemplateById(request.templateId);
    if (!template) {
      throw new Error(`Template "${request.templateId}" not found in catalog`);
    }

    const subscriptionId =
      request.azureConfig?.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
    const resourceGroup =
      request.azureConfig?.resourceGroup || process.env.AZURE_RESOURCE_GROUP;

    if (!subscriptionId) {
      throw new Error(
        'Azure subscriptionId must be provided in azureConfig or AZURE_SUBSCRIPTION_ID env var',
      );
    }
    if (!resourceGroup) {
      throw new Error(
        'Azure resourceGroup must be provided in azureConfig or AZURE_RESOURCE_GROUP env var',
      );
    }

    // ── 2. Load the Bicep / ARM template from disk ──────────────────
    const bicepAbsPath = path.join(PROJECT_ROOT, template.bicepPath);
    if (!fs.existsSync(bicepAbsPath)) {
      throw new Error(`Bicep template not found at ${bicepAbsPath}`);
    }

    // If the file is .bicep, compile to ARM JSON via az CLI
    let templateContent: Record<string, unknown>;
    if (bicepAbsPath.endsWith('.bicep')) {
      templateContent = await compileBicepToArm(bicepAbsPath);
    } else {
      templateContent = JSON.parse(fs.readFileSync(bicepAbsPath, 'utf-8')) as Record<string, unknown>;
    }

    // Convert user-supplied parameters to the ARM format { paramName: { value } }
    const armParameters: Record<string, { value: unknown }> = {};
    for (const [key, val] of Object.entries(request.parameters)) {
      armParameters[key] = { value: val };
    }

    // ── 3. Submit the ARM deployment ────────────────────────────────
    updateDeploymentStatus(id, 'in_progress');
    console.log(
      `[azure] Starting ARM deployment "${id}" in ${resourceGroup} (sub ${subscriptionId})`,
    );

    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, subscriptionId);

    const deploymentName = `idp-${request.templateId}-${id.slice(0, 8)}`;
    const location = request.azureConfig?.location || 'uksouth';

    const poller = await client.deployments.beginCreateOrUpdate(
      resourceGroup,
      deploymentName,
      {
        properties: {
          mode: 'Incremental',
          template: templateContent,
          parameters: armParameters,
        },
        location,
      },
    );

    // Wait for the deployment to finish (the SDK handles long-running polling).
    const result = await poller.pollUntilDone();

    console.log(`[azure] Deployment "${deploymentName}" completed — provisioningState=${result.properties?.provisioningState}`);

    const finalStatus =
      result.properties?.provisioningState === 'Succeeded' ? 'succeeded' : 'failed';

    const updated = updateDeploymentStatus(id, finalStatus, {
      result: {
        provisioningState: result.properties?.provisioningState,
        outputs: result.properties?.outputs,
        correlationId: result.properties?.correlationId,
        deploymentName,
      },
    });

    return updated ?? deployment;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[azure] Deployment ${id} failed: ${message}`);
    const updated = updateDeploymentStatus(id, 'failed', { error: message });
    return updated ?? { ...deployment, status: 'failed', error: message, updatedAt: new Date().toISOString() };
  }
}

/**
 * Get the status of a specific Azure deployment.
 */
export async function getAzureDeploymentStatus(
  subscriptionId: string,
  resourceGroup: string,
  deploymentName: string,
): Promise<{ provisioningState?: string; error?: string }> {
  try {
    const credential = new DefaultAzureCredential();
    const client = new ResourceManagementClient(credential, subscriptionId);
    const result = await client.deployments.get(resourceGroup, deploymentName);
    return { provisioningState: result.properties?.provisioningState };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * List resource groups in the given subscription.
 */
export async function listResourceGroups(
  subscriptionId: string,
): Promise<{ name: string; location: string }[]> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, subscriptionId);
  const groups: { name: string; location: string }[] = [];
  for await (const rg of client.resourceGroups.list()) {
    if (rg.name) {
      groups.push({ name: rg.name, location: rg.location });
    }
  }
  return groups;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Compile a .bicep file to ARM JSON using `az bicep build`.
 * Returns the parsed ARM template object.
 */
async function compileBicepToArm(bicepPath: string): Promise<Record<string, unknown>> {
  try {
    const { stdout } = await execFileAsync('az', [
      'bicep', 'build',
      '--file', bicepPath,
      '--stdout',
    ], { timeout: 60_000 });
    return JSON.parse(stdout) as Record<string, unknown>;
  } catch (err: unknown) {
    // Fallback: if the file is already JSON (e.g. pre-compiled ARM template)
    const content = fs.readFileSync(bicepPath, 'utf-8').trim();
    if (content.startsWith('{')) {
      return JSON.parse(content) as Record<string, unknown>;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to compile Bicep template: ${message}`);
  }
}
