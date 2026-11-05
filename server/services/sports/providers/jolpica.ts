import { z } from 'zod'
import {
  season,
  type Competition,
  type Event,
  type Provider,
  type Season,
} from '#shared/sports'
import { client, ttlFor } from '../transport'
const driver = z.object({
  driverId: z.string(),
  givenName: z.string(),
  familyName: z.string(),
})
const constructor = z.object({ constructorId: z.string(), name: z.string() })
const result = z.object({
  position: z.coerce.number(),
  points: z.coerce.number(),
  status: z.string(),
  Driver: driver,
  Constructor: constructor,
  Time: z.object({ time: z.string() }).optional(),
})
export const raceSchema = z.object({
  season: z.string(),
  round: z.string(),
  raceName: z.string(),
  date: z.iso.date(),
  time: z.string().optional(),
  Results: z.array(result).optional(),
})
const racesSchema = z.object({
  MRData: z.object({ RaceTable: z.object({ Races: z.array(raceSchema) }) }),
})
const base = 'https://api.jolpi.ca/ergast/f1/'
export const f1: Competition = {
  id: 'jolpica:f1',
  sourceId: 'f1',
  providerId: 'jolpica',
  sport: 'formula-1',
  name: 'Formula 1 World Championship',
}
export function normalizeRace(
  raw: z.infer<typeof raceSchema>,
  fetchedAt = new Date().toISOString(),
  scope: 'winner' | 'full' = 'full',
): Event {
  const results = raw.Results ?? []
  const startTime = raw.time
    ? new Date(`${raw.date}T${raw.time}`).toISOString()
    : null
  return {
    id: `jolpica:${raw.season}:${raw.round}`,
    sourceId: `${raw.season}:${raw.round}`,
    providerId: 'jolpica',
    sport: 'formula-1',
    competition: f1,
    season: season(raw.season),
    name: raw.raceName,
    startDate: raw.date,
    startTime,
    status: results.length
      ? 'completed'
      : raw.date > fetchedAt.slice(0, 10) ||
          (startTime && startTime > fetchedAt)
        ? 'scheduled'
        : 'unknown',
    participants: results.map((r) => ({
      id: `jolpica:${r.Driver.driverId}`,
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      providerId: 'jolpica',
    })),
    score: results.length
      ? {
          kind: 'race',
          scope,
          classification: results.map((r) => ({
            position: r.position,
            points: r.points,
            status: r.status,
            time: r.Time?.time ?? null,
            team: r.Constructor.name,
            athlete: {
              id: `jolpica:${r.Driver.driverId}`,
              name: `${r.Driver.givenName} ${r.Driver.familyName}`,
              providerId: 'jolpica',
            },
          })),
        }
      : null,
    lastUpdated: fetchedAt,
    freshness: {
      kind: results.length ? 'historical' : 'unknown',
      fetchedAt,
      sourceUpdatedAt: null,
      latencySeconds: null,
      stale: false,
    },
  }
}
export const jolpica: Provider = {
  capabilities: {
    id: 'jolpica',
    sports: ['formula-1'],
    operations: [
      'competitions',
      'seasons',
      'events',
      'event',
      'standings',
      'teams',
      'athletes',
    ],
    requiresKey: false,
    live: false,
    partial: false,
    note: 'Race calendars and confirmed results. No live timing. Open a race for its classification.',
  },
  async getCompetitions() {
    return [f1]
  },
  async getSeasons() {
    const schema = z.object({
      MRData: z.object({
        SeasonTable: z.object({
          Seasons: z.array(z.object({ season: z.string() })),
        }),
      }),
    })
    return client.get(
      'jolpica',
      `${base}seasons.json?limit=100`,
      (raw) =>
        schema
          .parse(raw)
          .MRData.SeasonTable.Seasons.map((s) => season(s.season))
          .reverse(),
      86_400_000,
    )
  },
  async getEvents({ season: s }) {
    const calendar = await client.get(
      'jolpica',
      `${base}${s.id}.json?limit=100`,
      (raw) => ({
        races: racesSchema.parse(raw).MRData.RaceTable.Races,
        fetchedAt: new Date().toISOString(),
      }),
      ttlFor(s.startYear),
    )
    const winners = await client.get(
      'jolpica',
      `${base}${s.id}/results/1.json?limit=100`,
      (raw) => ({
        races: racesSchema.parse(raw).MRData.RaceTable.Races,
        fetchedAt: new Date().toISOString(),
      }),
      ttlFor(s.startYear),
    )
    return {
      items: calendar.races.map((r) => {
        const result = winners.races.find((w) => w.round === r.round)
        return normalizeRace(
          result ?? r,
          result ? winners.fetchedAt : calendar.fetchedAt,
          'winner',
        )
      }),
      partial: false,
    }
  },
  async getEvent(id, { season: s }) {
    const round = id.split(':').at(-1)!
    return client.get(
      'jolpica',
      `${base}${s.id}/${round}/results.json?limit=100`,
      (raw) => {
        const race = racesSchema.parse(raw).MRData.RaceTable.Races[0]
        return race ? normalizeRace(race) : null
      },
      ttlFor(s.startYear),
    )
  },
  async getStandings(_c, s) {
    const schema = z.object({
      MRData: z.object({
        StandingsTable: z.object({
          StandingsLists: z.array(
            z.object({
              DriverStandings: z.array(
                z.object({
                  position: z.coerce.number(),
                  points: z.coerce.number(),
                  Driver: driver,
                }),
              ),
            }),
          ),
        }),
      }),
    })
    return client.get(
      'jolpica',
      `${base}${s.id}/driverstandings.json?limit=100`,
      (raw) =>
        (
          schema.parse(raw).MRData.StandingsTable.StandingsLists[0]
            ?.DriverStandings ?? []
        ).map((r) => ({
          position: r.position,
          points: r.points,
          participant: {
            id: `jolpica:${r.Driver.driverId}`,
            name: `${r.Driver.givenName} ${r.Driver.familyName}`,
            providerId: 'jolpica' as const,
          },
        })),
      ttlFor(s.startYear),
    )
  },
  async getTeams(_c: Competition, s: Season) {
    const schema = z.object({
      MRData: z.object({
        ConstructorTable: z.object({ Constructors: z.array(constructor) }),
      }),
    })
    return client.get(
      'jolpica',
      `${base}${s.id}/constructors.json?limit=100`,
      (raw) =>
        schema
          .parse(raw)
          .MRData.ConstructorTable.Constructors.map((c) => ({
            id: `jolpica:${c.constructorId}`,
            name: c.name,
            providerId: 'jolpica' as const,
          })),
      ttlFor(s.startYear),
    )
  },
  async getAthletes({ season: s }) {
    const schema = z.object({
      MRData: z.object({ DriverTable: z.object({ Drivers: z.array(driver) }) }),
    })
    return client.get(
      'jolpica',
      `${base}${s.id}/drivers.json?limit=100`,
      (raw) =>
        schema
          .parse(raw)
          .MRData.DriverTable.Drivers.map((d) => ({
            id: `jolpica:${d.driverId}`,
            name: `${d.givenName} ${d.familyName}`,
            providerId: 'jolpica' as const,
          })),
      ttlFor(s.startYear),
    )
  },
}
