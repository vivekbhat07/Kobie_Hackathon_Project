import { Octokit } from '@octokit/rest';
import config from '../config/env.js';

const enabled = Boolean(config.github.token);
const octokit = enabled ? new Octokit({ auth: config.github.token }) : null;

export function isGitEnabled() {
  return enabled;
}

// Full path of an alert file inside the repo, e.g. apps/alerts/my-alert.yaml
export function alertFilePath(fileName) {
  return `${config.github.alertsDir}/${fileName}`;
}

async function getFileSha(path) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: config.github.owner,
      repo: config.github.repo,
      path,
      ref: config.github.branch,
    });
    return Array.isArray(data) ? null : data.sha;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * Create or update a YAML file in the GitOps repo.
 * Returns the path that was written.
 */
export async function commitFile(path, content, message) {
  if (!enabled) {
    console.warn(`[git] GITHUB_TOKEN not set — skipping commit of ${path}`);
    return path;
  }

  const sha = await getFileSha(path);

  await octokit.repos.createOrUpdateFileContents({
    owner: config.github.owner,
    repo: config.github.repo,
    path,
    branch: config.github.branch,
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    ...(sha ? { sha } : {}),
  });

  return path;
}

/**
 * Delete a file from the GitOps repo. No-op if the file is already gone.
 */
export async function deleteFile(path, message) {
  if (!enabled) {
    console.warn(`[git] GITHUB_TOKEN not set — skipping delete of ${path}`);
    return;
  }

  const sha = await getFileSha(path);
  if (!sha) return; // already absent

  await octokit.repos.deleteFile({
    owner: config.github.owner,
    repo: config.github.repo,
    path,
    branch: config.github.branch,
    message,
    sha,
  });
}
