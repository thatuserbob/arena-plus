# Arena+ data coverage

This is an integration foundation, not a complete six-sport live service. No sample sports results ship in the app. The source must respond at runtime.

| Arena | Implementation | Available seasons | Gaps |
|---|---|---|---|
| Formula 1 | Jolpica calendars, winners, full race classification, driver standings, constructors, drivers | Discovered dynamically; probe returned 1950–2026 | No live timing, qualifying/sprints UI, constructor standings UI |
| Football | football-data fixtures/results/tables/teams with key; selectable TheSportsDB partial archive without registration | football-data current season only pending history entitlement; SportsDB discovered seasons only | Credentials absent; free scores delayed; SportsDB truncation |
| Basketball | BALLDONTLIE paginated games and teams with key | Only three recent candidate start-years, each confirmed by a real games query before display | No complete historical discovery, paid standings/live box scores, no key supplied |
| MotoGP | SportsDB catalog/season/event adapter and sport page | Only actual returned seasons | Public catalog probe returned no MotoGP competition; no race classifications or standings |
| Rugby | SportsDB catalog/season/event adapter and sport page | Only actual returned seasons | Public catalog probe returned no rugby competition; no rankings |
| Tennis | SportsDB catalog/season/event adapter and sport page | Only actual returned seasons | Public catalog probe returned no tennis competition; no ATP/WTA/Grand Slam completeness or set results |

Jolpica's 77 returned seasons do not guarantee every field for every year. Maximum page size is 100: modern per-race classifications and seasonal calendar fit, but historical driver listings may exceed this; roster service pagination is a follow-up. Championship standings are season standings, not standings reconstructed at each selected race.

TheSportsDB Premier League season discovery returned 1992–1993 through 1996–1997. A direct 2024–2025 event probe returned 15 events, but that season is not selectable because discovery did not advertise it. This deliberately favors honest availability over guessed season ranges. Missing data can reflect catalog restrictions rather than absence of events.

No integrated provider is represented as free LIVE coverage. Manual refresh honors server caching; an update button does not guarantee a newly published upstream score. Provider-sourced live football statuses are labeled DELAYED; other unconfirmed in-progress states remain unknown.

## Next coverage work

Obtain football-data and BALLDONTLIE free keys, verify actual account entitlements, and check current/historical responses. Verify a licensed wider catalog for MotoGP/rugby/tennis before enabling claims of coverage. Expand NBA history via explicit, cached existence checks, not invented season choices. Implement shared quota storage before public multi-instance deployment.
