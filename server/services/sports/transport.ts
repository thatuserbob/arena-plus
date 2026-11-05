export class DataError extends Error {
  constructor(
    public code:
      | 'credentials'
      | 'quota'
      | 'upstream'
      | 'unsupported'
      | 'invalid',
    message: string,
    public retryAfter = 60,
  ) {
    super(message)
  }
}
interface Entry {
  value: unknown
  expires: number
}
export class DataClient {
  private cache = new Map<string, Entry>()
  private pending = new Map<string, Promise<unknown>>()
  private calls = new Map<string, number[]>()
  private blocked = new Map<string, number>()
  constructor(
    private fetcher: typeof fetch = fetch,
    private now = () => Date.now(),
  ) {}
  async get<T>(
    provider: string,
    url: string,
    parse: (raw: unknown) => T,
    ttl = 300_000,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const key = `${provider}:${url}`
    const cached = this.cache.get(key)
    if (cached && cached.expires > this.now()) return cached.value as T
    const pending = this.pending.get(key)
    if (pending) return pending as Promise<T>
    const task = this.request(provider, url, parse, ttl, headers, key)
    this.pending.set(key, task)
    try {
      return await task
    } finally {
      this.pending.delete(key)
    }
  }
  private async request<T>(
    provider: string,
    url: string,
    parse: (raw: unknown) => T,
    ttl: number,
    headers: Record<string, string>,
    key: string,
  ): Promise<T> {
    const now = this.now()
    const windowMs = provider === 'jolpica' ? 3_600_000 : 60_000
    const limit =
      (
        {
          jolpica: 450,
          'football-data': 9,
          balldontlie: 4,
          thesportsdb: 25,
          openf1: 10,
        } as Record<string, number>
      )[provider] ?? 4
    const calls = (this.calls.get(provider) ?? []).filter(
      (t) => t > now - windowMs,
    )
    if (
      (this.blocked.get(provider) ?? 0) > now ||
      calls.length >= limit ||
      (provider === 'jolpica' &&
        calls.filter((t) => t > now - 1000).length >= 3)
    )
      throw new DataError(
        'quota',
        'Provider request budget reached. Please try again later.',
      )
    calls.push(now)
    this.calls.set(provider, calls)
    try {
      const res = await this.fetcher(url, {
        headers: { 'User-Agent': 'ArenaPlus/0.1.0', ...headers },
        signal: AbortSignal.timeout(12_000),
      })
      if (res.status === 429) {
        const raw = res.headers.get('retry-after')
        const seconds =
          raw && /^\d+$/.test(raw)
            ? Number(raw)
            : raw
              ? Math.ceil((Date.parse(raw) - now) / 1000)
              : 60
        const retry = Number.isFinite(seconds) ? Math.max(60, seconds) : 60
        this.blocked.set(provider, now + retry * 1000)
        throw new DataError('quota', 'Provider rate limit reached.', retry)
      }
      if (res.status === 401 || res.status === 403)
        throw new DataError(
          'credentials',
          'Provider credentials or subscription do not permit this resource.',
        )
      if (!res.ok)
        throw new DataError(
          'upstream',
          'The sports provider is temporarily unavailable.',
        )
      const value = parse(await res.json())
      if (this.cache.size >= 400)
        this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, { value, expires: now + ttl })
      return value
    } catch (error) {
      if (error instanceof DataError) throw error
      throw new DataError(
        'upstream',
        'Unable to retrieve or validate sports data. Please retry later.',
      )
    }
  }
}
export const client = new DataClient()
export const ttlFor = (year: number) =>
  year < new Date().getUTCFullYear() - 1 ? 86_400_000 : 300_000
export function requireKey(key: string, provider: string) {
  if (!key)
    throw new DataError(
      'credentials',
      `${provider} requires a server-side API key. See setup documentation.`,
    )
  return key
}
