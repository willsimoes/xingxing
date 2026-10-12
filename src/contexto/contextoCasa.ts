import { createContext } from 'react'
import type { DadosLoja, Cupom } from '../lib/loja'
import type { RascunhoTarefa } from '../lib/tarefas'
import type { DadosCasa } from '../lib/lerCasa'

export type ValorCasa = {
  carregando: boolean
  erro: string | null
  avisoFechamento: string | null
  dados: DadosCasa | null
  dadosLoja: DadosLoja | null
  erroLoja: string | null
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
  resgatar: (cupomId: string, tarefaId: string | null, quem: string | null) => Promise<string | null>
  marcarFeito: (resgateId: string) => Promise<string | null>
  confirmarResgate: (resgateId: string) => Promise<string | null>
  aceitarPassa: (resgateId: string) => Promise<string | null>
  devolverPassa: (resgateId: string) => Promise<string | null>
  depositar: (quantidade: number) => Promise<string | null>
  salvarCupomLoja: (cupom: Cupom) => Promise<string | null>
  salvarDesejo: (titulo: string, descricao: string, custo: number) => Promise<string | null>
  salvarLimite: (valor: number) => Promise<string | null>
}

export const ContextoCasa = createContext<ValorCasa | null>(null)
