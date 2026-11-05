# Validation checkpoint

Last checkpoint: 6 November 2026. Work is saved in `/home/bob/dev/arena-plus`.

## Completed implementation

- Nuxt 4 SSR project, Tailwind 4, strict TypeScript configuration and ESLint tooling.
- Cinematic homepage, six sport pages, responsive design, accessibility and motion handling.
- Shared normalized types; Jolpica, football-data, BALLDONTLIE and TheSportsDB adapters.
- Capability resolution, discovery-validated seasons, caching, request deduplication, quota budgets and safe error mapping.
- API research, source citations, coverage matrix, architecture, design and setup documentation.

## External verification

Browser HTTP probes succeeded for Jolpica discovery (1950–2026), 2024 Bahrain results, 2026 calendar/winners, 2024 driver standings; TheSportsDB league/season discovery and 2024–2025 Premier League events; OpenF1 2023 Singapore Practice 1. Counts and URLs are in API_RESEARCH. Authenticated football-data and BALLDONTLIE requests are not verified without credentials.

## Environment limitations encountered

Shell DNS cannot resolve registry/provider hosts. The browser tool can access public URLs and supplied missing npm archives from the official registry. The shell also rejects socket binding, preventing local HTTP preview. An npm install script encountered EPERM spawning esbuild, even though the binary printed its version. Installation completed with scripts disabled; explicit Nuxt preparation and production compilation then succeeded. The lockfile uses registry URLs, with no temporary local package paths.

Lockfile follow-up (6 November 2026): the original lockfile was written by npm 11. npm 10, which ships with Node 22.22.2, rejected it in `npm ci` (`Missing: @emnapi/core@1.11.3 from lock file`, plus `@emnapi/runtime`, `cac` and `commander`). The lockfile was regenerated with npm 10 on Node 22.22.2. No resolved dependency versions changed; only missing nested entries were added and npm-11-only `"peer": true` flags were dropped. Verified: `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build` pass on Node 22.22.2 / npm 10.9.7, and `npm ci --dry-run` passes on Node 24.15.0 / npm 11.12.1. `.npmrc` now sets `engine-strict=true`, so Node 20 fails fast with `EBADENGINE`.

Security follow-up (6 November 2026): `npm audit` reported 45 vulnerabilities (6 critical, 12 high). Direct pins bumped: `nuxt` 4.4.2 to 4.6.4, `vue` 3.5.32 to 3.5.45, `vue-router` 5.0.4 to 5.4.0, `zod` 4.1.13 to 4.6.7, `@nuxt/eslint` 1.15.2 to 1.17.0, `tailwindcss` and `@tailwindcss/vite` 4.3.3 to 4.3.4, `vue-tsc` 3.2.6 to 3.3.14. Transitive fixes via `npm audit fix`, plus an override forcing `glob` 14.0.3 under `@vercel/nft`. Nuxt 4.6 requires Node `^22.22.3`, so `.nvmrc` moved to 22.23.4 and `engines.node` now matches Nuxt. Lockfile regenerated with npm 10.9.9. Remaining: 22 audit entries (6 low, 16 moderate), all from two advisories with no compatible fix. `minimatch` <11.0.1 (ReDoS, build and lint tooling only; forcing 11.x breaks `eslint-plugin-import-x`, which imports `makeRe`) and `deepmerge` <=4.3.1 (no patched release). Verified: `npm ci`, `npm run lint`, `npm run typecheck` and `npm run build` pass on Node 22.23.4 / npm 10.9.9; `npm ci --dry-run` passes on Node 24.15.0 / npm 11.

## Project checks

- `npm run typecheck`: passed.
- `npm run lint`: passed after fixes, with no remaining lint warnings.
- `npm run build`: passed, producing the Nitro Node server and client assets.
- Build warnings: upstream Nuxt/Nitro duplicate `useAppConfig` auto-import and Vite/Tailwind sourcemap warnings. No compilation errors.
- Node 22.23.4 used for final checks.

No browser layout or hydration pass is claimed. Unit/integration tests were explicitly waived by the user; no automated test suite was created. Vitest setup is deferred.

## Product gaps

Football and NBA keys; free account entitlement verification; complete MotoGP/rugby/tennis feed; OpenF1 adapter; wider NBA history; historical roster pagination; distributed cache/rate budget; approved photography. No permanent free live coverage is claimed.
