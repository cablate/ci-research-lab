import test from 'node:test';
import assert from 'node:assert/strict';
import { selectChecks, assessRequired } from '../tools/policy.mjs';
import { describeContext } from '../tools/context.mjs';

test('docs-only selection is shadow, not actual job skip', () => {
  assert.deepEqual(selectChecks(['README.md', 'docs/example.md']), { checks: [], reason: 'docs-only-shadow' });
});
for (const path of ['src/index.ts', 'package-lock.json', '.github/workflows/check.yml', 'unknown.file']) {
  test(`product or unknown path requires product: ${path}`, () => {
    assert.deepEqual(selectChecks([path]).checks, ['product']);
  });
}
test('missing diff and mixed changes fail toward full checks', () => {
  for (const paths of [null, [], ['README.md', 'src/index.ts'], [null]]) {
    assert.deepEqual(selectChecks(paths).checks, ['product']);
  }
});
test('successful required result passes', () => {
  assert.equal(assessRequired({ product: { result: 'success' } }), 'REQUIRED_RESULTS_PASSED');
});
for (const result of ['failure', 'skipped', 'cancelled', 'timed_out']) {
  test(`required ${result} is rejected for its precise reason`, () => {
    assert.throws(() => assessRequired({ product: { result } }), new RegExp(`REQUIRED_RESULTS_REJECTED: product:${result}`));
  });
}
test('missing required result and empty required set rejected', () => {
  assert.throws(() => assessRequired({}), /REQUIRED_RESULTS_REJECTED: product:missing/);
  assert.throws(() => assessRequired({}, []), /EMPTY_REQUIRED_SET/);
  assert.throws(() => assessRequired(null), /INVALID_RESULTS/);
});
test('local context is not PR evidence', () => {
  assert.equal(describeContext({}).evidence, 'NOT_PR_EVENT_EVIDENCE');
});
test('synthetic valid PR context exercises parser, not hosted proof', () => {
  const result = describeContext({ GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: 'refs/pull/1/merge', GITHUB_SHA: 'merge' },
    { pull_request: { head: { sha: 'head' }, base: { sha: 'base' } } });
  assert.equal(result.head, 'head');
  assert.equal(result.sha, 'merge');
  assert.equal(result.evidence, 'PR_EVENT_OBSERVED');
});
test('invalid PR context rejected', () => {
  assert.throws(() => describeContext({ GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: 'refs/heads/main' }), /PR_CONTEXT_INCOMPLETE/);
});
