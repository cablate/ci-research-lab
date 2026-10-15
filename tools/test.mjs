import { readdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkedNode } from './process.mjs';

export function discoverTests(directory) {
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(file => file.isFile() && file.name.endsWith('.test.mjs'))
    .map(file => resolve(directory, file.name)).sort();
  if (files.length === 0) throw new Error('ZERO_TEST_FILES: expected *.test.mjs');
  return files;
}

export function runTests(directory = resolve('test'), requiredNames = [
  'numeric order and deduplication',
  'successful required result passes',
  'empty directory: raw Node is green, discovery guard rejects',
  'core normal complete identity passes'
]) {
  const files = discoverTests(directory);
  const result = checkedNode(['--test', '--test-reporter=tap', ...files]);
  const passed = /^# pass (\d+)$/m.exec(result.stdout)?.[1];
  if (passed === undefined) throw new Error('TEST_SUMMARY_MISSING');
  if (Number(passed) === 0) throw new Error('ZERO_EXECUTED_TESTS: at least one passing test required');
  const names = [...result.stdout.matchAll(/^# Subtest: (.*)$/gm)].map(match => match[1]);
  for (const name of requiredNames) {
    if (!names.includes(name)) throw new Error(`REQUIRED_TEST_MISSING: ${name}`);
  }
  return result;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = runTests(process.argv[2] ? resolve(process.argv[2]) : resolve('test'));
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `executedTests=${/^# pass (\d+)$/m.exec(result.stdout)[1]}\n`);
    }
  } catch (error) {
    if (error.result) {
      process.stdout.write(error.result.stdout);
      process.stderr.write(error.result.stderr);
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
