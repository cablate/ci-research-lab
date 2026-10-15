import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkedNode, standaloneTestEnv } from '../tools/process.mjs';
import { discoverTests, runTests } from '../tools/test.mjs';

// All mutations live under an ignored lab directory, never in working source.
function sandbox(fn) {
  const parent = resolve('.lab-tmp');
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, 'case-'));
  try { return fn(directory); } finally {
    assert.equal(dirname(resolve(directory)), parent, 'cleanup must remain inside lab sandbox');
    rmSync(directory, { recursive: true, force: true });
  }
}

test('guard preserves child exit 7 instead of swallowing it', () => {
  assert.throws(() => checkedNode(['-e', 'process.exit(7)']), /COMMAND_FAILED: exit=7/);
});
test('bad wrapper control swallows exit 7 and incorrectly exits zero', () => {
  const source = "require('node:child_process').spawnSync(process.execPath,['-e','process.exit(7)']); console.log('SWALLOWED_EXIT_7')";
  const result = spawnSync(process.execPath, ['-e', source], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /SWALLOWED_EXIT_7/);
});
test('empty directory: raw Node is green, discovery guard rejects', () => sandbox(directory => {
  const raw = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd: directory, encoding: 'utf8', env: standaloneTestEnv() });
  assert.equal(raw.status, 0);
  assert.match(raw.stdout, /# tests 0/);
  assert.throws(() => discoverTests(directory), /ZERO_TEST_FILES/);
}));
test('nonempty passing test file is a positive discovery control', () => sandbox(directory => {
  writeFileSync(join(directory, 'control.test.mjs'), "import test from 'node:test'; test('control', () => {});\n");
  assert.equal(discoverTests(directory).length, 1);
  assert.match(runTests(directory, ['control']).stdout, /# pass 1/);
}));
test('empty test file is rejected even when a filename was discovered', () => sandbox(directory => {
  writeFileSync(join(directory, 'empty.test.mjs'), '');
  // Node counts an empty file as one passing file-level test. The named
  // baseline contract must still be present; a filename alone is insufficient.
  assert.throws(() => runTests(directory), /REQUIRED_TEST_MISSING: numeric order and deduplication/);
}));
test('all-skipped suite is rejected rather than green', () => sandbox(directory => {
  writeFileSync(join(directory, 'skip.test.mjs'), "import test from 'node:test'; test.skip('not executed', () => {});\n");
  assert.throws(() => runTests(directory), /ZERO_EXECUTED_TESTS/);
}));
test('type-invalid fixture is rejected specifically with TS2322', () => sandbox(directory => {
  const file = join(directory, 'invalid.ts');
  writeFileSync(file, 'const value: number = "not-a-number";\n');
  const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--target', 'ES2022', file], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /TS2322/);
}));
test('real product mutation builds but fails numeric order contract', () => sandbox(directory => {
  mkdirSync(join(directory, 'src'));
  mkdirSync(join(directory, 'test'));
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
  const original = readFileSync('src/index.ts', 'utf8');
  const mutated = original.replace('.sort((a, b) => a - b)', '.sort()');
  assert.notEqual(mutated, original, 'mutation must apply');
  writeFileSync(join(directory, 'src/index.ts'), mutated);
  cpSync('test/product.test.mjs', join(directory, 'test/product.test.mjs'));
  checkedNode(['node_modules/typescript/bin/tsc', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--outDir', join(directory, 'dist'), join(directory, 'src/index.ts')]);
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(directory, 'test/product.test.mjs')], { encoding: 'utf8', env: standaloneTestEnv() });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /NUMERIC_ORDER_CONTRACT/);
  assert.match(result.stdout, /# fail 1/);
}));
