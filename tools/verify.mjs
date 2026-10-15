import { checkedNode } from './process.mjs';

try {
  for (const args of [
    ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'],
    ['tools/docs.mjs', 'check'],
    ['tools/test.mjs']
  ]) checkedNode(args, { stdio: 'inherit' });
  console.log('VERIFY_PASSED: build + bilingual docs + tests');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
