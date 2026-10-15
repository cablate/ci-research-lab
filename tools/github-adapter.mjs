import { readFileSync } from 'node:fs';
import { createPlan, evaluate } from '../core/index.mjs';

export function githubPlan(contract, env) {
  return createPlan(contract, {
    schemaVersion: 1, revision: env.GITHUB_SHA, event: env.GITHUB_EVENT_NAME
  });
}

/** needs status belongs to this run; successful execution identity must be emitted by product. */
export function githubVerdict(contract, env, needs) {
  const plan = githubPlan(contract, env);
  const product = needs?.product;
  const records = [];
  if (product?.result) {
    const outputs = product.outputs ?? {};
    const count = outputs.executed_tests;
    records.push({
      checkId: 'product', result: product.result,
      ...(outputs.revision ? { revision: outputs.revision } : {}),
      ...(outputs.contract_digest ? { contractDigest: outputs.contract_digest } : {}),
      ...(outputs.plan_digest ? { planDigest: outputs.plan_digest } : {}),
      ...(count === undefined || count === '' ? {} : { executedTests: /^\d+$/.test(count) ? Number(count) : -1 })
    });
  }
  return evaluate(contract, { schemaVersion: 1, revision: env.GITHUB_SHA, event: env.GITHUB_EVENT_NAME }, plan, { schemaVersion: 1, records });
}

export function readContract() {
  return JSON.parse(readFileSync('ci-contract.json', 'utf8'));
}
