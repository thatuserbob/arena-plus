# Arena+ — Beyond the Score

> **Dev hackathon project.** Arena+ was built during a developer hackathon. It is a working prototype, not a production service. Expect rough edges, partial data coverage for some sports, and no automated test suite yet.

A Nuxt 4 sports-data app with a cinematic homepage and six sport routes. It uses real provider adapters, states coverage explicitly, and never fabricates sports results.

## Quick start

### Prerequisites

- **Node.js 22 LTS (22.22.3 or newer; 24.15+ also works).** `.nvmrc` pins `22.23.4`. Nuxt 4.6 requires `^22.22.3 || ^24.15.0 || >=26.0.0`. Node 20 is not supported: several dependencies require Node 22, and `.npmrc` sets `engine-strict=true`, so npm refuses to install on an older Node.
- **npm 10 or 11.** npm 10 ships with Node 22. The lockfile is generated with npm 10 and also works with npm 11.
- A C toolchain is **not** required. All native dependencies use prebuilt binaries.

### Setup

```sh
git clone <repo-url> arena-plus
cd arena-plus

# Use the pinned Node version (installs it first if missing)
nvm install
nvm use

# Clean, reproducible install from package-lock.json
npm ci

# Environment variables (all optional, see "Provider setup")
cp .env.example .env

# Start the dev server
npm run dev
```

Open the local URL Nuxt prints (usually http://localhost:3000).

Without nvm, install Node 22 any other way (fnm, Volta, asdf, official installer) and check it with `node -v`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run typecheck` | Strict TypeScript check (`nuxt typecheck`) |
| `npm run lint` | ESLint |
| `npm run build` | Production build into `.output/` |
| `npm run preview` | Preview the production build |
| `node .output/server/index.mjs` | Run the production server directly |

`npm ci` runs `nuxt prepare` automatically after install (`postinstall`) to generate types in `.nuxt/`.

## Troubleshooting install

| Symptom | Cause | Fix |
| --- | --- | --- |
| `npm error code EBADENGINE` … `Required: {"node":"^22.22.3 || ^24.15.0 || >=26.0.0"}` | Shell is on Node 20, or Node 22 older than 22.22.3 | `nvm use` (or `nvm alias default 22` to make it permanent), then `npm ci` again |
| `npm ci can only install packages when your package.json and package-lock.json … are in sync` | Lockfile was edited with a different npm version, or `package.json` changed without the lockfile | On Node 22, run `npm install`, commit the updated `package-lock.json`, then `npm ci` |
| `sh: 1: nuxt: not found` during `postinstall` | An earlier install step failed and `node_modules` is incomplete | Fix the first error in the log, then `rm -rf node_modules && npm ci` |
| `gyp ERR!` while building `@parcel/watcher` | The prebuilt binary failed to extract, often because the disk or a quota is full (`TAR_ENTRY_ERROR … -122`) | Free disk space, then `npm ci` again |

When you change dependencies, use Node 22 (`nvm use`) so the lockfile stays compatible with the npm 10 that ships with it.

## Provider setup

All keys are optional. Missing credentials show an explicit setup state in the UI instead of failing.

| Provider | Variable | Notes |
| --- | --- | --- |
| Jolpica (F1) | none | F1 seasons, calendars, winners, race results, driver standings. Non-commercial CC BY-NC-SA 4.0 data; contact the provider before commercial use. |
| football-data.org | `NUXT_FOOTBALL_DATA_KEY` | Free account. Scores and schedules are delayed. The UI shows the current season only until historical entitlements are verified. |
| BALLDONTLIE (NBA) | `NUXT_BALLDONTLIE_KEY` | Free account. Games and teams are free; standings and live box scores are paid. Three recent seasons are probed before one is selected. |
| TheSportsDB | `NUXT_SPORTSDB_KEY` | `123` is the public documented development key. Responses are heavily capped, and the public catalog may not return every sport. |

Keys stay server-side. Do not commit `.env`. The server needs outbound access to the provider hosts; browser connectivity alone does not prove deployment connectivity.

## What's included

Nuxt SSR, strict TypeScript, Tailwind 4, GSAP/ScrollTrigger, normalized sport-specific types, Zod validation of upstream data, an optional-method provider contract, a capability registry, a bounded cache, request deduplication, quota budgets, Retry-After handling, UTC dates, honest freshness labels, historical season selection, responsive and accessible UI, provider attribution and SEO metadata.

**Routes:** `/`, `/sports/football`, `/sports/formula-1`, `/sports/motogp`, `/sports/basketball`, `/sports/rugby`, `/sports/tennis`.

**API endpoints:** `/api/data/{sports,capabilities,competitions,seasons,events,event,standings,teams,athletes}` and `/api/home`.

## Scope and limitations

- F1 is the primary complete browsing workflow.
- Football and NBA adapters need keys and account validation.
- MotoGP, rugby and tennis pages show restricted catalog availability, not guaranteed coverage.
- OpenF1 was researched and probed but is not an active adapter. No free live feed is claimed.
- No licensed photography or editorial articles were available, so the app uses original graphic placeholders and archive-oriented copy.
- Caching is in-process: 24h for discovery and older history, 5 min for current and recent events. Run one instance; shared quotas and cache are needed before scaling. No automatic polling.
- No unit or integration tests yet (Vitest setup is deferred). Validation notes are in [`docs/VALIDATION.md`](docs/VALIDATION.md).

## Docs

- [API research and probe evidence](docs/API_RESEARCH.md)
- [Architecture and adding providers](docs/ARCHITECTURE.md)
- [Data coverage and gaps](docs/DATA_COVERAGE.md)
- [Design system and assets](docs/DESIGN_SYSTEM.md)
- [Validation checkpoint](docs/VALIDATION.md)
