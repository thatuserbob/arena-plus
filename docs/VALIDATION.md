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

## Project checks

- `npm run typecheck`: passed.
- `npm run lint`: passed after fixes, with no remaining lint warnings.
- `npm run build`: passed, producing the Nitro Node server and client assets.
- Build warnings: upstream Nuxt/Nitro duplicate `useAppConfig` auto-import and Vite/Tailwind sourcemap warnings. No compilation errors.
- Node 22.22.2 used for final checks.

No browser layout or hydration pass is claimed. Unit/integration tests were explicitly waived by the user; no automated test suite was created. Vitest setup is deferred.

## Product gaps

Football and NBA keys; free account entitlement verification; complete MotoGP/rugby/tennis feed; OpenF1 adapter; wider NBA history; historical roster pagination; distributed cache/rate budget; approved photography. No permanent free live coverage is claimed.
