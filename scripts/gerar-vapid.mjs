import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const publica = publicKey.export({ format: 'jwk' })
const privada = privateKey.export({ format: 'jwk' })
const x = Buffer.from(publica.x, 'base64url')
const y = Buffer.from(publica.y, 'base64url')

const vapidPublica = Buffer.concat([Buffer.from([0x04]), x, y]).toString('base64url')
const vapidPrivada = Buffer.from(privada.d, 'base64url').toString('base64url')

console.log('Chave pública (cole em src/lib/vapid.ts):')
console.log(vapidPublica)
console.log('')
console.log('Chave privada (segredo VAPID_PRIVATE_KEY no Supabase, nunca no git):')
console.log(vapidPrivada)
console.log('')
console.log('Quem já tinha notificações ligadas precisa tocar em Ativar de novo.')
