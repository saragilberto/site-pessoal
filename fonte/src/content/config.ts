import { defineCollection, z } from 'astro:content'

/**
 * Textos tecnicos, so em ingles.
 *
 * A secao existe para ser achada por busca por quem contrata fora do Brasil —
 * traduzir para portugues dobraria o trabalho sem servir esse objetivo.
 *
 * `draft: true` mantem o texto fora do build ate estar pronto.
 */
const writing = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = { writing }
