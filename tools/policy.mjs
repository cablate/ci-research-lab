/** Shadow-only classification: the real workflow always runs product checks. */
export function selectChecks(paths) {
  if (!Array.isArray(paths) || paths.length === 0 || paths.some(path => typeof path !== 'string')) {
    return { checks: ['product'], reason: 'unknown-full-check' };
  }
  const docsOnly = paths.every(path => /^(README(?:\.zh-TW)?\.md|CONTRIBUTING\.md|docs\/[^.].*\.md)$/.test(path));
  return docsOnly
    ? { checks: [], reason: 'docs-only-shadow' }
    : { checks: ['product'], reason: 'product-or-unknown' };
}

/** Legacy local baseline only; the hosted gate exclusively uses core/index.mjs. */
export function assessRequired(needs, expected = ['product']) {
  if (!Array.isArray(expected) || expected.length === 0) throw new Error('EMPTY_REQUIRED_SET');
  if (!needs || typeof needs !== 'object' || Array.isArray(needs)) throw new Error('INVALID_RESULTS');
  const failures = expected.filter(name => needs[name]?.result !== 'success')
    .map(name => `${name}:${needs[name]?.result ?? 'missing'}`);
  if (failures.length > 0) throw new Error(`REQUIRED_RESULTS_REJECTED: ${failures.join(',')}`);
  return 'REQUIRED_RESULTS_PASSED';
}
