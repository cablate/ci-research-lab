# Contributing to the experiment

Use Node.js 22.23.2 and npm 10.9.8. No account, secret, application API, or database is required for local verification.

```sh
npm ci --ignore-scripts
npm run verify
```

Expect 59 passing tests and VERIFY_PASSED. Do not suppress failures: a negative test passes only when its known fault is rejected for the asserted reason. For a product-only edit, run `npm run build` then `node --test test/product.test.mjs`; finish with full verification. `npm test` assumes build output exists.

Sample source is in `src/`; pure ESM core in `core/`; tests in `test/`; CLI/adapter helpers in `tools/`; fixed synthetic comparisons in `fixtures/`. Mutations run in ignored `.lab-tmp/` directories cleaned in finally blocks. Nested test CLIs clear the parent Node test-worker context to execute independently. The core uses no compiled product code or runtime dependency, so a product type error does not prevent gate evaluation. See [core interface](docs/core.md); this remains an experimental prototype, not a finished platform.

English is canonical. Update README and CHANGELOG pairs together and run `npm run check:docs`. The original minimal checker compares heading levels, fenced code, inline code and bullet counts; humans still review translation. Contributor procedures remain English. Never commit private paths, internal instructions, credentials, raw event payloads, dependencies or tool binaries.

## Hosted work and reporting

Follow [bounded procedures](docs/experiments.md). The maintainer publishes branches and performs hosted trials. Report run URL, revision, event, job conclusions and precise diagnostic. Branch-protection enforcement needs separate configuration/testing; it is not established here. Do not merge expected-bad branches or weaken the baseline gate.

## Releasing and licensing

No release, tag, npm publication, license selection, automated update schedule, or repository settings change belongs to this round. The package is private to npm. Future release/license decisions belong to the maintainer. Record changes under Unreleased in both changelogs.

## Support and security

Use GitHub issues for nonsensitive reproduction, Node/npm versions, expected and actual results. There is no established private security channel or response-time guarantee; never post secrets. This lab is not a security product.
