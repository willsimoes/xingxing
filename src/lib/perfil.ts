export type Perfil = {
  id: string
  nome: string
  emoji: string
  cor: string
}

export function lerPerfil(valor: unknown): Perfil | null {
  if (!valor || typeof valor !== 'object') return null
  const linha = valor as Record<string, unknown>
  if (typeof linha.id !== 'string' || typeof linha.nome !== 'string') return null
  if (typeof linha.emoji !== 'string' || typeof linha.cor !== 'string') return null
  return { id: linha.id, nome: linha.nome, emoji: linha.emoji, cor: linha.cor }
}

export function nomeDe(pessoas: Perfil[], id: string): string {
  return pessoas.find((pessoa) => pessoa.id === id)?.nome ?? 'Alguém'
}

export function corSegura(cor: string): string | null {
  return /^#[0-9A-Fa-f]{6}$/.test(cor) ? cor : null
}
