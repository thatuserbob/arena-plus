import { z } from 'zod'
import {
  season,
  type Competition,
  type Event,
  type EventStatus,
  type Provider,
  type SportId,
} from '#shared/sports'
import { client, ttlFor } from '../transport'
const league = z.object({
  idLeague: z.string(),
  strLeague: z.string(),
  strSport: z.string(),
})
const names: Partial<Record<SportId, string[]>> = {
  football: ['Soccer'],
  basketball: ['Basketball'],
  rugby: ['Rugby', 'Rugby Union', 'Rugby League'],
  tennis: ['Tennis'],
  motogp: ['Motorsport'],
}
const optionalScore = z.preprocess(
  (value) => value === '' || value == null ? null : value,
  z.coerce.number().int().nonnegative().nullable(),
)
export const dbEvent = z.object({
  idEvent: z.string(),
  idLeague: z.string(),
  strEvent: z.string(),
  strSeason: z.string(),
  dateEvent: z.iso.date().nullable(),
  strTimestamp: z.string().nullable().optional(),
  strStatus: z.string().nullable().optional(),
  strHomeTeam: z.string().nullable(),
  strAwayTeam: z.string().nullable(),
  idHomeTeam: z.string().nullable(),
  idAwayTeam: z.string().nullable(),
  intHomeScore: optionalScore,
  intAwayScore: optionalScore,
})
export function normalizeDB(
  raw: z.infer<typeof dbEvent>,
  c: Competition,
  fetchedAt = new Date().toISOString(),
): Event {
  const status: EventStatus =
    (
      {
        'Match Finished': 'completed',
        FT: 'completed',
        'Not Started': 'scheduled',
        NS: 'scheduled',
        Postponed: 'postponed',
        Cancelled: 'cancelled',
      } as Record<string, EventStatus>
    )[raw.strStatus ?? ''] ?? 'unknown'
  const validTime =
    raw.strTimestamp &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(raw.strTimestamp) &&
    Number.isFinite(Date.parse(raw.strTimestamp))
  const common = {
    id: `thesportsdb:${raw.idEvent}`,
    sourceId: raw.idEvent,
    providerId: 'thesportsdb' as const,
    competition: c,
    season: season(raw.strSeason),
    name: raw.strEvent,
    startTime: validTime ? new Date(raw.strTimestamp!).toISOString() : null,
    startDate: raw.dateEvent ?? '',
    status,
    participants: [
      { id: raw.idHomeTeam, name: raw.strHomeTeam },
      { id: raw.idAwayTeam, name: raw.strAwayTeam },
    ]
      .filter((t) => t.id && t.name)
      .map((t) => ({
        id: `thesportsdb:${t.id}`,
        name: t.name!,
        providerId: 'thesportsdb' as const,
      })),
    lastUpdated: fetchedAt,
    freshness: {
      kind:
        status === 'completed' ? ('historical' as const) : ('unknown' as const),
      fetchedAt,
      sourceUpdatedAt: null,
      latencySeconds: null,
      stale: false,
    },
  }
  if (c.sport === 'football')
    return {
      ...common,
      sport: c.sport,
      score: { kind: 'goals', home: raw.intHomeScore, away: raw.intAwayScore },
    }
  if (c.sport === 'rugby' || c.sport === 'basketball')
    return {
      ...common,
      sport: c.sport,
      score: { kind: 'points', home: raw.intHomeScore, away: raw.intAwayScore },
    }
  return { ...common, sport: c.sport, score: null }
}
export function sportsDB(key: string): Provider {
  const base = `https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key || '123')}/`
  return {
    capabilities: {
      id: 'thesportsdb',
      sports: ['football', 'basketball', 'motogp', 'rugby', 'tennis'],
      operations: ['competitions', 'seasons', 'events'],
      requiresKey: false,
      live: false,
      partial: true,
      note: 'Limited community archive: at most 15 events per season on the free tier. Discovery and season lists may be truncated. No live feed or guaranteed rankings.',
    },
    async getCompetitions(sport) {
      return client
        .get(
          'thesportsdb',
          `${base}all_leagues.php`,
          (raw) =>
            z.object({ leagues: z.array(league).nullable() }).parse(raw)
              .leagues ?? [],
          86_400_000,
        )
        .then((items) =>
          items
            .filter(
              (c) =>
                names[sport]?.includes(c.strSport) &&
                (sport !== 'motogp' || /motogp/i.test(c.strLeague)),
            )
            .map((c) => ({
              id: `thesportsdb:${c.idLeague}`,
              sourceId: c.idLeague,
              name: c.strLeague,
              sport,
              providerId: 'thesportsdb',
            })),
        )
    },
    async getSeasons(c) {
      return client.get(
        'thesportsdb',
        `${base}search_all_seasons.php?id=${c.sourceId}`,
        (raw) =>
          (
            z
              .object({
                seasons: z
                  .array(z.object({ strSeason: z.string() }))
                  .nullable(),
              })
              .parse(raw).seasons ?? []
          )
            .filter((s) => /^\d{4}(?:-\d{4})?$/.test(s.strSeason))
            .map((s) => season(s.strSeason))
            .sort((a, b) => b.startYear - a.startYear),
        86_400_000,
      )
    },
    async getEvents({ competition: c, season: s }) {
      return client.get(
        'thesportsdb',
        `${base}eventsseason.php?id=${c.sourceId}&s=${encodeURIComponent(s.id)}`,
        (raw) => ({
          items: (
            z.object({ events: z.array(dbEvent).nullable() }).parse(raw)
              .events ?? []
          )
            .filter((e) => e.idLeague === c.sourceId && e.strSeason === s.id)
            .map((e) => normalizeDB(e, c)),
          partial: true,
          notice:
            'Partial archive: free responses contain up to 15 events. Missing events do not imply that no events took place.',
        }),
        ttlFor(s.startYear),
      )
    },
  }
}
