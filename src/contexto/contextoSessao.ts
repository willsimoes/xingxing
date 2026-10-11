import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Perfil } from '../lib/perfil'

export type ValorSessao = {
  sessao: Session | null | undefined
  perfil: Perfil | null
  outros: Perfil[]
  erroPerfil: string | null
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<string | null>
  salvarNome: (nome: string) => Promise<string | null>
}

export const ContextoSessao = createContext<ValorSessao | null>(null)
