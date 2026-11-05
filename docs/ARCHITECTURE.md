# Architecture

Nuxt 4 SSR, Vue Composition API, strict TypeScript, Tailwind 4 Vite plugin, Zod provider boundaries and Nitro. No Pinia or WebSockets. `useState` stores a per-SSR-request hydrated provider preference; `useFetch` discovers data sources/competitions; `useAsyncData` loads dependent seasons and events.

## Data flow

Vue → same-origin Nitro `/api/data/:operation` → capability registry → one adapter → quota/cache/transport → documented upstream API. UI components consume `shared/sports.ts`, never raw API schemas. URLs are fixed by adapters; validated query parameters cannot choose an arbitrary host. Keys stay in private runtime config. Errors never include upstream URLs or tokens.

Operations: `sports`, `capabilities`, `competitions`, `seasons`, `events`, `event`, `standings`, `teams`, `athletes`. Unsupported operations return 422; invalid competition/season 400; credential problems 503; upstream/schema failures 502; budget/429 failures 429 with Retry-After. The centralized handler avoids duplicating validation across resource directories.

Example: `/api/data/events?sport=formula-1&provider=jolpica&competition=jolpica:f1&season=2024`.

## Selection and provenance

Defaults: Jolpica/F1, football-data/football, BALLDONTLIE/NBA, TheSportsDB/remaining sports. A user can explicitly select TheSportsDB for football/NBA. Failure never silently changes providers. Discovery validates competition and season against the selected source before event access. Quota exhaustion fails with a retry hint; it does not switch to a conflicting provider. No cross-provider ID matching is implemented.

Every event includes namespaced internal/source IDs, sport, competition, season, date, nullable UTC instant, status, participants, score, retrieval timestamp and freshness. `null` start time preserves genuinely unknown times instead of inventing midnight. Date-only historical races retain their date. Motorsport classifications, tennis sets and team scores are distinct. Missing tennis/motorcycle classifications are not coerced into team scores.

F1 calendars and winner rows from the SAME provider are joined by season/round. Winner-only classifications are marked; full classifications are fetched per race. A past start time never implies live or final. football-data explicit IN_PLAY/PAUSED status is shown as DELAYED, because its free feed is delayed. NBA final scores require explicit Final status. Freshness timestamp is retrieval time, not an invented source update.

## Cache and request budgets

One bounded, process-local server cache (400 entries) and in-flight promise map deduplicate identical requests across clients in one worker. Discovery caches 24h; events more than one calendar year behind current year cache 24h; current/recent seasons cache 5min. Cache values preserve original retrieval timestamps. Invalid responses and failed calls are not cached. Manual refresh reuses valid cache entries and cannot bypass quotas.

Conservative local budgets: Jolpica 450/hour and 3/sec; football-data 9/min; TheSportsDB 25/min; BALLDONTLIE 4/min. Upstream 429 creates provider-wide cooldown, honoring numeric/date Retry-After with a 60s minimum. Fetch timeout is 12s. No automatic retries or polling amplification. UI shows last fetched timestamps; no stale data is relabeled live.

Limitations: cache is volatile, not distributed; processes sharing a provider key/IP can collectively exceed quotas. Before scaling, move cache, locks and counters to shared Redis/Nitro storage with atomic budget operations. Add bounded stale-on-error support with explicit stale metadata. Do not deploy many independent replicas against a shared free key using these local counters alone.

## SSR and interaction

Initial page content, competitions, and discovered season/events are SSR-rendered when available. Payload hydration avoids re-fetching the initial result. Dependent requests use selection generations to reject late season responses. Changing sport remounts the browser. GSAP/ScrollTrigger imports happen only on mount, honor reduced motion, and revert on unmount. Content does not depend on animation to become visible. Filters and details use native accessible controls.

## Adding a provider

1. Verify official endpoints, free entitlements, history, quotas and data license; update API_RESEARCH.
2. Implement optional `Provider` methods and exact capabilities under `providers/`.
3. Validate responses with Zod; normalize namespaced IDs, unknown timestamps, scoring and provenance.
4. Register the adapter and explicit UI choice. Add a private runtime key if needed.
5. Support pagination or expose partial coverage; do not promise complete seasons from capped endpoints.
6. Verify real representative responses and update DATA_COVERAGE. Add tests when testing work is resumed.

OpenF1 is documented as a candidate, not an active fallback. Athlete and team service operations are available where declared; dedicated roster/profile UI is not yet built.
