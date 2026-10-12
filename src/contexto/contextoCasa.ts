import { createContext } from 'react'
import type { RascunhoTarefa } from '../lib/tarefas'
import type { DadosCasa } from '../lib/lerCasa'

export type ValorCasa = {
  carregando: boolean
  erro: string | null
  avisoFechamento: string | null
  dados: DadosCasa | null
  hoje: string
  semana: string
  animacaoEstrela: number
  concluir: (tarefaId: string) => Promise<string | null>
  desfazer: (conclusaoId: string) => Promise<string | null>
  marcarEtapa: (etapaId: string, marcar: boolean) => Promise<string | null>
  salvar: (rascunho: RascunhoTarefa) => Promise<string | null>
  arquivar: (tarefaId: string) => Promise<string | null>
  reativar: (tarefaId: string) => Promise<string | null>
  adicionarCompra: (nome: string) => Promise<string | null>
  marcarCompra: (itemId: string, comprado: boolean) => Promise<string | null>
  comprarTarefa: (tarefaId: string) => Promise<string | null>
  limparCompras: () => Promise<string | null>
}

export const ContextoCasa = createContext<ValorCasa | null>(null)
