# Build validation

This file exists to give the publisher integration a repeatable pull-request CI smoke test.

The repository's pull-request workflow must pass `npm run check` and `npm run build` before changes are considered build-verified.

The smoke-test branch is intentionally documentation-only; the PR merge ref still compiles the latest `main` plus this note.

The validation also bundles the Cloudflare Worker with Wrangler dry-run after Astro succeeds.
