import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function describeContext(env, event = {}) {
  const name = env.GITHUB_EVENT_NAME ?? 'local';
  if (name === 'pull_request' && (!/^refs\/pull\/\d+\/merge$/.test(env.GITHUB_REF ?? '') ||
      !event.pull_request?.head?.sha || !event.pull_request?.base?.sha)) {
    throw new Error('PR_CONTEXT_INCOMPLETE');
  }
  return {
    event: name,
    ref: env.GITHUB_REF ?? null,
    sha: env.GITHUB_SHA ?? null,
    head: event.pull_request?.head?.sha ?? null,
    base: event.pull_request?.base?.sha ?? null,
    evidence: name === 'pull_request' ? 'PR_EVENT_OBSERVED' : 'NOT_PR_EVENT_EVIDENCE'
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const event = process.env.GITHUB_EVENT_PATH
      ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
    console.log(JSON.stringify(describeContext(process.env, event), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
