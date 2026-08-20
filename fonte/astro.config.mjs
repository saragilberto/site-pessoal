import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://saracgpereira.com',
  integrations: [
    tailwind(),
    // O curriculo e noindex — nao faz sentido no sitemap.
    sitemap({ filter: (url) => !url.includes('/cv') }),
  ],
  build: { inlineStylesheets: 'never' },
})
