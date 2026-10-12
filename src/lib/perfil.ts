export type Perfil = {
  id: string
  nome: string
  username: string
  emoji: string
  cor: string
}

export const SUGESTOES_EMOJI = [
  '🌟',
  '🌸',
  '🍵',
  '🐱',
  '🐶',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐵',
  '🐸',
  '🦄',
  '🌈',
  '🌙',
  '☀️',
  '🍀',
  '🍓',
  '🍑',
  '💚',
  '💛',
  '💜',
  '🔥',
  '📚',
  '🎵',
]

export function lerPerfil(valor: unknown): Perfil | null {
  if (!valor || typeof valor !== 'object') return null
  const linha = valor as Record<string, unknown>
  if (typeof linha.id !== 'string' || typeof linha.nome !== 'string') return null
  if (typeof linha.emoji !== 'string' || typeof linha.cor !== 'string') return null
  if (typeof linha.username !== 'string') return null
  return {
    id: linha.id,
    nome: linha.nome,
    username: linha.username,
    emoji: linha.emoji,
    cor: linha.cor,
  }
}

export function limparUsername(valor: string): string {
  return valor.trim().toLowerCase().replace(/^@+/, '')
}

export function usernameValido(valor: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(limparUsername(valor))
}

export function emojiUnico(valor: string): string | null {
  const limpo = valor.trim()
  if (!limpo || limpo.length > 32) return null
  const partes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(limpo)]
  if (partes.length !== 1) return null
  return limpo
}

export function rotuloCurto(pessoa: Pick<Perfil, 'nome' | 'username'>): string {
  if (pessoa.username) return `@${pessoa.username}`
  return pessoa.nome || 'Alguém'
}

export function comoChamar(pessoas: Perfil[], id: string): string {
  const pessoa = pessoas.find((item) => item.id === id)
  return pessoa ? rotuloCurto(pessoa) : 'Alguém'
}

export function corSegura(cor: string): string | null {
  return /^#[0-9A-Fa-f]{6}$/.test(cor) ? cor : null
}
