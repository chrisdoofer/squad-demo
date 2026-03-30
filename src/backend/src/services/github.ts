import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { DeploymentRequest, Deployment } from '../types';
import { getTemplateById } from './catalog';
import { saveDeployment, updateDeploymentStatus } from './deploymentStore';
import { v4 as uuidv4 } from 'uuid';

/** Root of the monorepo — template paths in the catalog are relative to this. */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

/**
 * Scaffold a new GitHub repository with the selected template's
 * Bicep files and a GitHub Actions deployment workflow, then
 * optionally trigger the workflow.
 *
 * Flow:
 *  1. Validate inputs & resolve the template from the catalog.
 *  2. Create (or reuse) a GitHub repo via the Octokit REST API.
 *  3. Commit the Bicep template and workflow files to the repo.
 *  4. Optionally trigger the GitHub Actions deployment workflow.
 *  5. Return a {@link Deployment} record reflecting the outcome.
 */
export async function deployToGitHub(request: DeploymentRequest): Promise<Deployment> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const deployment: Deployment = {
    id,
    templateId: request.templateId,
    target: 'github',
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
    if (request.target !== 'github') {
      throw new Error(`Invalid target "${request.target}" — expected "github"`);
    }

    const template = await getTemplateById(request.templateId);
    if (!template) {
      throw new Error(`Template "${request.templateId}" not found in catalog`);
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    const owner = request.githubConfig?.owner;
    const repoName = request.githubConfig?.repo;
    const branch = request.githubConfig?.branch || 'main';

    if (!owner || !repoName) {
      throw new Error('githubConfig.owner and githubConfig.repo are required');
    }

    updateDeploymentStatus(id, 'in_progress');
    console.log(`[github] Scaffolding repo ${owner}/${repoName} with template "${request.templateId}"`);

    const octokit = new Octokit({ auth: token });

    // ── 2. Create or reuse the repository ───────────────────────────
    let repoUrl: string;
    try {
      const { data: existing } = await octokit.repos.get({ owner, repo: repoName });
      repoUrl = existing.html_url;
      console.log(`[github] Repository already exists: ${repoUrl}`);
    } catch {
      // Repo doesn't exist — create it. Try as an org repo first, fall
      // back to a user repo if the owner matches the authenticated user.
      try {
        const { data: created } = await octokit.repos.createInOrg({
          org: owner,
          name: repoName,
          auto_init: true,
          private: true,
          description: `IDP deployment: ${template.name}`,
        });
        repoUrl = created.html_url;
      } catch {
        const { data: created } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          auto_init: true,
          private: true,
          description: `IDP deployment: ${template.name}`,
        });
        repoUrl = created.html_url;
      }
      console.log(`[github] Created repository: ${repoUrl}`);
    }

    // ── 3. Collect files to commit ──────────────────────────────────
    const filesToCommit: { repoPath: string; content: string }[] = [];

    // Bicep files
    const bicepDir = path.join(PROJECT_ROOT, path.dirname(template.bicepPath));
    if (fs.existsSync(bicepDir)) {
      collectFiles(bicepDir, 'infra', filesToCommit);
    }

    // Workflow file(s)
    const workflowDir = path.join(PROJECT_ROOT, path.dirname(template.workflowPath));
    if (fs.existsSync(workflowDir)) {
      collectFiles(workflowDir, '.github/workflows', filesToCommit);
    }

    // ── 4. Commit files via the Git data API ────────────────────────
    if (filesToCommit.length > 0) {
      await commitFilesToRepo(octokit, owner, repoName, branch, filesToCommit,
        `chore: scaffold ${template.name} template via IDP`);
      console.log(`[github] Committed ${filesToCommit.length} file(s) to ${owner}/${repoName}`);
    }

    // ── 5. Optionally trigger the workflow ──────────────────────────
    let workflowDispatched = false;
    try {
      const workflowFileName = path.basename(template.workflowPath);
      if (filesToCommit.some((f) => f.repoPath.endsWith(workflowFileName))) {
        await octokit.actions.createWorkflowDispatch({
          owner,
          repo: repoName,
          workflow_id: workflowFileName,
          ref: branch,
        });
        workflowDispatched = true;
        console.log(`[github] Triggered workflow "${workflowFileName}"`);
      }
    } catch (dispatchErr: unknown) {
      // Non-fatal — the workflow may not be dispatchable yet
      const msg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);
      console.warn(`[github] Could not dispatch workflow: ${msg}`);
    }

    const updated = updateDeploymentStatus(id, 'succeeded', {
      result: {
        repoUrl,
        owner,
        repo: repoName,
        branch,
        filesCommitted: filesToCommit.length,
        workflowDispatched,
      },
    });

    return updated ?? deployment;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[github] Deployment ${id} failed: ${message}`);
    const updated = updateDeploymentStatus(id, 'failed', { error: message });
    return updated ?? { ...deployment, status: 'failed', error: message, updatedAt: new Date().toISOString() };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Recursively collect files from `dirPath`, mapping each to a repo-relative
 * path under `repoPrefix`. Skips `.gitkeep` files.
 */
function collectFiles(
  dirPath: string,
  repoPrefix: string,
  out: { repoPath: string; content: string }[],
): void {
  if (!fs.existsSync(dirPath)) return;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    const repoPath = `${repoPrefix}/${entry.name}`;

    if (entry.isDirectory()) {
      collectFiles(fullPath, repoPath, out);
    } else if (entry.name !== '.gitkeep') {
      out.push({ repoPath, content: fs.readFileSync(fullPath, 'utf-8') });
    }
  }
}

/**
 * Commit a set of files to a GitHub repo in a single commit using the
 * low-level Git data API (trees + blobs + commits).
 */
async function commitFilesToRepo(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  files: { repoPath: string; content: string }[],
  message: string,
): Promise<void> {
  // Get the latest commit SHA on the target branch
  let baseSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    baseSha = ref.object.sha;
  } catch {
    // Branch may not exist yet (empty repo after auto_init) — use default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
    baseSha = ref.object.sha;
  }

  const { data: baseCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: baseSha });

  // Create blobs for each file
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  for (const file of files) {
    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo,
      content: Buffer.from(file.content).toString('base64'),
      encoding: 'base64',
    });
    treeItems.push({ path: file.repoPath, mode: '100644', type: 'blob', sha: blob.sha });
  }

  // Create the tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  });

  // Create the commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [baseSha],
  });

  // Update the branch ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });
}
