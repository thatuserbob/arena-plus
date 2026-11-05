import { z } from 'zod'
import {
  season,
  type Competition,
  type Event,
  type Provider,
} from '#shared/sports'
import { client, requireKey, ttlFor } from '../transport'
const nba: Competition = {
  id: 'balldontlie:nba',
  sourceId: 'nba',
  providerId: 'balldontlie',
  sport: 'basketball',
  name: 'NBA',
}
const team = z.object({ id: z.number(), full_name: z.string() })
export const gameSchema = z.object({
  id: z.number(),
  date: z.string(),
  datetime: z.string().nullable().optional(),
  status: z.string(),
  season: z.number(),
  home_team: team,
  visitor_team: team,
  home_team_score: z.number().nullable(),
  visitor_team_score: z.number().nullable(),
})
export function normalizeGame(
  g: z.infer<typeof gameSchema>,
  fetchedAt = new Date().toISOString(),
): Event {
  const final = g.status === 'Final'
  const startTime =
    g.datetime && /(?:Z|[+-]\d{2}:\d{2})$/.test(g.datetime) && Number.isFinite(Date.parse(g.datetime))
      ? new Date(g.datetime).toISOString()
      : null
  return {
    id: `balldontlie:${g.id}`,
    sourceId: String(g.id),
    providerId: 'balldontlie',
    sport: 'basketball',
    competition: nba,
    season: season(`${g.season}-${g.season + 1}`),
    name: `${g.home_team.full_name} v ${g.visitor_team.full_name}`,
    startDate: g.date.slice(0, 10),
    startTime,
    status: final
      ? 'completed'
      : /postponed/i.test(g.status)
        ? 'postponed'
        : startTime && startTime > fetchedAt
          ? 'scheduled'
          : 'unknown',
    participants: [g.home_team, g.visitor_team].map((t) => ({
      id: `balldontlie:${t.id}`,
      name: t.full_name,
      providerId: 'balldontlie',
    })),
    score: final
      ? { kind: 'points', home: g.home_team_score, away: g.visitor_team_score }
      : null,
    lastUpdated: fetchedAt,
    freshness: {
      kind: final ? 'historical' : 'unknown',
      fetchedAt,
      sourceUpdatedAt: null,
      latencySeconds: null,
      stale: false,
    },
  }
}
export function balldontlie(key: string): Provider {
  const headers = () => ({ Authorization: requireKey(key, 'BALLDONTLIE') })
  return {
    capabilities: {
      id: 'balldontlie',
      sports: ['basketball'],
      operations: ['competitions', 'seasons', 'events', 'teams'],
      requiresKey: true,
      live: false,
      partial: false,
      note: 'NBA games and teams. Standings and live box scores require a paid tier. Season list is limited to seasons verified to contain games.',
    },
    async getCompetitions() {
      requireKey(key, 'BALLDONTLIE')
      return [nba]
    },
    async getSeasons() {
      // The API has no season-discovery resource. Verify a bounded recent window rather than inventing availability.
      const year = new Date().getUTCFullYear()
      const found = []
      for (const y of [year, year - 1, year - 2]) {
        const hasGames = await client.get(
          'balldontlie',
          `https://api.balldontlie.io/v1/games?seasons[]=${y}&per_page=1`,
          (raw) =>
            z.object({ data: z.array(gameSchema) }).parse(raw).data.length > 0,
          86_400_000,
          headers(),
        )
        if (hasGames) found.push(season(`${y}-${y + 1}`))
      }
      return found
    },
    async getEvents({ season: s, cursor }) {
      return client.get(
        'balldontlie',
        `https://api.balldontlie.io/v1/games?seasons[]=${s.startYear}&per_page=100${cursor ? `&cursor=${cursor}` : ''}`,
        (raw) => {
          const data = z
            .object({
              data: z.array(gameSchema),
              meta: z.object({ next_cursor: z.number().nullable().optional() }),
            })
            .parse(raw)
          return {
            items: data.data.map((g) => normalizeGame(g)),
            partial: data.meta.next_cursor != null,
            nextCursor:
              data.meta.next_cursor != null
                ? String(data.meta.next_cursor)
                : undefined,
          }
        },
        ttlFor(s.startYear),
        headers(),
      )
    },
    async getTeams() {
      return client.get(
        'balldontlie',
        'https://api.balldontlie.io/v1/teams',
        (raw) =>
          z
            .object({ data: z.array(team) })
            .parse(raw)
            .data.map((t) => ({
              id: `balldontlie:${t.id}`,
              name: t.full_name,
              providerId: 'balldontlie' as const,
            })),
        86_400_000,
        headers(),
      )
    },
  }
}
