import { readFileSync } from 'node:fs';
import { createPlan, evaluate, explain, InputError, errorVerdict, EXIT_CODES } from '../core/index.mjs';

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new InputError('INPUT_JSON_UNREADABLE', 'expected readable JSON file'); }
}
try {
  const [command, ...files] = process.argv.slice(2);
  if (command === 'plan' && files.length === 2) {
    console.log(JSON.stringify(createPlan(...files.map(readJson)), null, 2));
  } else if (['evaluate', 'explain'].includes(command) && files.length === 4) {
    const verdict = evaluate(...files.map(readJson));
    console.log(JSON.stringify(command === 'explain' ? { ...verdict, explanation: explain(verdict) } : verdict, null, 2));
    process.exitCode = EXIT_CODES[verdict.verdict];
  } else throw new InputError('CLI_USAGE', 'plan CONTRACT CONTEXT | evaluate/explain CONTRACT CONTEXT PLAN EVIDENCE');
} catch (error) {
  if (!(error instanceof InputError)) throw error;
  const verdict = errorVerdict(error);
  console.log(JSON.stringify(verdict, null, 2));
  process.exitCode = EXIT_CODES[verdict.verdict];
}
