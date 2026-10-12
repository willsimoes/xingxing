import type { SupabaseClient } from '@supabase/supabase-js'
import { AVISO_SQL_NOVO, faltaSqlNovo } from './mensagens'
import type { CasaConfig, Comodo, Conclusao, Etapa, ItemCompra, Tarefa } from './tarefas'
import { lerCasa, lerComodo, lerConclusao, lerEtapa, lerItemCompra, lerTarefa } from './tarefas'

export type DadosCasa = {
  comodos: Comodo[]
  tarefas: Tarefa[]
  etapas: Etapa[]
  conclusoes: Conclusao[]
  itens: ItemCompra[]
  casa: CasaConfig
}

type Cliente = SupabaseClient

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

export async function lerTudo(cliente: Cliente): Promise<{ dados: DadosCasa | null; erro: string | null }> {
  const [comodos, tarefas, etapas, conclusoes, itens, casaInicial] = await Promise.all([
    cliente.from('comodos').select('id, nome, emoji, ordem').order('ordem'),
    cliente
      .from('tarefas')
      .select('id, comodo_id, titulo, tipo, estrelinhas, frequencia, intervalo, proxima_data, status, libera_tarefa_id'),
    cliente.from('etapas').select('id, tarefa_id, titulo, ordem, concluida, concluida_em, concluida_por').order('ordem'),
    cliente
      .from('conclusoes')
      .select('id, tarefa_id, usuario_id, quando, estrelinhas_base, estrelinhas_bonus, semana'),
    cliente
      .from('itens_compra')
      .select('id, nome, tarefa_id, comprado, comprado_em, comprado_por, criado_por, criado_em'),
    cliente
      .from('casa')
      .select('meta_semanal, recompensa, fuso, bonus_por_dia, semanas_seguidas, ultima_semana_fechada, ultima_semana_bateu')
      .eq('id', 1)
      .maybeSingle(),
  ])

  let casa = casaInicial
  if (casa.error && faltaSqlNovo(casa.error.message)) {
    casa = await cliente
      .from('casa')
      .select('meta_semanal, recompensa, fuso, bonus_por_dia, semanas_seguidas')
      .eq('id', 1)
      .maybeSingle()
  }

  const mensagens = [comodos.error, tarefas.error, etapas.error, conclusoes.error, itens.error, casa.error].flatMap(
    (item) => (item ? [item.message] : []),
  )

  if (mensagens.length > 0) {
    const texto = mensagens.join(' ')
    if (/jwt|session/i.test(texto)) {
      return { dados: null, erro: 'Sua sessão expirou. Saia e entre de novo.' }
    }
    if (faltaSqlNovo(texto)) return { dados: null, erro: AVISO_SQL_NOVO }
    return {
      dados: null,
      erro: 'Não consegui ler as tarefas. Confira a conexão e se a migration rodou no Supabase.',
    }
  }

  const config = lerCasa(casa.data)
  if (!config) return { dados: null, erro: 'Não achei a configuração da casa. Rode a migration no Supabase.' }

  return {
    erro: null,
    dados: {
      casa: config,
      comodos: lista(comodos.data).map(lerComodo).filter((item): item is Comodo => item !== null),
      tarefas: lista(tarefas.data).map(lerTarefa).filter((item): item is Tarefa => item !== null),
      etapas: lista(etapas.data)
        .map(lerEtapa)
        .filter((item): item is Etapa => item !== null)
        .sort((a, b) => a.ordem - b.ordem),
      conclusoes: lista(conclusoes.data).map(lerConclusao).filter((item): item is Conclusao => item !== null),
      itens: lista(itens.data).map(lerItemCompra).filter((item): item is ItemCompra => item !== null),
    },
  }
}
