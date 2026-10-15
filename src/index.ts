/** Return a sorted copy of unique finite numbers; never mutate the input. */
export function sortedUnique(values: readonly number[]): number[] {
  if (values.some(value => !Number.isFinite(value))) {
    throw new RangeError('FINITE_NUMBERS_REQUIRED');
  }
  return [...new Set(values)].sort();
}
