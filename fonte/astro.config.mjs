import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://saracgpereira.com',
  integrations: [tailwind()],
  build: { inlineStylesheets: 'never' },
})
