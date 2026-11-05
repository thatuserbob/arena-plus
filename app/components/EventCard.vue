<script setup lang="ts">
import { statusLabel, type Event } from '#shared/sports'
defineProps<{ event: Event }>()
const dateLabel = (date: string) =>
  date
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(date))
    : 'Date unconfirmed'
</script>
<template>
  <article class="event-card">
    <div class="event-meta">
      <span>{{ event.competition.name }}</span
      ><span class="status" :class="{ final: event.status === 'completed' }">{{
        statusLabel(event)
      }}</span>
    </div>
    <h3>{{ event.name }}</h3>
    <div
      v-if="event.score?.kind === 'goals' || event.score?.kind === 'points'"
      class="score"
    >
      {{ event.score.home ?? '–' }} <span>:</span> {{ event.score.away ?? '–' }}
    </div>
    <p
      v-else-if="event.score?.kind === 'race' && event.score.classification[0]"
      class="winner"
    >
      P1 · {{ event.score.classification[0].athlete.name }}
    </p>
    <p class="event-date">
      {{ dateLabel(event.startDate) }}
      <span v-if="event.startTime"
        >· {{ event.startTime.slice(11, 16) }} UTC</span
      ><span v-else> · Time unconfirmed</span>
    </p>
    <details>
      <summary>Event details <span>+</span></summary>
      <p>{{ event.providerId }} · {{ event.season.label }}</p>
      <p>
        LAST UPDATED
        {{ event.freshness.fetchedAt.replace('T', ' ').slice(0, 19) }} UTC
      </p>
      <p v-if="event.freshness.kind === 'delayed'">
        Delayed source. Exact delay is not published.
      </p>
      <p v-if="event.status === 'unknown'">
        A final result or current status has not been confirmed by this feed.
      </p>
      <slot />
      <p v-if="event.score?.kind === 'race' && event.score.scope === 'winner'">
        Race winner shown. Open the full classification in the sport archive.
      </p>
      <ol v-if="event.score?.kind === 'race'">
        <li v-for="r in event.score.classification" :key="r.athlete.id">
          {{ r.position }}. {{ r.athlete.name }} · {{ r.team }} ·
          {{ r.points }} pts · {{ r.time ?? r.status }}
        </li>
      </ol>
    </details>
  </article>
</template>
