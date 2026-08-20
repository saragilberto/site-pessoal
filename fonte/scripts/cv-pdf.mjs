/**
 * Gera os PDFs do curriculo a partir das paginas /cv/ e /en/cv/ ja
 * construidas em dist/.
 *
 * Roda depois do build (postbuild) e escreve direto em dist/, entao o PDF
 * nunca fica defasado em relacao ao conteudo: e sempre a mesma fonte.
 *
 * Sobe um servidor estatico efemero porque as paginas referenciam o CSS por
 * caminho absoluto (/_astro/...), que file:// nao resolve.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

const servidor = createServer(async (req, res) => {
  try {
    let caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (caminho.endsWith('/')) caminho += 'index.html'
    const arquivo = join(dist, caminho)
    if (!arquivo.startsWith(dist)) throw new Error('fora de dist')
    const corpo = await readFile(arquivo)
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' })
    res.end(corpo)
  } catch {
    res.writeHead(404).end('nao encontrado')
  }
})

await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok))
const base = `http://127.0.0.1:${servidor.address().port}`

const navegador = await chromium.launch()
const pagina = await navegador.newPage()

const SAIDAS = [
  { rota: '/cv/', arquivo: 'cv-sara-pereira.pdf' },
  { rota: '/en/cv/', arquivo: 'cv-sara-pereira-en.pdf' },
]

for (const { rota, arquivo } of SAIDAS) {
  await pagina.goto(base + rota, { waitUntil: 'networkidle' })
  await pagina.pdf({
    path: join(dist, arquivo),
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  })
  console.log(`${arquivo} gerado`)
}

await navegador.close()
servidor.close()
