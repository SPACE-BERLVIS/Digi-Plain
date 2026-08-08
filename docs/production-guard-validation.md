# Production guard validation

This smoke-test note verifies the latest `main` merge ref after adding the explicit production `SITE_URL` guard.

CI must pass Astro strict checks, production build, and Cloudflare Worker dry-run without relying on a real production domain.
