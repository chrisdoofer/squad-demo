import * as fs from 'fs';
import * as path from 'path';
import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
import { DeploymentRequest, Deployment } from '../types';
import { getTemplateById } from './catalog';
import { saveDeployment, updateDeploymentStatus } from './deploymentStore';
import { v4 as uuidv4 } from 'uuid';

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
    const templateContent = JSON.parse(fs.readFileSync(bicepAbsPath, 'utf-8'));

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
