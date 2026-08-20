/**
 * Gera public/og-image.png a partir do SVG.
 *
 * As metatags og:image e twitter:image apontam para o PNG porque LinkedIn,
 * WhatsApp e Twitter nao renderizam SVG em preview de link.
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../public/', import.meta.url))
const svg = await readFile(dir + 'og-image.svg')

const png = await sharp(svg, { density: 200 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toBuffer()

await writeFile(dir + 'og-image.png', png)
console.log(`og-image.png gerado — ${(png.length / 1024).toFixed(1)} KB`)
