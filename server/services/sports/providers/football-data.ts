import { z } from 'zod'
import {
  season,
  type Competition,
  type Event,
  type EventStatus,
  type Provider,
} from '#shared/sports'
import { client, requireKey, ttlFor } from '../transport'
const base = 'https://api.football-data.org/v4/'
const team = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
})
export const matchSchema = z.object({
  id: z.number(),
  utcDate: z.iso.datetime(),
  status: z.string(),
  lastUpdated: z.string().optional(),
  homeTeam: team,
  awayTeam: team,
  score: z.object({
    fullTime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }),
  }),
})
export function footballStatus(raw: string): EventStatus {
  return (
    (
      {
        SCHEDULED: 'scheduled',
        TIMED: 'scheduled',
        IN_PLAY: 'live',
        PAUSED: 'live',
        FINISHED: 'completed',
        POSTPONED: 'postponed',
        CANCELLED: 'cancelled',
      } as Record<string, EventStatus>
    )[raw] ?? 'unknown'
  )
}
export function normalizeMatch(
  raw: z.infer<typeof matchSchema>,
  competition: Competition,
  s: ReturnType<typeof season>,
  fetchedAt = new Date().toISOString(),
): Event {
  return {
    id: `football-data:${raw.id}`,
    sourceId: String(raw.id),
    providerId: 'football-data',
    sport: 'football',
    competition,
    season: s,
    name: `${raw.homeTeam.name ?? 'TBC'} v ${raw.awayTeam.name ?? 'TBC'}`,
    startTime: raw.utcDate,
    startDate: raw.utcDate.slice(0, 10),
    status: footballStatus(raw.status),
    participants: [raw.homeTeam, raw.awayTeam]
      .filter((t) => t.id !== null)
      .map((t) => ({
        id: `football-data:${t.id}`,
        name: t.name ?? 'TBC',
        providerId: 'football-data',
      })),
    score: {
      kind: 'goals',
      home: raw.score.fullTime.home,
      away: raw.score.fullTime.away,
    },
    lastUpdated: fetchedAt,
    freshness: {
      kind: raw.status === 'FINISHED' ? 'historical' : 'delayed',
      fetchedAt,
      sourceUpdatedAt: raw.lastUpdated ?? null,
      latencySeconds: null,
      stale: false,
    },
  }
}
export function footballData(key: string): Provider {
  const headers = () => ({
    'X-Auth-Token': requireKey(key, 'football-data.org'),
  })
  const competition = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().nullable(),
    plan: z.string(),
  })
  return {
    capabilities: {
      id: 'football-data',
      sports: ['football'],
      operations: ['competitions', 'seasons', 'events', 'standings', 'teams'],
      requiresKey: true,
      live: false,
      partial: false,
      note: 'Free scores and schedules are delayed. Only the current season is offered until historical entitlement is verified.',
    },
    async getCompetitions() {
      return client.get(
        'football-data',
        `${base}competitions`,
        (raw) =>
          z
            .object({ competitions: z.array(competition) })
            .parse(raw)
            .competitions.filter((c) => c.plan === 'TIER_ONE')
            .map((c) => ({
              id: `football-data:${c.id}`,
              sourceId: String(c.id),
              name: c.name,
              sport: 'football' as const,
              providerId: 'football-data' as const,
            })),
        86_400_000,
        headers(),
      )
    },
    async getSeasons(c) {
      const schema = z.object({
        currentSeason: z
          .object({ startDate: z.string(), endDate: z.string() })
          .nullable(),
      })
      return client.get(
        'football-data',
        `${base}competitions/${c.sourceId}`,
        (raw) => {
          const s = schema.parse(raw).currentSeason
          if (!s) return []
          const first = s.startDate.slice(0, 4)
          const last = s.endDate.slice(0, 4)
          return [season(first === last ? first : `${first}-${last}`)]
        },
        86_400_000,
        headers(),
      )
    },
    async getEvents({ competition: c, season: s }) {
      return client.get(
        'football-data',
        `${base}competitions/${c.sourceId}/matches?season=${s.startYear}`,
        (raw) => ({
          items: z
            .object({ matches: z.array(matchSchema) })
            .parse(raw)
            .matches.map((m) => normalizeMatch(m, c, s)),
          partial: false,
        }),
        ttlFor(s.startYear),
        headers(),
      )
    },
    async getStandings(c, s) {
      const schema = z.object({
        standings: z.array(
          z.object({
            stage: z.string(),
            group: z.string().nullable(),
            type: z.string(),
            table: z.array(
              z.object({
                position: z.number(),
                points: z.number(),
                playedGames: z.number(),
                team,
              }),
            ),
          }),
        ),
      })
      return client.get(
        'football-data',
        `${base}competitions/${c.sourceId}/standings?season=${s.startYear}`,
        (raw) =>
          schema
            .parse(raw)
            .standings.filter((g) => g.type === 'TOTAL')
            .flatMap((g) =>
              g.table.map((r) => ({
                position: r.position,
                points: r.points,
                played: r.playedGames,
                group: g.group ?? g.stage,
                participant: {
                  id: `football-data:${r.team.id}`,
                  name: r.team.name ?? 'TBC',
                  providerId: 'football-data' as const,
                },
              })),
            ),
        ttlFor(s.startYear),
        headers(),
      )
    },
    async getTeams(c, s) {
      return client.get(
        'football-data',
        `${base}competitions/${c.sourceId}/teams?season=${s.startYear}`,
        (raw) =>
          z
            .object({ teams: z.array(team) })
            .parse(raw)
            .teams.map((t) => ({
              id: `football-data:${t.id}`,
              name: t.name ?? 'TBC',
              providerId: 'football-data' as const,
            })),
        ttlFor(s.startYear),
        headers(),
      )
    },
  }
}
