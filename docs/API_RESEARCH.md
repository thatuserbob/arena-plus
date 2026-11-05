# API research

Verified 6 November 2026 (Africa/Nairobi). Official documentation and representative public HTTP responses were inspected. Shell DNS is restricted in the build environment; successful probes used the browser tool's HTTP client. No credentials were supplied. Documentation verification is distinct from end-to-end application verification.

Legend: **V** verified in official documentation; **R** representative real response inspected; **U** unverified; **P** paid-only; **—** unsupported by this integration. A successful sample does not prove complete historical coverage.

| Provider | Free/key | Sports | History/results | Standings | Fixtures | Free live | Quota |
|---|---|---|---|---|---|---|---|
| Jolpica | V: public, no key | F1 | R: season discovery, calendar, classifications | R: drivers | R | — | V: 4/sec; 500/hour |
| football-data.org | V: registration key | Football, 12 free competitions | V: current results; historical entitlement U | V | V: delayed | P | V: 10/min |
| TheSportsDB v1 | V: public key `123` | Multi-sport catalog; actual accessible breadth restricted | R: partial football archive | V: limited featured football tables | V: limited | P: v2 | V: 30/min |
| BALLDONTLIE | V: free account/key | NBA (other sports have separate plans) | V: games; claims 1946–current | P | V: games | U: free games latency; live box scores P | V: 5/min |
| OpenF1 | V: history without key | F1 sessions | V: 2023 onward; R: session | V: championship endpoints beta; historical completeness U | V: sessions updated daily | P | U: no numeric limit established from reviewed docs |
| Sportradar | V: registration, temporary trial | MotoGP, tennis, rugby | V: historical APIs; exact coverage U | V by package | V | Tennis/rugby trial coverage varies; MotoGP post-event only | V: default trial 1 QPS, 1,000 requests/30 days |

## Provider findings and official references

### Jolpica

[API documentation](https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md), [rate limits](https://github.com/jolpica/jolpica-f1/blob/main/docs/rate_limits.md), [seasons](https://github.com/jolpica/jolpica-f1/blob/main/docs/endpoints/seasons.md), [terms](https://github.com/jolpica/jolpica-f1/blob/main/TERMS.md).

Base: `https://api.jolpi.ca/ergast/f1/`. Use `seasons.json`, `{year}.json`, `{year}/results/1.json`, `{year}/{round}/results.json`, `{year}/driverstandings.json`, `{year}/constructors.json`, `{year}/drivers.json`. Maximum page size 100; send an identifying User-Agent. No live timing or documented exact result-publication latency. Data is CC BY-NC-SA 4.0; attribution and share-alike apply. Commercial permission requires contacting admin@jolpi.ca. The repository's Apache software license is not the data license.

### football-data.org

[Pricing](https://www.football-data.org/pricing), [coverage](https://www.football-data.org/coverage), [v4 documentation](https://docs.football-data.org/general/v4/index.html).

Free coverage includes Champions League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Primeira Liga, Eredivisie, Championship, Brazil Serie A, World Cup and European Championship. Use `/v4/competitions`, `/competitions/{id}`, and `/matches`, `/standings`, `/teams` subresources with `season` start-year. Authenticate using `X-Auth-Token`. Free data is delayed; no exact delay verified. The confusingly named “Free w/ Livescores” plan is paid. Free historical depth and squad entitlements were not verified; this app exposes only returned current season. Registration is needed for authenticated verification. Attribution is displayed; exact attribution wording and commercial terms remain U because terms pages could not be retrieved.

### TheSportsDB

[Official guide](https://www.thesportsdb.com/docs_api_guide).

Use v1 `/123/all_leagues.php`, `search_all_seasons.php?id=`, `eventsseason.php?id=&s=`. Free limits include 15 season events, 5 table entries and restricted search (team search limited to Arsenal). Public league discovery returned ten football leagues; season discovery returned five early Premier League seasons. Multi-sport completeness, historical depth, and latency are not guaranteed. Do not treat catalog breadth as usable free coverage. V2/live scores require premium access. Fan artwork is not an independent photography license: none is used. Attribution is shown; commercial and redistribution terms remain U pending provider confirmation.

### BALLDONTLIE

[Official NBA documentation](https://docs.balldontlie.io/).

Use `/v1/games?seasons[]=YEAR&per_page=100&cursor=CURSOR`, `/v1/teams`, `/v1/players`. Authenticate with `Authorization: KEY`. Free teams, players and games are distinct from paid standings, statistics, and live box scores. Historical completeness varies; the advertised 1946–current range is not a per-field guarantee. No season-list endpoint was established; the app probes three recent years for real games before offering them. Exact free score latency, attribution requirements and commercial restrictions remain U; registration/terms acceptance must resolve these. A seven-day paid-feature trial is not permanent free access.

### OpenF1

[Official documentation](https://openf1.org/docs/).

Endpoints include `/v1/sessions`, `/meetings`, `/session_result`, `/drivers`, `/drivers_championship`, `/teams_championship`. Free historical data starts in 2023. Real-time access requires a paid subscription. Session metadata refreshes daily at midnight UTC, not continuously; this is not a score-latency guarantee. Numeric quota, redistribution license and commercial permission remain U from reviewed documentation. Evaluated but not registered as an application adapter: Jolpica is the selected race archive source, avoiding accidental mixing of identifiers and result semantics.

### Other legitimate MotoGP, rugby and tennis options

Sportradar documents [MotoGP](https://developer.sportradar.com/racing/reference/motogp-overview), [MotoGP update limitations](https://developer.sportradar.com/racing/reference/motogp-faq), [tennis](https://developer.sportradar.com/tennis/reference/overview), [rugby](https://developer.sportradar.com/rugby/reference/rugby-overview), and [account/trial terms](https://developer.sportradar.com/getting-started/docs/your-account).

MotoGP offers seasons and stage summaries including Moto2/Moto3; updates are post-event. Tennis and rugby have competition/season discovery and results. Their competition-season endpoints describe a maximum of three seasons. All need authentication; production access is for customers. The 30-day trial ends, so it is unsuitable as the permanent free foundation. Exact competition entitlements, commercial contract, and attribution requirements need account review. No unofficial MotoGP, ATP/WTA or private scoring endpoints are used. A permanent, documented, complete free feed for these three sports was not established.

## Representative endpoint probes

All successful rows below were HTTP 200 through the browser request tool on the verification date.

| Endpoint | Observed result |
|---|---|
| Jolpica `/seasons.json?limit=100` | 77 seasons, 1950–2026 |
| Jolpica `/2024/1/results.json` | 20 classification entries, Bahrain Grand Prix |
| Jolpica `/2026.json?limit=100` | 23 calendar rounds |
| Jolpica `/2026/results/1.json?limit=100` | 19 race winners |
| Jolpica `/2024/driverstandings.json?limit=100` | 24 drivers |
| TheSportsDB `/123/all_leagues.php` | 10 football leagues |
| TheSportsDB `/123/search_all_seasons.php?id=4328` | 1992–1993 through 1996–1997, 5 entries |
| TheSportsDB `/123/eventsseason.php?id=4328&s=2024-2025` | 15 real events; partial season |
| OpenF1 `/v1/sessions?session_key=9158` | 2023 Singapore Practice 1 |

The 2024–2025 SportsDB probe demonstrates event availability beyond its truncated season catalog; the UI intentionally does not advertise that season without discovery. football-data.org and BALLDONTLIE authenticated endpoints remain untested without keys. No live latency was measured. Runtime access from the user's deployment must be verified separately.
