import { copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = resolve(raiz, 'public/icons/icon.svg')
const pasta = resolve(raiz, 'public/icons')
const vermelho = '#B3261E'

async function png(largura, destino) {
  await sharp(svg).resize(largura, largura).flatten({ background: vermelho }).png().toFile(resolve(pasta, destino))
}

await copyFile(svg, resolve(raiz, 'public/favicon.svg'))
await png(180, 'apple-touch-icon.png')
await png(192, 'icon-192.png')
await png(512, 'icon-512.png')

const lado = Math.round(512 * 0.78)
const miolo = await sharp(svg).resize(lado, lado).flatten({ background: vermelho }).png().toBuffer()

await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: '#B3261E',
  },
})
  .composite([{ input: miolo, gravity: 'centre' }])
  .png()
  .toFile(resolve(pasta, 'icon-maskable-512.png'))

console.log('Ícones gerados em public/icons')
