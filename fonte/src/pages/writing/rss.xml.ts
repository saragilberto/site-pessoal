import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

/**
 * Feed dos textos. Existe para que quem acompanha a area — inclusive
 * agregadores de conteudo tecnico — receba post novo sem depender de rede
 * social nenhuma.
 */
export async function GET(context: APIContext) {
  const posts = await getCollection('writing', ({ data }) => !data.draft)

  return rss({
    title: 'Sara Pereira — Writing',
    description:
      'Notes on multi-tenant architecture, MCP agents in production and proving refactors safe.',
    site: context.site ?? 'https://saracgpereira.com',
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/writing/${post.slug}/`,
        categories: post.data.tags,
      })),
    customData: '<language>en</language>',
  })
}
