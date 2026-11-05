import { jolpica } from '../services/sports/providers/jolpica'
export default defineEventHandler(async () => {
  try {
    const competitions = await jolpica.getCompetitions('formula-1')
    const competition = competitions[0]!
    const seasons = await jolpica.getSeasons!(competition)
    const season =
      seasons.find((s) => s.startYear === new Date().getUTCFullYear()) ??
      seasons[0]
    if (!season)
      return { events: [], notice: 'No season is currently available.' }
    const page = await jolpica.getEvents!({ competition, season })
    return {
      events: page.items,
      notice:
        'Formula 1 calendar and confirmed winners · Jolpica · no live timing. Open a race in the archive for its full classification.',
    }
  } catch {
    return {
      events: [],
      notice:
        'The event feed is temporarily unavailable. Explore the arenas and try the archive again shortly.',
    }
  }
})
