<script setup lang="ts">
import {
  sports,
  type Competition,
  type Event,
  type Page,
  type ProviderCapabilities,
  type ProviderId,
  type Season,
  type Standing,
} from '#shared/sports'
const route = useRoute()
const sport = computed(() => sports.find((s) => s.id === route.params.sport))
if (!sport.value)
  throw createError({ statusCode: 404, statusMessage: 'Arena not found' })
const currentSport = sport.value.id
useSeoMeta({
  title: () => `${sport.value?.name} — Arena+`,
  description: () =>
    `${sport.value?.name} calendars, results and historical seasons. Real data with transparent coverage.`,
})
const preference = useState<Record<string, ProviderId>>(
  'arena-providers',
  () => ({}),
)
const provider = ref<ProviderId>(
  preference.value[currentSport] ??
    (currentSport === 'formula-1'
      ? 'jolpica'
      : currentSport === 'football'
        ? 'football-data'
        : currentSport === 'basketball'
          ? 'balldontlie'
          : 'thesportsdb'),
)
const { data: capabilities } = await useFetch<{
  items: ProviderCapabilities[]
}>('/api/data/capabilities', { query: { sport: currentSport } })
const query = computed(() => ({
  sport: currentSport,
  provider: provider.value,
}))
const {
  data: competitions,
  error: competitionError,
  status: competitionStatus,
  refresh: refreshCompetitions,
} = await useFetch<{
  items: Competition[]
  capabilities: ProviderCapabilities
}>('/api/data/competitions', { query })
const competitionId = ref(competitions.value?.items[0]?.id ?? '')
const selectedSeason = ref('')
const seasons = ref<Season[]>([])
const seasonError = ref('')
const seasonsPending = ref(false)
let generation = 0
async function loadSeasons() {
  const version = ++generation
  seasons.value = []
  selectedSeason.value = ''
  seasonError.value = ''
  if (!competitionId.value) {
    seasonsPending.value = false
    return
  }
  seasonsPending.value = true
  try {
    const response = await $fetch<{ items: Season[] }>('/api/data/seasons', {
      query: { ...query.value, competition: competitionId.value },
    })
    if (version !== generation) return
    seasons.value = response.items
    selectedSeason.value = response.items[0]?.id ?? ''
  } catch (e) {
    if (version === generation) seasonError.value = message(e)
  } finally {
    if (version === generation) seasonsPending.value = false
  }
}
function message(e: unknown) {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return (
    err.data?.statusMessage ??
    'Data is temporarily unavailable. Please try again shortly.'
  )
}
// SSR carries the initial discovered season into the hydration payload.
const { data: initialSeasons } = await useAsyncData(
  `seasons:${currentSport}:${provider.value}`,
  async () => {
    if (!competitionId.value) return { items: [] as Season[], error: '' }
    try {
      const value = await $fetch<{ items: Season[] }>('/api/data/seasons', {
        query: { ...query.value, competition: competitionId.value },
      })
      return { ...value, error: '' }
    } catch (e) {
      return { items: [] as Season[], error: message(e) }
    }
  },
)
seasons.value = initialSeasons.value?.items ?? []
selectedSeason.value = seasons.value[0]?.id ?? ''
seasonError.value = initialSeasons.value?.error ?? ''
watch(provider, (value) => {
  preference.value[currentSport] = value
  competitionId.value = ''
  seasons.value = []
  selectedSeason.value = ''
  generation++
})
watch(competitions, (value) => {
  competitionId.value = value?.items[0]?.id ?? ''
})
watch(competitionId, loadSeasons)
const eventQuery = computed(() => ({
  ...query.value,
  competition: competitionId.value,
  season: selectedSeason.value,
}))
const {
  data: page,
  error: eventError,
  status: eventStatus,
  refresh: refreshEvents,
} = await useAsyncData(
  `events:${currentSport}`,
  async () => {
    if (!competitionId.value || !selectedSeason.value)
      return { items: [], partial: false } as Page<Event>
    return await $fetch<Page<Event>>('/api/data/events', {
      query: eventQuery.value,
    })
  },
  { watch: [eventQuery] },
)
const filter = ref('all')
const visibleEvents = computed(() =>
  (page.value?.items ?? []).filter(
    (e) =>
      e.competition.id === competitionId.value &&
      e.season.id === selectedSeason.value &&
      (filter.value === 'all' || e.status === filter.value),
  ),
)
const standings = ref<Standing[]>([])
const standingsMessage = ref('')
const standingsPending = ref(false)
watch(eventQuery, () => {
  standings.value = []
  standingsMessage.value = ''
})
async function loadStandings() {
  const requestKey = JSON.stringify(eventQuery.value)
  standingsPending.value = true
  standingsMessage.value = ''
  try {
    const result = await $fetch<{ items: Standing[] }>('/api/data/standings', {
      query: eventQuery.value,
    })
    if (requestKey === JSON.stringify(eventQuery.value)) {
      standings.value = result.items
      if (!result.items.length)
        standingsMessage.value = 'No standings are available for this season.'
    }
  } catch (e) {
    if (requestKey === JSON.stringify(eventQuery.value))
      standingsMessage.value = message(e)
  } finally {
    standingsPending.value = false
  }
}
const detailErrors = ref<Record<string, string>>({})
const loadingDetail = ref('')
async function loadResult(event: Event) {
  loadingDetail.value = event.id
  try {
    const result = await $fetch<{ item: Event | null }>('/api/data/event', {
      query: { ...eventQuery.value, id: event.id },
    })
    if (result.item && page.value)
      page.value.items = page.value.items.map((e) =>
        e.id === event.id ? result.item! : e,
      )
    else
      detailErrors.value[event.id] =
        'No confirmed classification is available yet.'
  } catch (e) {
    detailErrors.value[event.id] = message(e)
  } finally {
    loadingDetail.value = ''
  }
}
const loadingMore = ref(false)
async function nextPage() {
  if (!page.value?.nextCursor || loadingMore.value) return
  loadingMore.value = true
  const requestKey = JSON.stringify(eventQuery.value)
  try {
    const next = await $fetch<Page<Event>>('/api/data/events', {
      query: { ...eventQuery.value, cursor: page.value.nextCursor },
    })
    if (requestKey === JSON.stringify(eventQuery.value))
      page.value = {
        ...next,
        items: [
          ...new Map(
            [...page.value.items, ...next.items].map((e) => [e.id, e]),
          ).values(),
        ],
      }
  } catch (e) {
    seasonError.value = message(e)
  } finally {
    loadingMore.value = false
  }
}
const activeCapability = computed(() =>
  capabilities.value?.items.find((c) => c.id === provider.value),
)
// Manual refresh only: these integrations have no verified free live feed.
useCinematic()
</script>
<template>
  <div :key="currentSport" :style="{ '--accent': sport?.color }">
    <section class="sport-hero">
      <NuxtLink to="/" class="eyebrow">← ALL ARENAS</NuxtLink>
      <p class="eyebrow">YOUR ARENA / {{ sport?.name }}</p>
      <h1>{{ sport?.name }}<em>.</em></h1>
      <p>{{ sport?.line }}</p>
      <span class="sport-hero-mark" aria-hidden="true">{{ sport?.mark }}</span>
    </section>
    <section class="chapter browser-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">THE RECORD / THEN & NOW</p>
          <h2>FIND YOUR <em>SEASON.</em></h2>
        </div>
      </div>
      <div class="selectors">
        <label
          >Data source<select v-model="provider">
            <option
              v-for="cap in capabilities?.items"
              :key="cap.id"
              :value="cap.id"
            >
              {{ cap.id }}
            </option>
          </select></label
        ><label
          >Competition<select
            v-model="competitionId"
            :disabled="!competitions?.items.length"
          >
            <option value="" disabled>Choose competition</option>
            <option v-for="c in competitions?.items" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select></label
        ><label
          >Season<select v-model="selectedSeason" :disabled="!seasons.length">
            <option value="" disabled>
              {{ seasonsPending ? 'Loading seasons…' : 'No season selected' }}
            </option>
            <option v-for="s in seasons" :key="s.id" :value="s.id">
              {{ s.label }}
            </option>
          </select></label
        >
      </div>
      <p class="feed-note">{{ activeCapability?.note }}</p>
      <div v-if="competitionError" class="empty-state" role="status">
        <h3>Connect this arena.</h3>
        <p>{{ message(competitionError) }}</p>
        <p v-if="provider === 'football-data' || provider === 'balldontlie'">
          An operator can add the free provider key in the server configuration.
          You can also select TheSportsDB to explore its limited public archive.
        </p>
        <button class="button" @click="refreshCompetitions()">
          Try again ↻
        </button>
      </div>
      <p
        v-else-if="competitionStatus === 'pending'"
        role="status"
        class="feed-note"
      >
        Discovering competitions…
      </p>
      <div v-else-if="!competitions?.items.length" class="empty-state">
        <h3>This arena is still opening.</h3>
        <p>
          No competitions were returned for {{ sport?.name }} by this provider.
          The free catalog may be restricted; this does not mean no competitions
          exist.
        </p>
        <NuxtLink to="/sports/formula-1" class="text-link"
          >Explore the Formula 1 archive →</NuxtLink
        >
      </div>
      <p v-if="seasonError" class="error-message" role="alert">
        {{ seasonError }} <button @click="loadSeasons">Retry seasons</button>
      </p>
      <p
        v-if="
          competitionId && !seasonsPending && !seasonError && !seasons.length
        "
        class="feed-note"
      >
        No available seasons were returned for this competition.
      </p>
      <template v-if="selectedSeason">
        <div class="results-toolbar">
          <h3>Fixtures & results</h3>
          <label class="sr-only" for="status-filter">Event status</label
          ><select id="status-filter" v-model="filter">
            <option value="all">All events</option>
            <option value="scheduled">Upcoming</option>
            <option value="completed">Final</option>
            <option value="unknown">Unconfirmed</option></select
          ><button
            class="text-link"
            :disabled="eventStatus === 'pending'"
            @click="refreshEvents()"
          >
            {{ eventStatus === 'pending' ? 'Updating…' : 'Refresh ↻' }}
          </button>
        </div>
        <p v-if="eventError" class="error-message" role="alert">
          {{ message(eventError) }} Previously loaded events, if shown, retain
          their last successful update time.
        </p>
        <p v-if="page?.partial" class="feed-note">
          {{ page.notice ?? 'More events are available on subsequent pages.' }}
        </p>
        <p v-if="eventStatus === 'pending'" class="feed-note" role="status">
          Fetching confirmed event data…
        </p>
        <div class="event-grid">
          <EventCard
            v-for="event in visibleEvents"
            :key="event.id"
            :event="event"
            ><template v-if="provider === 'jolpica'"
              ><button
                class="text-link"
                :disabled="!!loadingDetail"
                @click="loadResult(event)"
              >
                {{
                  loadingDetail === event.id
                    ? 'Loading…'
                    : 'Load full classification ↗'
                }}
              </button>
              <p v-if="detailErrors[event.id]" role="status">
                {{ detailErrors[event.id] }}
              </p></template
            ></EventCard
          >
        </div>
        <p
          v-if="!visibleEvents.length && eventStatus !== 'pending'"
          class="empty-state"
        >
          No events returned for this selection. Try another season or event
          filter.
        </p>
        <button
          v-if="page?.nextCursor"
          class="button"
          :disabled="loadingMore"
          @click="nextPage"
        >
          {{ loadingMore ? 'Loading…' : 'Load more events ↓' }}
        </button>
        <section class="standings">
          <h3>Standings & rankings</h3>
          <template v-if="activeCapability?.operations.includes('standings')"
            ><button
              class="button"
              :disabled="standingsPending"
              @click="loadStandings"
            >
              {{ standingsPending ? 'Loading…' : 'Load season standings ↗' }}
            </button>
            <p v-if="standingsMessage" role="status">{{ standingsMessage }}</p>
            <div v-if="standings.length" class="table-wrap">
              <table>
                <caption>
                  {{
                    selectedSeason
                  }}
                  ·
                  {{
                    provider
                  }}
                  standings
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Position</th>
                    <th scope="col">Participant</th>
                    <th scope="col">Group</th>
                    <th scope="col">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in standings"
                    :key="`${row.group}:${row.participant.id}`"
                  >
                    <td>{{ row.position }}</td>
                    <td>{{ row.participant.name }}</td>
                    <td>{{ row.group ?? '—' }}</td>
                    <td>{{ row.points }}</td>
                  </tr>
                </tbody>
              </table>
            </div></template
          >
          <p v-else class="feed-note">
            Standings are not available through this free integration.
          </p>
        </section>
      </template>
    </section>
  </div>
</template>
