import { z } from 'zod'
import { sports, type Operation, type ProviderId } from '#shared/sports'
import { providers, resolveProvider } from '../../services/sports/registry'
import { DataError } from '../../services/sports/transport'
const querySchema = z.object({
  sport: z
    .enum(['football', 'formula-1', 'motogp', 'basketball', 'rugby', 'tennis'])
    .default('formula-1'),
  provider: z
    .enum(['jolpica', 'football-data', 'balldontlie', 'thesportsdb', 'openf1'])
    .optional(),
  competition: z.string().max(80).optional(),
  season: z
    .string()
    .regex(/^\d{4}(?:[-/]\d{2,4})?$/)
    .optional(),
  id: z
    .string()
    .regex(/^[\w:-]+$/)
    .max(100)
    .optional(),
  cursor: z
    .string()
    .regex(/^\d{1,12}$/)
    .optional(),
})
export default defineEventHandler(async (event) => {
  try {
    const op = getRouterParam(event, 'operation')!
    const q = querySchema.parse(getQuery(event))
    const all = providers(useRuntimeConfig(event))
    if (op === 'sports') return { items: sports }
    if (op === 'capabilities')
      return {
        items: all
          .map((p) => p.capabilities)
          .filter((p) => p.sports.includes(q.sport)),
      }
    if (
      ![
        'competitions',
        'seasons',
        'events',
        'event',
        'standings',
        'teams',
        'athletes',
      ].includes(op)
    )
      throw new DataError('invalid', 'Unknown operation.')
    const provider = resolveProvider(
      all,
      q.sport,
      op as Operation,
      q.provider as ProviderId | undefined,
    )
    const competitions = await provider.getCompetitions(q.sport)
    if (op === 'competitions')
      return { items: competitions, capabilities: provider.capabilities }
    const competition = competitions.find((c) => c.id === q.competition)
    if (!competition)
      throw new DataError('invalid', 'Choose an available competition.')
    const seasons = (await provider.getSeasons?.(competition)) ?? []
    if (op === 'seasons') return { items: seasons }
    const season = seasons.find((s) => s.id === q.season)
    if (!season)
      throw new DataError(
        'invalid',
        'Choose a season returned by this provider.',
      )
    const filters = { competition, season, cursor: q.cursor }
    if (op === 'events') return await provider.getEvents!(filters)
    if (op === 'event') {
      if (
        !q.id ||
        !q.id.startsWith(`${provider.capabilities.id}:${season.id}:`)
      )
        throw new DataError('invalid', 'Event does not belong to this season.')
      return { item: await provider.getEvent!(q.id, filters) }
    }
    if (op === 'standings')
      return { items: await provider.getStandings!(competition, season) }
    if (op === 'teams')
      return { items: await provider.getTeams!(competition, season) }
    return { items: await provider.getAthletes!(filters) }
  } catch (error) {
    if (error instanceof z.ZodError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters.',
      })
    if (error instanceof DataError) {
      if (error.code === 'quota')
        setHeader(event, 'Retry-After', error.retryAfter)
      throw createError({
        statusCode: {
          invalid: 400,
          credentials: 503,
          quota: 429,
          upstream: 502,
          unsupported: 422,
        }[error.code],
        statusMessage: error.message,
        data: { code: error.code },
      })
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'Sports data is temporarily unavailable.',
    })
  }
})
