import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { githubPlan, readContract } from './github-adapter.mjs';

try {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  // Preserve actual checkout identity; never overwrite it with the expected SHA.
  const plan = githubPlan(readContract(), { ...process.env, GITHUB_SHA: revision });
  const output = `revision=${plan.revision}\ncontract_digest=${plan.contractDigest}\nplan_digest=${plan.planDigest}\n`;
  appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log(JSON.stringify({ revision: plan.revision, contractDigest: plan.contractDigest, planDigest: plan.planDigest }));
} catch (error) {
  console.error(error.code ?? error.message);
  process.exitCode = 1;
}
