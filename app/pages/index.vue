<script setup lang="ts">
import { sports } from '#shared/sports'
useSeoMeta({
  title: 'Arena+ — Beyond the Score',
  description:
    'The moments, the margins, the arenas. Discover six sports through real calendars, results and historical seasons.',
})
const { data } = await useFetch('/api/home')
const upcoming = computed(
  () =>
    data.value?.events.filter((e) => e.status === 'scheduled').slice(0, 3) ??
    [],
)
const recent = computed(() =>
  [...(data.value?.events ?? [])]
    .filter((e) => e.status !== 'scheduled')
    .reverse()
    .slice(0, 3),
)
useCinematic()
</script>
<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-art" aria-hidden="true">
        <div class="orb" />
        <div class="field"><i /><i /><i /></div>
        <div class="motion-line one" />
        <div class="motion-line two" />
        <span class="art-number">90<span>+</span></span>
      </div>
      <div class="hero-content">
        <p class="eyebrow">
          <span class="dot" /> CHAPTER 01 / A DIFFERENT KIND OF SPORTS PLATFORM
        </p>
        <h1>BEYOND<br >THE <em>SCORE.</em></h1>
        <p class="hero-description">
          For the moments you feel.<br >The games you live. The stories still
          being written.
        </p>
        <div class="actions">
          <a href="#arenas" class="button primary"
            >Find your arena <span>↗</span></a
          ><NuxtLink to="/sports/formula-1" class="text-link"
            >Explore the archive <span>→</span></NuxtLink
          >
        </div>
      </div>
      <div class="hero-bottom">
        <span>06 SPORTS. ONE SHARED OBSESSION.</span
        ><span>ORIGINAL GRAPHIC STUDY · PHOTOGRAPHY PLACEHOLDER</span
        ><a href="#arenas">SCROLL TO EXPLORE ↓</a>
      </div>
    </section>
    <div class="ticker" aria-hidden="true">
      <span>EVERY SECOND COUNTS</span><b>✳</b
      ><span>EVERY ARENA HAS A STORY</span><b>✳</b><span>BEYOND THE SCORE</span
      ><b>✳</b>
    </div>
    <section id="arenas" class="chapter" data-reveal>
      <div class="section-heading">
        <div>
          <p class="eyebrow">CHAPTER 02 / SIX WAYS TO FEEL EVERYTHING</p>
          <h2>CHOOSE YOUR <em>ARENA.</em></h2>
        </div>
        <p>Different games.<br >The same beautiful obsession.</p>
      </div>
      <div class="arena-grid">
        <NuxtLink
          v-for="(sport, i) in sports"
          :key="sport.id"
          :to="`/sports/${sport.id}`"
          class="arena-card"
          :style="{ '--accent': sport.color }"
          ><span class="arena-index">0{{ i + 1 }} / EXPLORE</span
          ><span class="sport-art" aria-hidden="true">{{ sport.mark }}</span>
          <div>
            <h3>{{ sport.name }}</h3>
            <p>{{ sport.line }}</p>
          </div>
          <span class="card-arrow">↗</span></NuxtLink
        >
      </div>
    </section>
    <section class="story chapter" data-reveal>
      <div class="story-visual" aria-hidden="true">
        <span class="story-ring" /><span class="story-type"
          >THE<br >EXTRA<br ><em>MILE.</em></span
        ><small>ORIGINAL ILLUSTRATION · VISUAL PLACEHOLDER</small>
      </div>
      <div class="story-copy">
        <p class="eyebrow">CHAPTER 03 / THE NIGHTS THAT DEFINE LEGENDS</p>
        <h2>THE FINAL WHISTLE.<br ><em>NEVER THE END.</em></h2>
        <p>
          A result is a starting point. Return to a season, follow the names on
          the grid, and discover how a championship unfolded.
        </p>
        <p class="muted">
          Your next story starts in the record. Explore the real race archive,
          one round at a time.
        </p>
        <NuxtLink to="/sports/formula-1" class="button primary"
          >Step into the archive <span>↗</span></NuxtLink
        >
      </div>
    </section>
    <section id="playing" class="chapter" data-reveal>
      <div class="section-heading">
        <div>
          <p class="eyebrow">CHAPTER 04 / FROM THE RECORD</p>
          <h2>THE WORLD IS <em>PLAYING.</em></h2>
        </div>
        <NuxtLink to="/sports/formula-1" class="text-link"
          >Browse all events ↗</NuxtLink
        >
      </div>
      <p class="feed-note">{{ data?.notice }}</p>
      <div v-if="recent.length" class="event-grid">
        <EventCard v-for="event in recent" :key="event.id" :event="event" />
      </div>
      <div v-else class="empty-state">
        <span>↗</span>
        <h3>The game goes on.</h3>
        <p>
          Confirmed event data is unavailable right now. Choose an arena to
          explore its coverage and retry.
        </p>
        <NuxtLink to="/sports/formula-1" class="text-link"
          >Open Formula 1 →</NuxtLink
        >
      </div>
    </section>
    <section class="chapter next-chapter" data-reveal>
      <div class="section-heading">
        <div>
          <p class="eyebrow">CHAPTER 05 / SOMETHING TO LOOK FORWARD TO</p>
          <h2>THE NEXT <em>CHAPTER.</em></h2>
        </div>
        <p>Find the next date<br >worth circling.</p>
      </div>
      <div v-if="upcoming.length" class="event-grid">
        <EventCard v-for="event in upcoming" :key="event.id" :event="event" />
      </div>
      <p v-else class="feed-note">
        No upcoming events confirmed by the current feed. Explore a sport for
        its available calendar.
      </p>
      <div class="closing">
        <p>WHATEVER YOUR GAME.</p>
        <h2>MAKE IT <em>MEAN MORE.</em></h2>
        <a class="button primary" href="#arenas">Choose your arena ↗</a>
      </div>
    </section>
  </div>
</template>
