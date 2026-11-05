<template>
  <NuxtRouteAnnouncer />
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <NuxtLink to="/" class="brand" aria-label="Arena Plus home"
      >ARENA<span>+</span></NuxtLink
    >
    <nav aria-label="Main navigation">
      <NuxtLink to="/#arenas">The arenas</NuxtLink
      ><NuxtLink to="/sports/formula-1">Season archive</NuxtLink
      ><NuxtLink to="/#playing" class="nav-score"
        >Explore events <span>↗</span></NuxtLink
      >
    </nav>
  </header>
  <main id="main"><NuxtPage :page-key="(route) => route.path" /></main>
  <footer>
    <NuxtLink to="/" class="brand">ARENA<span>+</span></NuxtLink>
    <p>Beyond the Score.</p>
    <small
      >Independent sports discovery. Data attributed at source. No guaranteed
      live coverage.</small
    ><a
      href="https://api.jolpi.ca/docs/"
      target="_blank"
      rel="noopener noreferrer"
      >Jolpica F1 ↗</a
    ><a
      href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
      target="_blank"
      rel="noopener noreferrer"
      >F1 data: CC BY-NC-SA 4.0 · normalized for display</a
    ><a
      href="https://www.football-data.org"
      target="_blank"
      rel="noopener noreferrer"
      >football-data.org ↗</a
    ><a
      href="https://www.thesportsdb.com"
      target="_blank"
      rel="noopener noreferrer"
      >TheSportsDB ↗</a
    ><a
      href="https://www.balldontlie.io"
      target="_blank"
      rel="noopener noreferrer"
      >BALLDONTLIE ↗</a
    >
  </footer>
</template>
