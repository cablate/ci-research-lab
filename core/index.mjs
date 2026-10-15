import { createHash } from 'node:crypto';

/** Input errors are explicit, not crashes miscounted as successful detection. */
export class InputError extends Error {
  constructor(code, detail, status = 'invalid') { super(detail); this.code = code; this.status = status; }
}

export const EXIT_CODES = Object.freeze({ pass: 0, fail: 1, inconclusive: 2, invalid: 3 });
export function errorVerdict(error) {
  if (!(error instanceof InputError)) throw error; // Never call an unexpected crash verified rejection.
  return { schemaVersion: 1, verdict: error.status, reasons: [{ code: error.code, status: error.status, detail: error.message }], checks: [] };
}

function demand(ok, code, detail) {
  if (!ok) throw new InputError(code, detail);
}
function object(value, keys, label) {
  demand(value !== null && typeof value === 'object' && !Array.isArray(value), 'INVALID_OBJECT', label);
  demand(Object.keys(value).every(key => keys.includes(key)), 'UNKNOWN_FIELD', label);
}
function version(value, label) {
  demand(value.schemaVersion === 1, 'UNSUPPORTED_SCHEMA', label);
}
function text(value, label) {
  demand(typeof value === 'string' && value.trim().length > 0, 'INVALID_STRING', label);
}
function canonical(value, seen = new Set()) {
  if (value === null) return 'null';
  if (['string', 'boolean'].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  demand(typeof value === 'object' && !seen.has(value), 'NON_JSON_VALUE', 'fingerprints accept JSON values only');
  seen.add(value);
  if (Array.isArray(value)) {
    const result = `[${Array.from(value, item => canonical(item, seen)).join(',')}]`;
    seen.delete(value);
    return result;
  }
  if (value !== null && typeof value === 'object') {
    demand([Object.prototype, null].includes(Object.getPrototypeOf(value)), 'NON_JSON_VALUE', 'expected plain JSON object');
    demand(Reflect.ownKeys(value).every(key => typeof key === 'string'), 'NON_JSON_VALUE', 'symbol keys are not JSON');
    const result = `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key], seen)}`).join(',')}}`;
    seen.delete(value);
    return result;
  }
}

/** Deterministic input fingerprint, NOT a signature or executor attestation. */
export function fingerprint(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

export function validateContract(contract) {
  object(contract, ['schemaVersion', 'supportedEvents', 'checks'], 'contract');
  version(contract, 'contract');
  demand(Array.isArray(contract.supportedEvents) && contract.supportedEvents.length > 0, 'INVALID_EVENTS', 'supportedEvents');
  contract.supportedEvents.forEach(event => text(event, 'event'));
  demand(new Set(contract.supportedEvents).size === contract.supportedEvents.length, 'DUPLICATE_EVENT', 'supportedEvents');
  demand(Array.isArray(contract.checks) && contract.checks.length > 0, 'EMPTY_REQUIRED_SET', 'checks');
  const ids = new Set();
  for (const check of contract.checks) {
    object(check, ['id', 'required', 'minTests'], 'check');
    demand(typeof check.id === 'string' && /^[a-z][a-z0-9_-]*$/.test(check.id), 'INVALID_CHECK_ID', 'check.id');
    demand(!ids.has(check.id), 'DUPLICATE_CHECK_ID', check.id);
    ids.add(check.id);
    demand(check.required === true, 'UNSUPPORTED_REQUIREMENT', `${check.id}: only unconditional required checks supported`);
    if (check.minTests !== undefined) {
      demand(Number.isSafeInteger(check.minTests) && check.minTests > 0, 'INVALID_MIN_TESTS', check.id);
    }
  }
  return contract;
}

/** v1 selects all contract checks, never guesses scope from unavailable data. */
export function createPlan(contract, context) {
  validateContract(contract);
  object(context, ['schemaVersion', 'revision', 'event'], 'context');
  version(context, 'context');
  text(context.revision, 'revision');
  text(context.event, 'event');
  if (!contract.supportedEvents.includes(context.event)) throw new InputError('UNSUPPORTED_EVENT', context.event, 'inconclusive');
  const body = {
    schemaVersion: 1,
    revision: context.revision,
    event: context.event,
    contractDigest: fingerprint(contract),
    checks: contract.checks.map(check => ({
      id: check.id, reason: 'REQUIRED_BY_CONTRACT',
      ...(check.minTests === undefined ? {} : { minTests: check.minTests })
    }))
  };
  return { ...body, planDigest: fingerprint(body) };
}

function validatePlan(plan, rebuilt) {
  object(plan, ['schemaVersion', 'revision', 'event', 'contractDigest', 'checks', 'planDigest'], 'plan');
  version(plan, 'plan');
  demand(canonical(plan) === canonical(rebuilt), 'PLAN_NOT_DERIVED_FROM_CONTRACT', 'plan differs from reconstructed contract plan');
}

const RESULTS = ['success', 'failure', 'skipped', 'cancelled', 'timed_out', 'unsupported'];
const RESULT_CODES = {
  failure: 'CHECK_FAILED', skipped: 'CHECK_SKIPPED', cancelled: 'CHECK_CANCELLED',
  timed_out: 'CHECK_TIMED_OUT', unsupported: 'CHECK_UNSUPPORTED'
};

/** Evaluate observations; neither this function nor its CLI executes checks. */
export function evaluate(contract, expectedContext, suppliedPlan, evidence) {
  try { return evaluateValidated(contract, expectedContext, suppliedPlan, evidence); }
  catch (error) { return errorVerdict(error); }
}

function evaluateValidated(contract, expectedContext, suppliedPlan, evidence) {
  validateContract(contract);
  const plan = createPlan(contract, expectedContext);
  validatePlan(suppliedPlan, plan);
  object(evidence, ['schemaVersion', 'records'], 'evidence');
  version(evidence, 'evidence');
  demand(Array.isArray(evidence.records), 'INVALID_RECORDS', 'records');
  const reasons = [];
  const add = (code, checkId, detail, status = 'inconclusive') => reasons.push({ code, status, ...(checkId ? { checkId } : {}), detail });
  const validRecords = [];
  for (const record of evidence.records) {
    try {
    object(record, ['checkId', 'revision', 'contractDigest', 'planDigest', 'result', 'executedTests'], 'record');
    text(record.checkId, 'checkId');
    if (record.revision !== undefined) text(record.revision, 'revision');
    for (const key of ['contractDigest', 'planDigest']) {
      if (record[key] !== undefined) demand(typeof record[key] === 'string' && /^[0-9a-f]{64}$/.test(record[key]), 'INVALID_DIGEST', key);
    }
    demand(RESULTS.includes(record.result), 'UNSUPPORTED_RESULT', String(record.result));
    if (record.executedTests !== undefined) {
      demand(Number.isSafeInteger(record.executedTests) && record.executedTests >= 0, 'INVALID_TEST_COUNT', record.checkId);
    }
      validRecords.push(record);
    } catch (error) {
      if (!(error instanceof InputError)) throw error;
      add(error.code, typeof record?.checkId === 'string' ? record.checkId : undefined, error.message, 'invalid');
    }
  }
  const ids = new Set(plan.checks.map(check => check.id));
  for (const record of validRecords) {
    if (!ids.has(record.checkId)) add('UNKNOWN_CHECK_EVIDENCE', record.checkId, 'not in required plan', 'invalid');
  }
  const checks = [];
  for (const check of plan.checks) {
    const records = validRecords.filter(record => record.checkId === check.id);
    if (records.length === 0) add('REQUIRED_EVIDENCE_MISSING', check.id, 'no record received');
    if (records.length > 1) {
      const identical = records.every(record => canonical(record) === canonical(records[0]));
      add(identical ? 'DUPLICATE_EVIDENCE' : 'CONTRADICTORY_EVIDENCE', check.id, 'exactly one record required; no result chosen', 'invalid');
    }
    for (const record of records) {
      const identityValid = ['revision', 'contractDigest', 'planDigest'].every(key => record[key] === plan[key]);
      for (const [key, code] of [
        ['revision', 'REVISION_MISMATCH'], ['contractDigest', 'CONTRACT_DIGEST_MISMATCH'], ['planDigest', 'PLAN_DIGEST_MISMATCH']
      ]) {
        if (record[key] === undefined) add('EVIDENCE_IDENTITY_MISSING', check.id, `record ${key} not reported`);
        else if (record[key] !== plan[key]) add(code, check.id, `record ${key} differs from plan`);
      }
      if (record.result !== 'success') add(RESULT_CODES[record.result], check.id, record.result,
        record.result === 'failure' && identityValid ? 'fail' : 'inconclusive');
      // Even unconfigured checks cannot claim success after reporting zero tests.
      if (record.executedTests === 0) add('ZERO_TESTS', check.id, 'reported zero executed tests',
        check.minTests !== undefined && identityValid ? 'fail' : 'inconclusive');
      if (check.minTests !== undefined) {
        if (record.executedTests === undefined) add('TEST_COUNT_MISSING', check.id, `minimum ${check.minTests}`);
        else if (record.executedTests > 0 && record.executedTests < check.minTests) {
          add('TEST_COUNT_BELOW_MINIMUM', check.id, `received ${record.executedTests}; minimum ${check.minTests}`,
            identityValid ? 'fail' : 'inconclusive');
        }
      }
    }
    const satisfied = !reasons.some(reason => reason.checkId === check.id);
    checks.push({
      id: check.id, status: satisfied ? 'satisfied' : 'unsatisfied',
      testCountVerification: check.minTests === undefined ? 'not-configured' : satisfied ? 'verified' : 'not-verified'
    });
  }
  return {
    schemaVersion: 1, verdict: ['invalid', 'fail', 'inconclusive'].find(status => reasons.some(reason => reason.status === status)) ?? 'pass',
    revision: plan.revision, contractDigest: plan.contractDigest, planDigest: plan.planDigest,
    reasons, checks
  };
}

/** Same reason representation for human, CLI and adapter consumers. */
export function explain(verdict) {
  return verdict.reasons.map(reason => `${reason.code} [${reason.checkId}]: ${reason.detail}`);
}
