import { githubVerdict, readContract } from './github-adapter.mjs';
import { InputError, EXIT_CODES, errorVerdict } from '../core/index.mjs';

try {
  const verdict = githubVerdict(readContract(), process.env, JSON.parse(process.env.NEEDS_JSON ?? 'null'));
  console.log(JSON.stringify(verdict, null, 2));
  process.exitCode = EXIT_CODES[verdict.verdict];
} catch (error) {
  if (!(error instanceof InputError) && !(error instanceof SyntaxError)) throw error;
  const verdict = errorVerdict(error instanceof InputError ? error : new InputError('ADAPTER_JSON_INVALID', 'needs JSON malformed'));
  console.log(JSON.stringify(verdict));
  process.exitCode = EXIT_CODES[verdict.verdict];
}
