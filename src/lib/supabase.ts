import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function limpar(valor: string | undefined): string {
  const texto = (valor ?? '').trim()
  const aspas =
    (texto.startsWith('"') && texto.endsWith('"')) || (texto.startsWith("'") && texto.endsWith("'"))
  return aspas ? texto.slice(1, -1).trim() : texto
}

function chaveSecreta(valor: string): boolean {
  if (valor.startsWith('sb_secret_')) return true
  const partes = valor.split('.')
  if (partes.length !== 3) return false
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const preenchido = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(preenchido)) as { role?: string }
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

const url = limpar(import.meta.env.VITE_SUPABASE_URL)
const chave = limpar(import.meta.env.VITE_SUPABASE_ANON_KEY)

export type ProblemaConfig = 'vazia' | 'secreta'

export const problemaConfig: ProblemaConfig | null =
  !url || !chave ? 'vazia' : chaveSecreta(chave) ? 'secreta' : null

export const supabase: SupabaseClient | null = problemaConfig
  ? null
  : createClient(url, chave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
        storageKey: 'xingxing-sessao',
      },
    })
