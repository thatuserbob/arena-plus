import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true },
  runtimeConfig: {
    footballDataKey: '',
    balldontlieKey: '',
    sportsdbKey: '123',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;0,900;1,700;1,800&family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
      title: 'Arena+ — Beyond the Score',
      meta: [
        {
          name: 'description',
          content:
            'Six sports. Countless stories. Explore real fixtures, results and the seasons that shaped sport.',
        },
      ],
    },
  },
  devtools: { enabled: false },
})
