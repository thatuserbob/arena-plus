export const sports = [
  {
    id: 'football',
    name: 'Football',
    line: 'One game. A world of belief.',
    color: '#DFFF38',
    mark: '◎',
  },
  {
    id: 'formula-1',
    name: 'Formula 1',
    line: 'Every thousandth tells a story.',
    color: '#FF694D',
    mark: '↗',
  },
  {
    id: 'motogp',
    name: 'MotoGP',
    line: 'Life at the edge of grip.',
    color: '#AC9AFF',
    mark: '〰',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    line: 'More than four quarters.',
    color: '#FFAD56',
    mark: '◉',
  },
  {
    id: 'rugby',
    name: 'Rugby',
    line: 'Together, over the line.',
    color: '#75D8BA',
    mark: '◈',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    line: 'Every point. A possibility.',
    color: '#CDF383',
    mark: '◌',
  },
] as const
export type SportId = (typeof sports)[number]['id']
export interface Sport {
  id: SportId
  name: string
}
export type ProviderId =
  | 'jolpica'
  | 'football-data'
  | 'thesportsdb'
  | 'balldontlie'
  | 'openf1'
export interface Competition {
  id: string
  providerId: ProviderId
  sourceId: string
  sport: SportId
  name: string
}
export interface Season {
  id: string
  label: string
  format: 'calendar' | 'split' | 'edition'
  startYear: number
}
export interface Team {
  id: string
  name: string
  providerId: ProviderId
}
export interface Athlete extends Team {
  teamId?: string
}
export type EventStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'unknown'
export interface DataFreshness {
  kind: 'historical' | 'delayed' | 'live' | 'unknown'
  fetchedAt: string
  sourceUpdatedAt: string | null
  latencySeconds: number | null
  stale: boolean
}
export interface RaceResult {
  position: number
  athlete: Athlete
  team: string
  points: number
  status: string
  time: string | null
}
export type Score =
  | { kind: 'goals'; home: number | null; away: number | null }
  | { kind: 'points'; home: number | null; away: number | null }
  | { kind: 'sets'; sets: { home: number; away: number }[] }
  | { kind: 'race'; classification: RaceResult[]; scope: 'winner' | 'full' }
interface BaseEvent {
  id: string
  providerId: ProviderId
  sourceId: string
  competition: Competition
  season: Season
  name: string
  startTime: string | null
  startDate: string
  status: EventStatus
  participants: (Team | Athlete)[]
  lastUpdated: string
  freshness: DataFreshness
}
export type Event = BaseEvent &
  (
    | { sport: 'football'; score: Extract<Score, { kind: 'goals' }> | null }
    | {
        sport: 'basketball' | 'rugby'
        score: Extract<Score, { kind: 'points' }> | null
      }
    | { sport: 'tennis'; score: Extract<Score, { kind: 'sets' }> | null }
    | {
        sport: 'formula-1' | 'motogp'
        score: Extract<Score, { kind: 'race' }> | null
      }
  )
export interface Standing {
  position: number
  participant: Team | Athlete
  points: number
  played?: number
  group?: string
}
export type Operation =
  | 'competitions'
  | 'seasons'
  | 'events'
  | 'event'
  | 'standings'
  | 'teams'
  | 'athletes'
export interface ProviderCapabilities {
  id: ProviderId
  sports: SportId[]
  operations: Operation[]
  requiresKey: boolean
  live: boolean
  partial: boolean
  note: string
}
export interface EventFilters {
  competition: Competition
  season: Season
  cursor?: string
}
export interface Page<T> {
  items: T[]
  nextCursor?: string
  partial: boolean
  notice?: string
}
export interface Provider {
  capabilities: ProviderCapabilities
  getCompetitions(sport: SportId): Promise<Competition[]>
  getSeasons?(competition: Competition): Promise<Season[]>
  getEvents?(filters: EventFilters): Promise<Page<Event>>
  getEvent?(id: string, filters: EventFilters): Promise<Event | null>
  getStandings?(competition: Competition, season: Season): Promise<Standing[]>
  getTeams?(competition: Competition, season: Season): Promise<Team[]>
  getAthletes?(filters: EventFilters): Promise<Athlete[]>
}
export function season(value: string): Season {
  const match = /^(\d{4})(?:[-/](\d{2}|\d{4}))?$/.exec(value)
  if (!match) throw new Error('Invalid season')
  return {
    id: value,
    label: match[2] ? `${match[1]}/${match[2].slice(-2)}` : value,
    startYear: Number(match[1]),
    format: match[2] ? 'split' : 'calendar',
  }
}
export function statusLabel(event: Event): string {
  if (event.freshness.stale) return 'LAST CONFIRMED'
  if (event.status === 'live')
    return event.freshness.kind === 'live' ? 'LIVE' : 'DELAYED'
  return {
    completed: 'FINAL',
    scheduled: 'UPCOMING',
    postponed: 'POSTPONED',
    cancelled: 'CANCELLED',
    unknown: 'UNCONFIRMED',
  }[event.status]
}
