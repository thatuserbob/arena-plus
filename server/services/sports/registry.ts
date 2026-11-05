import type { Operation, Provider, ProviderId, SportId } from '#shared/sports'
import { jolpica } from './providers/jolpica'
import { footballData } from './providers/football-data'
import { balldontlie } from './providers/balldontlie'
import { sportsDB } from './providers/thesportsdb'
import { DataError } from './transport'
export interface Keys {
  footballDataKey: string
  balldontlieKey: string
  sportsdbKey: string
}
export function providers(keys: Keys): Provider[] {
  return [
    jolpica,
    footballData(keys.footballDataKey),
    balldontlie(keys.balldontlieKey),
    sportsDB(keys.sportsdbKey),
  ]
}
export function resolveProvider(
  all: Provider[],
  sport: SportId,
  operation: Operation,
  explicit?: ProviderId,
): Provider {
  const provider = all.find(
    (p) =>
      p.capabilities.sports.includes(sport) &&
      p.capabilities.operations.includes(operation) &&
      (!explicit || p.capabilities.id === explicit),
  )
  if (!provider)
    throw new DataError(
      'unsupported',
      'This provider does not support the requested sport or operation.',
    )
  return provider
}
