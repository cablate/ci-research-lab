import { spawnSync } from 'node:child_process';

export function standaloneTestEnv() {
  const env = { ...process.env };
  // A nested test CLI must not inherit the parent's test-worker protocol.
  delete env.NODE_TEST_CONTEXT;
  return env;
}

/** No shell: preserve child exit status on Windows and Linux. */
export function checkedNode(args, options = {}) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', env: standaloneTestEnv(), ...options });
  if (result.error) throw new Error(`COMMAND_START_FAILED: ${result.error.code}`);
  if (result.status !== 0) {
    const error = new Error(`COMMAND_FAILED: exit=${result.status}`);
    error.result = result;
    throw error;
  }
  return result;
}
