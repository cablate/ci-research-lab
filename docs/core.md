# Verification core v1

The prototype adds one executable model, not a wrapper that merely launches existing linters. A strict versioned contract produces a plan; observed evidence is judged against that plan and independently supplied expected context. The CLI does not run the checks. Product commands and GitHub status collection remain adapters.

## Public experimental API

Import from `core/index.mjs` with zero runtime dependencies:

```js
import { createPlan, evaluate, explain, EXIT_CODES } from './core/index.mjs';
const plan = createPlan(contract, expectedContext);
const verdict = evaluate(contract, expectedContext, plan, evidence);
const lines = explain(verdict);
const exit = EXIT_CODES[verdict.verdict];
```

`createPlan` rejects invalid inputs with an `InputError` carrying a code/status. `evaluate` converts known input errors into the same structured verdict representation. Unexpected internal exceptions remain exceptions, never claimed as successful detection. `explain` derives lines from reasons, not a second decision model. There is no stable API commitment at this experimental version.

JSON inputs use `schemaVersion: 1`; unknown fields/schema and duplicate check IDs are invalid. Contract fields: `supportedEvents` (unique strings), `checks` (nonempty unique IDs, `required: true`, optional positive integer `minTests`). Optional checks, rules, commands and arbitrary shell are unsupported; unknown semantics are rejected. Expected context contains only schemaVersion/revision/event. V1 always selects all required checks; shadow path classification is not connected to core selection.

Plan contains revision/event, contractDigest, selected check IDs/reasons/minTests, and planDigest. SHA256 lowercase hex fingerprints use recursively sorted object keys and order-preserving arrays; non-JSON values are rejected. Contract digest covers the validated contract; plan digest excludes its own field. Evaluation reconstructs the complete plan from authoritative contract plus independent expected context, and rejects any external plan with different semantics even if its digest was recomputed. CLI context is caller-supplied; the core cannot prove it describes a real checkout.

Evidence envelope contains schemaVersion and records. Each record has checkId/result plus revision/contractDigest/planDigest execution identity and, where needed, executedTests. Missing identity is inconclusive; malformed digest/count is invalid. Success requires exactly one applicable record, matching identity and all configured obligations. Duplicate records are invalid even when identical; conflicting duplicates are not reconciled as retries. Only explicit current-identity failures/count shortfalls establish fail; a stale failure is not evidence about the current revision. No minimum configured means testCountVerification is not-configured, not quantity-verified. Explicit zero counts never pass even without a minimum.

## Verdict semantics

| Status | Exit | Meaning / representative codes |
|---|---|---|
| pass | 0 | Every required obligation has matching success evidence; reasons empty |
| fail | 1 | Current-identity observed failure or count below a configured minimum: CHECK_FAILED, ZERO_TESTS, TEST_COUNT_BELOW_MINIMUM |
| inconclusive | 2 | Not demonstrated: REQUIRED_EVIDENCE_MISSING, EVIDENCE_IDENTITY_MISSING, CHECK_SKIPPED, CHECK_CANCELLED, CHECK_TIMED_OUT, CHECK_UNSUPPORTED, TEST_COUNT_MISSING, REVISION_MISMATCH, CONTRACT_DIGEST_MISMATCH, PLAN_DIGEST_MISMATCH, UNSUPPORTED_EVENT |
| invalid | 3 | Invalid input/model: UNSUPPORTED_SCHEMA, DUPLICATE_CHECK_ID, DUPLICATE_EVIDENCE, CONTRADICTORY_EVIDENCE, PLAN_NOT_DERIVED_FROM_CONTRACT, INVALID_DIGEST, INVALID_TEST_COUNT, UNKNOWN_FIELD |

All independently determinable reasons are preserved for validly readable evidence records. Overall priority: invalid > fail > inconclusive > pass. An invalid contract/context/plan prevents a meaningful evaluation of its dependent obligations; the core then returns that input reason rather than inventing downstream evidence conclusions. Unexpected crashes produce no verified verdict and are not accepted by reason-specific tests.

## Read-only CLI

```sh
node tools/ci.mjs plan fixtures/contract.json fixtures/context.json
node tools/ci.mjs evaluate fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-good.json
node tools/ci.mjs explain fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-missing.json
node tools/ci.mjs evaluate fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-failure.json
node tools/ci.mjs plan fixtures/contract-duplicate.json fixtures/context.json
```

Expected exits respectively: 0, 0, 2, 1, 3. The inconclusive case explains REQUIRED_EVIDENCE_MISSING; failed evidence explains CHECK_FAILED; duplicate contract explains DUPLICATE_CHECK_ID. Missing/unreadable/malformed JSON returns invalid with INPUT_JSON_UNREADABLE, not an unstructured crash. Commands read explicit JSON files and write stdout only: no check execution, file mutation, secrets, network, push or deployment. Shell redirection is the caller's responsibility, not a CLI write feature.

## Fixed artificial comparison

`fixtures/comparison.json` holds 13 complete synthetic scenarios with expected status/reason and weak-control outcome. The explicitly artificial weak predicate only asks whether all received records say success; it is not claimed to reproduce any existing tool. The stronger core passes the normal control, identifies current failure, and rejects missing/zero/insufficient/stale/duplicate evidence for its specific reason. On these fixed fixtures, eight non-pass cases would be accepted by that weak predicate. This measures this artificial example set, not defect coverage, market superiority or performance of other tools.

## GitHub adapter data flow

1. `ci-contract.json` declares product required with minimum 59 tests, and supports local/push/pull_request/workflow_dispatch. Main CI always runs product; no shadow selection skip.
2. After checkout, `github-identity.mjs` reads actual `git rev-parse HEAD` and creates the product execution plan for that actual revision/event. It emits revision/contract/plan identity as step outputs; it never overwrites observed identity with expected GITHUB_SHA. Default PR checkout is the merge test commit, not PR head.
3. `npm run verify` runs the unchanged product baseline plus core tests. Only a successful guarded runner emits actual passing count into GITHUB_OUTPUT. The product job exports identity and count separately from its actual job result.
4. `gate.mjs` reads GitHub needs. `github-adapter.mjs` independently creates expected context from this run's GITHUB_SHA/event and evaluates the actual product identity/result/count through the same core. Missing outputs stay missing; no adapter repairs stale identity. A skipped product yields inconclusive CHECK_SKIPPED; GitHub marks the nonzero gate step as failure. A tested product failure yields fail CHECK_FAILED. These are different core meanings even though both stop a green workflow.

Needs is trusted here only as a platform-supplied observation within this repo's limited workflow. Digests are not signatures or proof of honest execution; a contributor who changes workflow/core/contract may weaken evidence. The bounded hosted main/normal-PR/product-regression/skipped-product controls have now been observed with the expected pass/fail/inconclusive distinctions; run URLs and revisions are in [evidence](experiments.md). Normal PR evidence uses its actual merge test revision, not PR head. These observations do not establish general CI correctness, sufficient product requirements, or superiority over existing systems such as Bazel or Nx. Branch protection, review policy, fork secrets, merge queue, OIDC and environment/concurrency semantics are not implemented or verified. Whole-workflow cancellation may stop the gate.
