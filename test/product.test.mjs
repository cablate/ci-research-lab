import test from 'node:test';
import assert from 'node:assert/strict';
import { sortedUnique } from '../dist/index.js';

test('numeric order and deduplication', () => {
  assert.deepEqual(sortedUnique([10, 2, 2, -1]), [-1, 2, 10], 'NUMERIC_ORDER_CONTRACT');
});
test('empty input', () => assert.deepEqual(sortedUnique([]), []));
test('input is not mutated', () => {
  const input = Object.freeze([3, 1, 3]);
  assert.deepEqual(sortedUnique(input), [1, 3]);
  assert.deepEqual(input, [3, 1, 3]);
});
test('finite decimals', () => assert.deepEqual(sortedUnique([0.5, -0.2, 0.5]), [-0.2, 0.5]));
test('reject non-finite values', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(() => sortedUnique([value]), /FINITE_NUMBERS_REQUIRED/);
  }
});
