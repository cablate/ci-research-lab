# CI Research Lab
[繁體中文](README.zh-TW.md)

An experimental CI-core prototype for developers improving the CI wheel: one contract-to-plan-to-evidence-to-verdict model distinguishes demonstrated failure from missing or invalid evidence. The original lab cases provide comparison controls; this is not a finished product or security boundary.

## Quick start

Local evidence uses Windows, Node.js 22.23.2 and npm 10.9.8. GitHub-hosted Ubuntu also passed the normal main/PR controls; negative PR observations are reported separately below. The workflow requests the same Node version.

```sh
npm ci --ignore-scripts
npm run verify
npm run context
```

Expect 59 tests passing, zero failures, and this final line. Negative cases pass only when the intended fault is detected; a failing outer verification is a real problem, not an expected red run.

```text
VERIFY_PASSED: build + bilingual docs + tests
```

Local context reports NOT_PR_EVENT_EVIDENCE. Synthetic or manual runs cannot substitute for real PR-event evidence. See [procedures and evidence](docs/experiments.md).

## Accepted scope and design

- A private-to-npm TypeScript sample sorts unique finite numbers without mutating input; no runtime dependencies or external API.
- One verification entry builds, checks bilingual structure, and runs product plus CI-policy tests using Node's native test runner.
- Isolated bad cases cover runtime mutation, type error, swallowed exit, zero tests, skipped/missing/cancelled required results, path selection, and local versus PR context.
- Classification is shadow-only: documentation-only suggestions do not skip the actual product job; unknown input selects product checks.
- Product verification and the always-running result gate are separate. The gate actually inspects required outcomes. This does not configure branch protection or prove enforced merge prevention.
- Standard Ubuntu only; read-only contents and SHA-pinned actions; no secrets, deployments, paid services, self-hosting, schedule, external fork, OIDC or merge queue in this round.

The zero-runtime-dependency core now creates all-required plans from a strict versioned contract, binds evidence to revision/contract/plan digests, and explains pass/fail/inconclusive/invalid with stable reason codes. The GitHub gate uses this same core. Local legacy policies remain comparison controls, not a second hosted gate. [Core API and CLI](docs/core.md) describes the supported subset; [contributing](CONTRIBUTING.md) explains reproduction; [changes](CHANGELOG.md) are unreleased.

## Read-only core CLI

These fixtures contain synthetic revisions, not authenticated execution evidence. The first two commands exit zero. The last exits 2 with REQUIRED_EVIDENCE_MISSING: this is an expected inconclusive comparison, not a crash. Evaluation independently rebuilds the plan from contract and expected context. The CLI only reads JSON and prints results; it executes no checks.

```sh
node tools/ci.mjs plan fixtures/contract.json fixtures/context.json
node tools/ci.mjs evaluate fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-good.json
node tools/ci.mjs explain fixtures/contract.json fixtures/context.json fixtures/plan.json fixtures/evidence-missing.json
```

## Current status and next action

The published baseline is `2ad546541a54f5edfe4c116b457fd6e149a105a5`. Windows local build/59 tests and static workflow checks passed. Four bounded hosted runs were observed: [main push](https://github.com/cablate/ci-research-lab/actions/runs/38743569028) and [normal PR](https://github.com/cablate/ci-research-lab/actions/runs/38744180861) passed with 59 tests; the [product-regression PR](https://github.com/cablate/ci-research-lab/actions/runs/38744193868) produced fail/CHECK_FAILED, while the [skipped-product PR](https://github.com/cablate/ci-research-lab/actions/runs/38744205997) produced inconclusive/CHECK_SKIPPED. Both negative gates exited nonzero, for different reasons. The normal PR tested its merge commit, not its distinct head commit. Exact revisions, diagnostics and limits are in [evidence](docs/experiments.md).

This demonstrates the coherent contract-to-plan-to-evidence-to-verdict core on these controls, not that arbitrary CI or product quality is solved. CLI and GitHub adapter use one decision model rather than independent CLI wrappers. Next action: review this bounded evidence and agree on a representative real-project contract before broader validation; no wider integration is implied. The maintainer owns scope, evidence status and next action here.

## Limits, data and removal

The runner checks named baseline markers, nonempty discovery and nonzero passing count, not every possible missing test or specification flaw. The hosted contract currently requires at least 59 executed passing tests; an unconfigured minimum is explicitly not quantity-verified. Digests are fingerprints, not signatures or proof against forged reports. Cancelled/missing inputs are locally simulated; whole-workflow cancellation may stop the gate too. Bilingual checks cover structure/code, not translation. No quantified time or cost saving is claimed.

Installation downloads locked TypeScript and can submit dependency audit metadata to the public npm registry. Verification reads local source, writes ignored build/temporary fixture directories, and cleans individual fixtures; it sends no test data to application APIs. GitHub downloads tooling and retains logs under platform policy, potentially consuming account quota. Stop by not invoking commands/workflows; remove the checkout to remove local files. No background service is installed.

## Maintenance and rights

No release/tag/npm publication or open-source license grant is included. Public visibility is not permission to redistribute under MIT or another license. Report nonsensitive reproduction through [issues](https://github.com/cablate/ci-research-lab/issues); do not post credentials or private data. See [contributing](CONTRIBUTING.md) for limitations and maintenance procedures.
