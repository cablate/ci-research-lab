# Reproduction and evidence

Observation date: 2026-10-15 (Asia/Taipei). The original baseline now compares a bounded verification core against fixed controls; it is not a finished CI platform or speed benchmark. Local and hosted evidence are separate.

## Local contract

Run `npm ci --ignore-scripts`, `npm run verify`, and `npm run context` from the checkout root. The 59 outer tests preserve the original 28 (five product, fifteen baseline policy/context, eight preflight) and add 31 core/CLI/adapter tests. Known-fault child commands may fail; the outer test passes only if the status and expected diagnostic match. The hosted gate now exclusively uses the new core; old local result-policy tests remain baseline controls.

| Class | Positive control | Known-bad case and required diagnostic |
|---|---|---|
| Product/type | Numeric order, unique finite values, immutable input, empty/decimal input | Isolated `.sort()` mutation builds but fails NUMERIC_ORDER_CONTRACT; invalid number assignment fails TS2322 |
| Command propagation | Good source passes the outer verification | Real child exit 7 is rejected as COMMAND_FAILED: exit=7. An intentionally bad wrapper exits zero and prints SWALLOWED_EXIT_7, proving why wrapper success is insufficient |
| Zero tests | One explicit test fixture passes | Raw Node in an empty directory exits zero with tests 0; discovery guard rejects ZERO_TEST_FILES. Empty file rejects REQUIRED_TEST_MISSING, all-skipped suite rejects ZERO_EXECUTED_TESTS |
| Required results/selection baseline | Product success passes; docs-only shadow/mixed changes match policy | Legacy local failure/skip/cancel/missing controls still assert REQUIRED_RESULTS_REJECTED. Core/hosted now distinguish fail/inconclusive/invalid with [core reason codes](core.md). Shadow paths do not change actual selection |
| Context | Synthetic valid PR merge-ref parser control | Local reports NOT_PR_EVENT_EVIDENCE; malformed PR context rejects PR_CONTEXT_INCOMPLETE. Synthetic values prove only parser behavior |

Node may count an empty file as a passing file-level test, so files/count alone are insufficient: the runner also requires four named markers, including the normal core control. This is a small explicit contract, not proof that every intended suite exists. TAP format changes require review. Negative mutations are isolated; normal main never intentionally skips product. Core fixtures additionally cover zero/missing counts, mismatched revision/contract/plan, duplicated/contradictory evidence, unsupported event/schema, forged plans, four exit statuses and artificial weak-comparator differences.

## Bounded hosted procedure (maintainer only)

Normal workflow: main push and pull_request. Experimental branch pushes alone do not trigger it. workflow_dispatch is diagnostic only. Standard ubuntu-24.04, no cache/service/deployment/secrets, contents:read and pinned actions are deliberate limits. Maximum 12 runs total includes initial main and evidence updates; opening each PR normally adds one run. Avoid repeated synchronize pushes; do not merge negative branches or change branch protection.

1. Publish verified baseline on main. Expect product and gate success: push evidence only.
2. Normal PR: branch from baseline; add a final newline to CONTRIBUTING.md, open PR. Expect product/gate success; context event pull_request, ref refs/pull/NUMBER/merge, and public merge/head/base SHAs. Record all values. This is real PR-event evidence, unlike a manual run.
3. Product-failure PR: branch from baseline. In `src/index.ts`, replace exactly `.sort((a, b) => a - b)` with `.sort()`. Open PR. Build should succeed, numeric-order test fails NUMERIC_ORDER_CONTRACT; product failure makes core verdict fail with CHECK_FAILED (gate exit 1). Count evidence may also be missing because verification failed. The preflight mutation-application assertion may additionally fail because source is already mutated; it does not replace the required numeric-order diagnostic.
4. Skipped-product PR: branch from baseline. In `.github/workflows/check.yml`, insert `if: ${{ false }}` directly under `product:` at the indentation of its `name:`. Open PR. Product should be skipped; core verdict inconclusive includes CHECK_SKIPPED (gate exit 2, a failing GitHub step), missing identity/count reasons may accompany it. Keep gate's always condition and needs unchanged. This tests job skip, not whole-workflow skip.
5. Optional type-failure PR, only if useful and budget remains: branch from baseline; append `const invalid: number = "bad";` to `src/index.ts`. Expect TS2322 and product failure/gate rejection.
6. Close negative PRs without merging. Update evidence once from clean baseline (also consumes a main-push run). Stop at the cap or unexpected privilege/network/secret requirement; preserve evidence and investigate locally.

Gate failure is a check conclusion, NOT enforced merge prevention: no branch protection is configured in this round. Whole-workflow cancellation may stop the gate too; cancelled/missing are local unit inputs, not hosted observations. Fork, merge queue, OIDC, environment approval and concurrency cancellation remain unverified.

## Local evidence

- Windows; Node v22.23.2; npm 10.9.8; TypeScript 5.9.3 exact plus lockfile. TypeScript is a deliberately pinned known version, not described as latest.
- The original clean installation/full verification passed 28 tests. The current core's clean `npm ci --ignore-scripts` then `npm run verify` passed 59 tests, zero failures/skips/cancellations and VERIFY_PASSED. Current workflow static checking exited zero. The CLI complete case returned pass/exit 0 and the missing case returned inconclusive/exit 2 with REQUIRED_EVIDENCE_MISSING; all four status/exit combinations are also asserted in the core suite. `npm run context` reports local and NOT_PR_EVENT_EVIDENCE. These local observations preceded publication. The subsequently published baseline is `2ad546541a54f5edfe4c116b457fd6e149a105a5`; hosted results for that baseline and its three comparison PRs are recorded below.
- Direct zero-test CLI baseline: `node tools/test.mjs .lab-tmp/cli-empty` on the created empty directory exited 1 with ZERO_TEST_FILES. Core CLI controls assert structured pass/fail/inconclusive/invalid with exact exits 0/1/2/3 and reasons; read-only commands are in [core docs](core.md). Earlier baseline-only gate labels are superseded by the shared core and are not current hosted evidence.
- actionlint v1.7.12 Windows amd64 from [official release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12). Archive SHA256 `6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9` matched official checksums before extraction. Ignored binary under `.tools/`, not distributed. Command: `.tools/actionlint/actionlint.exe .github/workflows/check.yml`. This is static checking, not hosted evidence. Optional ShellCheck/pyflakes were not installed.
- Static workflow checking exited zero with no diagnostics. This does not mean ShellCheck ran or GitHub executed the workflow.
- Public-readiness audit (local files only, remote inspection disabled): 19 present, 9 partial, 6 absent, 1 unavailable. This is inventory, not a security audit. That pre-publication audit had no commits available for history/email inspection; its empty-history result is not a current claim about the now-published repository, nor an independent verification of published commit identity. Neutral-source/private-path checks, locked dev dependency, ignored output/tools, bilingual entry checker and reproduction were reviewed. Intentionally omitted: license grant, release/tag/npm distribution, screenshots/badges, scheduled Dependabot, security-channel setup, issue/PR templates, code of conduct and multi-platform matrix. They are not prerequisites for this bounded lab, and missing license is not silently replaced with MIT. Windows local plus Ubuntu hosted is not universal support.

## Hosted evidence (observed 2026-10-15)

Read-only observation used GitHub run/job APIs and the saved job logs. All four runs were already completed; no rerun or remote write was performed during observation. These are four runs within the maximum 12-run budget, not four attempts plus hidden retries. A later documentation push will be a separate run and does not change these historical observations.

Published baseline: `2ad546541a54f5edfe4c116b457fd6e149a105a5`. All three PRs used that base. Completion times below are UTC. `success`/`failure`/`skipped` are GitHub conclusions; `pass`/`fail`/`inconclusive` are the core's distinct meanings.

| Case | Observed run / completion | Product / gate | Core result and decisive evidence |
|---|---|---|---|
| Initial main push | [38743569028](https://github.com/cablate/ci-research-lab/actions/runs/38743569028), 13:33:01 | success / success | pass, no reasons; 59 tests and 59 passing, VERIFY_PASSED; testCountVerification=verified |
| Normal [PR #1](https://github.com/cablate/ci-research-lab/pull/1) | [38744180861](https://github.com/cablate/ci-research-lab/actions/runs/38744180861), 13:37:15 | success / success | pass, no reasons; 59 tests and 59 passing, VERIFY_PASSED; gate's platform needs JSON contains executed_tests="59" |
| Numeric-sort regression [PR #2](https://github.com/cablate/ci-research-lab/pull/2) | [38744193868](https://github.com/cablate/ci-research-lab/actions/runs/38744193868), 13:37:19 | failure / failure | Product log contains NUMERIC_ORDER_CONTRACT; core fail with CHECK_FAILED and TEST_COUNT_MISSING; gate exit 1 |
| Required product skipped [PR #3](https://github.com/cablate/ci-research-lab/pull/3) | [38744205997](https://github.com/cablate/ci-research-lab/actions/runs/38744205997), 13:37:08 | skipped / failure | Product has no executed steps; core inconclusive with CHECK_SKIPPED, three EVIDENCE_IDENTITY_MISSING reasons and TEST_COUNT_MISSING; gate exit 2 |

### Execution identity: PR head is not the tested merge commit

| Case | PR head / push SHA | Actual execution revision recorded in that run |
|---|---|---|
| Initial main | `2ad546541a54f5edfe4c116b457fd6e149a105a5` | Product identity and gate verdict: `2ad546541a54f5edfe4c116b457fd6e149a105a5` |
| PR #1 | `c70a26812ec2698366a0791fe9ad3884497d5409` | Product identity and gate verdict: `d021dde6660f12e5cbe893ee4e1caab427c30e89`; product context reports pull_request / refs/pull/1/merge |
| PR #2 | `250145125a39c7f4f4e94289c487017ece50882d` | Product identity and gate verdict: `7379d5e2abf6f5e8177245a907335b21c1f1ca82`; product context reports pull_request / refs/pull/2/merge |
| PR #3 | `a239981dc0d4528165860f9e235626de5f14a7ed` | Gate checkout's git log -1 and verdict: `7aba314ad6fe70961b60bf91ff4f08a5d7e90e50`; checkout fetched refs/remotes/pull/3/merge. **No product execution identity exists**, because product was skipped. |

The run API's head_sha identifies the PR head for these PR runs; it must not be substituted for the observed checkout revision. Similarly, the current PR API is not a historical execution record: at observation, PR #2's merge_commit_sha was `3c2a165b8e667f2d177a5ff1b7c896c0505748ed`, different from the run's recorded `7379d5e...`. This document preserves the run-log identity rather than overwriting it with a later merge-ref value. The reason for regeneration was not investigated and no rerun was requested.

All four gate verdicts recorded contractDigest `acbdb6b08a2ecbf3b8e45bff00e3ae24dbf2326cd39c2b2fa2e58fc7fd08a385`. Their planDigest values differ with revision/event:

| Run | Observed planDigest |
|---|---|
| 38743569028 | `2b4cde50b97a440b4e8db717d3908f4ced8d4441a17a6f314a5b34522f3909ab` |
| 38744180861 | `819d2fb6fac7591aa8644f91d3616aaac1cc0054ace8932f5a19ad552f5cdaff` |
| 38744193868 | `5196e46c3854db5cce874c2446d64b31eca3bb3629ff8809aac27fa30368f776` |
| 38744205997 | `476096344d11e73527f1506b9d5f9dd8b8ffccfc7639412946f98e9a0eee83c7` |

### Structured observed excerpts and source jobs

These excerpts retain decisive JSON fields from the observed logs; omitted fields are not implied absent. Raw run/job logs remain the source, subject to GitHub retention. No private local paths or environment secrets are included.

- Normal PR: [product job 116453356976](https://github.com/cablate/ci-research-lab/actions/runs/38744180861/job/116453356976), [gate job 116453497723](https://github.com/cablate/ci-research-lab/actions/runs/38744180861/job/116453497723).

```json
{
  "needsProduct": { "result": "success", "outputs": { "executed_tests": "59" } },
  "core": { "verdict": "pass", "revision": "d021dde6660f12e5cbe893ee4e1caab427c30e89", "reasons": [], "checks": [{ "id": "product", "status": "satisfied", "testCountVerification": "verified" }] }
}
```

- Regression PR: [product job 116453402181](https://github.com/cablate/ci-research-lab/actions/runs/38744193868/job/116453402181), [gate job 116453533520](https://github.com/cablate/ci-research-lab/actions/runs/38744193868/job/116453533520). NUMERIC_ORDER_CONTRACT appears in the failed test log; missing count does not erase the observed failure.

```json
{
  "verdict": "fail",
  "revision": "7379d5e2abf6f5e8177245a907335b21c1f1ca82",
  "reasons": [
    { "code": "CHECK_FAILED", "status": "fail", "checkId": "product", "detail": "failure" },
    { "code": "TEST_COUNT_MISSING", "status": "inconclusive", "checkId": "product", "detail": "minimum 59" }
  ]
}
```

- Skipped PR: [product job 116453446459](https://github.com/cablate/ci-research-lab/actions/runs/38744205997/job/116453446459), [gate job 116453445703](https://github.com/cablate/ci-research-lab/actions/runs/38744205997/job/116453445703). The core does not diagnose a product defect from this skipped job; it refuses to claim validation.

```json
{
  "verdict": "inconclusive",
  "revision": "7aba314ad6fe70961b60bf91ff4f08a5d7e90e50",
  "reasons": [
    { "code": "EVIDENCE_IDENTITY_MISSING", "status": "inconclusive", "checkId": "product", "detail": "record revision not reported" },
    { "code": "EVIDENCE_IDENTITY_MISSING", "status": "inconclusive", "checkId": "product", "detail": "record contractDigest not reported" },
    { "code": "EVIDENCE_IDENTITY_MISSING", "status": "inconclusive", "checkId": "product", "detail": "record planDigest not reported" },
    { "code": "CHECK_SKIPPED", "status": "inconclusive", "checkId": "product", "detail": "skipped" },
    { "code": "TEST_COUNT_MISSING", "status": "inconclusive", "checkId": "product", "detail": "minimum 59" }
  ]
}
```

Initial push source jobs: [product 116451204668](https://github.com/cablate/ci-research-lab/actions/runs/38743569028/job/116451204668) and [gate 116451350070](https://github.com/cablate/ci-research-lab/actions/runs/38743569028/job/116451350070).

### What this completes, and what it does not

The first research round, bounded core prototype and three real PR comparisons now have observed evidence. The two expected red workflows are successful negative experiments, **not green builds or fixes to be rerun until success**. This does not complete a stronger general-purpose CI product, establish invention priority, prove test sufficiency or validate AI-generated code against all user requirements. The 59 tests cover this explicit sample contract only.

No branch protection or enforced merge prevention was configured or verified. Fork, OIDC, merge queue, environment approvals, concurrency cancellation, whole-workflow cancellation and hosted missing-result scenarios remain unverified; local synthetic inputs for some of them are not hosted proof. The skipped-product observation does not establish those other cases. No deployment, paid service, secret use or production change was performed in this experiment.
## Verified public references

- [checkout v6 full SHA](https://github.com/actions/checkout/commit/d23441a48e516b6c34aea4fa41551a30e30af803): verified official tag resolution and action metadata. Pinning is not an upstream vulnerability audit.
- [setup-node v6 full SHA](https://github.com/actions/setup-node/commit/249970729cb0ef3589644e2896645e5dc5ba9c38): verified similarly; automatic package-manager caching explicitly disabled.
- [Node 22.23.2 official release](https://nodejs.org/download/release/v22.23.2/SHASUMS256.txt): confirms requested release exists; local runtime reports this version.
- [GitHub required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks): conditional job skip can report success; workflow skip can leave Pending. workflow_dispatch job checks do not satisfy PR branch ruleset required checks; always alone does not inspect outcomes.
- [GitHub events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): PR merge ref and head differ; local/manual events cannot stand in for PR evidence.

This experiment makes no priority-of-invention claim for structured evidence, integrity or identity binding, and no superiority claim over existing CI tools. Other systems already address parts of these problems; this round measures only its explicit quality-obligation model on fixed artificial cases and the three bounded real PR scenarios recorded above. A comprehensive competitor comparison is not established here.
