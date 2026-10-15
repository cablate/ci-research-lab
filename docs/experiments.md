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
- The original clean installation/full verification passed 28 tests. The current core's clean `npm ci --ignore-scripts` then `npm run verify` passed 59 tests, zero failures/skips/cancellations and VERIFY_PASSED. Current workflow static checking exited zero. The CLI complete case returned pass/exit 0 and the missing case returned inconclusive/exit 2 with REQUIRED_EVIDENCE_MISSING; all four status/exit combinations are also asserted in the core suite. `npm run context` reports local and NOT_PR_EVENT_EVIDENCE. The maintainer records the published revision after commit creation; no commit exists yet at this handoff.
- Direct zero-test CLI baseline: `node tools/test.mjs .lab-tmp/cli-empty` on the created empty directory exited 1 with ZERO_TEST_FILES. Core CLI controls assert structured pass/fail/inconclusive/invalid with exact exits 0/1/2/3 and reasons; read-only commands are in [core docs](core.md). Earlier baseline-only gate labels are superseded by the shared core and are not current hosted evidence.
- actionlint v1.7.12 Windows amd64 from [official release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12). Archive SHA256 `6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9` matched official checksums before extraction. Ignored binary under `.tools/`, not distributed. Command: `.tools/actionlint/actionlint.exe .github/workflows/check.yml`. This is static checking, not hosted evidence. Optional ShellCheck/pyflakes were not installed.
- Static workflow checking exited zero with no diagnostics. This does not mean ShellCheck ran or GitHub executed the workflow.
- Public-readiness audit (local files only, remote inspection disabled): 19 present, 9 partial, 6 absent, 1 unavailable. This is inventory, not a security audit. History is empty, so an email/history check has no commits to establish provenance; the maintainer must review the first commit's identity before publication. Neutral-source/private-path checks, locked dev dependency, ignored output/tools, bilingual entry checker and reproduction were reviewed. Intentionally omitted: license grant, release/tag/npm distribution, screenshots/badges, scheduled Dependabot, security-channel setup, issue/PR templates, code of conduct and multi-platform matrix. They are not prerequisites for this bounded lab, and missing license is not silently replaced with MIT. Windows local plus Ubuntu hosted is not universal support.

## Hosted evidence (pending maintainer observation)

| Case | Run URL / tested revision | Observed event and job results | Status |
|---|---|---|---|
| Initial main | Not recorded | Not observed | Pending |
| Normal PR | Not recorded | Not observed | Pending |
| Product failure PR | Not recorded | Not observed | Pending |
| Product skipped PR | Not recorded | Not observed | Pending |

## Verified public references

- [checkout v6 full SHA](https://github.com/actions/checkout/commit/d23441a48e516b6c34aea4fa41551a30e30af803): verified official tag resolution and action metadata. Pinning is not an upstream vulnerability audit.
- [setup-node v6 full SHA](https://github.com/actions/setup-node/commit/249970729cb0ef3589644e2896645e5dc5ba9c38): verified similarly; automatic package-manager caching explicitly disabled.
- [Node 22.23.2 official release](https://nodejs.org/download/release/v22.23.2/SHASUMS256.txt): confirms requested release exists; local runtime reports this version.
- [GitHub required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks): conditional job skip can report success; workflow skip can leave Pending. workflow_dispatch job checks do not satisfy PR branch ruleset required checks; always alone does not inspect outcomes.
- [GitHub events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): PR merge ref and head differ; local/manual events cannot stand in for PR evidence.

This experiment makes no priority-of-invention claim for structured evidence, integrity or identity binding, and no superiority claim over existing CI tools. Other systems already address parts of these problems; this round measures only its explicit quality-obligation model on fixed artificial cases and, once observed, the bounded real PR scenarios. A comprehensive competitor comparison is not established here.
