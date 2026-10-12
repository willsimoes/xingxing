import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Perfil } from '../lib/perfil'

export type ValorSessao = {
  sessao: Session | null | undefined
  perfil: Perfil | null
  outros: Perfil[]
  erroPerfil: string | null
  entrar: (username: string, senha: string) => Promise<string | null>
  sair: () => Promise<string | null>
  salvarPerfil: (dados: { nome: string; username: string; emoji: string }) => Promise<string | null>
}

export const ContextoSessao = createContext<ValorSessao | null>(null)
