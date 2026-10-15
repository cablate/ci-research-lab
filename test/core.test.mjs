import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createPlan, evaluate, fingerprint, InputError, explain } from '../core/index.mjs';
import { githubVerdict } from '../tools/github-adapter.mjs';
import { standaloneTestEnv } from '../tools/process.mjs';

const json = name => JSON.parse(readFileSync(`fixtures/${name}.json`, 'utf8'));
const contract = json('contract');
const context = json('context');
const plan = json('plan');
const good = json('evidence-good');
const cases = json('comparison');
const clone = data => structuredClone(data);

// Deliberately artificial comparator, NOT any existing product's implementation.
const weakReceivedOnly = evidence => evidence.records.every(record => record.result === 'success');

test('core normal complete identity passes', () => {
  const result = evaluate(contract, context, plan, good);
  assert.equal(result.verdict, 'pass');
  assert.deepEqual(result.reasons, []);
  assert.equal(result.checks[0].testCountVerification, 'verified');
});
for (const scenario of cases) {
  test(`fixed comparison: ${scenario.name}`, () => {
    assert.equal(weakReceivedOnly(scenario.evidence), scenario.weakPass);
    const result = evaluate(contract, context, plan, scenario.evidence);
    assert.equal(result.verdict, scenario.expected);
    if (scenario.code) assert.ok(result.reasons.some(reason => reason.code === scenario.code));
    else assert.deepEqual(result.reasons, []);
    assert.equal(explain(result).length, result.reasons.length);
  });
}
test('canonical object keys recursive; arrays preserve order; lowercase SHA256', () => {
  assert.equal(fingerprint({ z: { b: 2, a: 1 }, a: [3, 2] }), fingerprint({ a: [3, 2], z: { a: 1, b: 2 } }));
  assert.notEqual(fingerprint([1, 2]), fingerprint([2, 1]));
  assert.match(plan.planDigest, /^[0-9a-f]{64}$/);
  const { planDigest, ...body } = plan;
  assert.equal(fingerprint(body), planDigest);
});
test('fingerprints reject non-JSON rather than silently dropping values', () => {
  const cycle = {}; cycle.self = cycle;
  for (const value of [undefined, NaN, Infinity, 1n, () => {}, { a: undefined }, cycle, new Date(), { [Symbol('key')]: 1 }]) {
    assert.throws(() => fingerprint(value), error => error instanceof InputError && error.code === 'NON_JSON_VALUE');
  }
});
test('plan selects all required checks; event changes plan digest', () => {
  const c = { ...contract, supportedEvents: ['local', 'push'], checks: [...contract.checks, { id: 'lint', required: true }] };
  const a = createPlan(c, context);
  const b = createPlan(c, { ...context, event: 'push' });
  assert.deepEqual(a.checks.map(check => check.id), ['product', 'lint']);
  assert.ok(a.checks.every(check => check.reason === 'REQUIRED_BY_CONTRACT'));
  assert.notEqual(a.planDigest, b.planDigest);
});
test('unknown schema/duplicate ID/unknown semantics explicitly invalid', () => {
  for (const [c, code] of [
    [{ ...contract, schemaVersion: 99 }, 'UNSUPPORTED_SCHEMA'],
    [{ ...contract, checks: [...contract.checks, ...contract.checks] }, 'DUPLICATE_CHECK_ID'],
    [{ ...contract, shell: 'should never execute' }, 'UNKNOWN_FIELD'],
    [{ ...contract, checks: [{ id: 'product', required: false }] }, 'UNSUPPORTED_REQUIREMENT']
  ]) {
    const result = evaluate(c, context, plan, good);
    assert.equal(result.verdict, 'invalid');
    assert.equal(result.reasons[0].code, code);
  }
});
test('unsupported event is inconclusive, not a product failure', () => {
  const result = evaluate(contract, { ...context, event: 'merge_group' }, plan, good);
  assert.equal(result.verdict, 'inconclusive');
  assert.equal(result.reasons[0].code, 'UNSUPPORTED_EVENT');
});
test('forged plan cannot remove obligations even with recomputed digest', () => {
  const forged = { ...plan, checks: [] };
  const { planDigest, ...body } = forged;
  forged.planDigest = fingerprint(body);
  const result = evaluate(contract, context, forged, good);
  assert.equal(result.verdict, 'invalid');
  assert.equal(result.reasons[0].code, 'PLAN_NOT_DERIVED_FROM_CONTRACT');
});
test('external old plan cannot replace the independent expected context', () => {
  const result = evaluate(contract, { ...context, revision: 'synthetic-revision-B' }, plan, good);
  assert.equal(result.verdict, 'invalid');
  assert.equal(result.reasons[0].code, 'PLAN_NOT_DERIVED_FROM_CONTRACT');
});
test('unconfigured minimum never claims verified test quantity', () => {
  const c = { ...contract, checks: [{ id: 'product', required: true }] };
  const p = createPlan(c, context);
  const record = { checkId: 'product', revision: p.revision, contractDigest: p.contractDigest, planDigest: p.planDigest, result: 'success' };
  const result = evaluate(c, context, p, { schemaVersion: 1, records: [record] });
  assert.equal(result.verdict, 'pass');
  assert.equal(result.checks[0].testCountVerification, 'not-configured');
  const zero = evaluate(c, context, p, { schemaVersion: 1, records: [{ ...record, executedTests: 0 }] });
  assert.notEqual(zero.verdict, 'pass');
  assert.ok(zero.reasons.some(reason => reason.code === 'ZERO_TESTS'));
});
test('invalid > fail > inconclusive precedence retains reasons', () => {
  const c = { ...contract, checks: [...contract.checks, { id: 'lint', required: true }] };
  const p = createPlan(c, context);
  const r = { ...good.records[0], contractDigest: p.contractDigest, planDigest: p.planDigest, result: 'failure' };
  const fail = evaluate(c, context, p, { schemaVersion: 1, records: [r] });
  assert.equal(fail.verdict, 'fail');
  assert.ok(fail.reasons.some(reason => reason.code === 'CHECK_FAILED'));
  assert.ok(fail.reasons.some(reason => reason.code === 'REQUIRED_EVIDENCE_MISSING'));
  const invalid = evaluate(c, context, p, { schemaVersion: 1, records: [r, { ...r, result: 'success' }] });
  assert.equal(invalid.verdict, 'invalid');
  for (const code of ['CHECK_FAILED', 'REQUIRED_EVIDENCE_MISSING', 'CONTRADICTORY_EVIDENCE']) {
    assert.ok(invalid.reasons.some(reason => reason.code === code));
  }
});
test('malformed count/digest and unknown evidence check are invalid', () => {
  for (const record of [{ ...good.records[0], executedTests: -1 }, { ...good.records[0], checkId: 'unknown' }, { ...good.records[0], contractDigest: 'not-a-sha256' }]) {
    const result = evaluate(contract, context, plan, { schemaVersion: 1, records: [record] });
    assert.equal(result.verdict, 'invalid');
  }
});
test('stale failure is not current-revision failure evidence', () => {
  const result = evaluate(contract, context, plan, { schemaVersion: 1, records: [{ ...good.records[0], revision: 'old', result: 'failure', executedTests: 0 }] });
  assert.equal(result.verdict, 'inconclusive');
  assert.ok(result.reasons.some(reason => reason.code === 'REVISION_MISMATCH'));
});
test('GitHub adapter uses product identity, never repairs stale success', () => {
  const env = { GITHUB_SHA: context.revision, GITHUB_EVENT_NAME: 'local' };
  const outputs = { revision: plan.revision, contract_digest: plan.contractDigest, plan_digest: plan.planDigest, executed_tests: '2' };
  assert.equal(githubVerdict(contract, env, { product: { result: 'success', outputs } }).verdict, 'pass');
  const stale = githubVerdict(contract, env, { product: { result: 'success', outputs: { ...outputs, revision: 'wrong-checkout' } } });
  assert.equal(stale.verdict, 'inconclusive');
  assert.ok(stale.reasons.some(reason => reason.code === 'REVISION_MISMATCH'));
  const skipped = githubVerdict(contract, env, { product: { result: 'skipped', outputs: {} } });
  assert.equal(skipped.verdict, 'inconclusive');
  assert.ok(skipped.reasons.some(reason => reason.code === 'CHECK_SKIPPED'));
});
for (const [evidence, status, exit, code] of [
  ['evidence-good', 'pass', 0, null], ['evidence-failure', 'fail', 1, 'CHECK_FAILED'],
  ['evidence-missing', 'inconclusive', 2, 'REQUIRED_EVIDENCE_MISSING']
]) {
  test(`read-only CLI ${status} returns structured result and exit ${exit}`, () => {
    const result = spawnSync(process.execPath, ['tools/ci.mjs', 'evaluate', 'fixtures/contract.json', 'fixtures/context.json', 'fixtures/plan.json', `fixtures/${evidence}.json`], { encoding: 'utf8', env: standaloneTestEnv() });
    assert.equal(result.status, exit);
    const verdict = JSON.parse(result.stdout);
    assert.equal(verdict.verdict, status);
    if (code) assert.ok(verdict.reasons.some(reason => reason.code === code));
  });
}
test('CLI unsupported schema is invalid exit 3; unsupported event inconclusive exit 2', () => {
  for (const [file, code, status, exit] of [
    ['contract-unsupported', 'UNSUPPORTED_SCHEMA', 'invalid', 3],
    ['contract-duplicate', 'DUPLICATE_CHECK_ID', 'invalid', 3],
    ['context-unsupported', 'UNSUPPORTED_EVENT', 'inconclusive', 2]
  ]) {
    const args = file.startsWith('contract') ? [`fixtures/${file}.json`, 'fixtures/context.json'] : ['fixtures/contract.json', `fixtures/${file}.json`];
    const result = spawnSync(process.execPath, ['tools/ci.mjs', 'plan', ...args], { encoding: 'utf8', env: standaloneTestEnv() });
    assert.equal(result.status, exit);
    const verdict = JSON.parse(result.stdout);
    assert.equal(verdict.verdict, status);
    assert.equal(verdict.reasons[0].code, code);
  }
});
test('CLI plan is deterministic and explain preserves reason codes', () => {
  const options = { encoding: 'utf8', env: standaloneTestEnv() };
  const result = spawnSync(process.execPath, ['tools/ci.mjs', 'plan', 'fixtures/contract.json', 'fixtures/context.json'], options);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), plan);
  const explanation = spawnSync(process.execPath, ['tools/ci.mjs', 'explain', 'fixtures/contract.json', 'fixtures/context.json', 'fixtures/plan.json', 'fixtures/evidence-missing.json'], options);
  assert.equal(explanation.status, 2);
  assert.match(JSON.parse(explanation.stdout).explanation[0], /REQUIRED_EVIDENCE_MISSING/);
  const unreadable = spawnSync(process.execPath, ['tools/ci.mjs', 'plan', 'fixtures/not-present.json', 'fixtures/context.json'], options);
  assert.equal(unreadable.status, 3);
  assert.equal(JSON.parse(unreadable.stdout).reasons[0].code, 'INPUT_JSON_UNREADABLE');
});
