import type { SupabaseClient } from '@supabase/supabase-js'
import { AVISO_SQL_NOVO, faltaSqlNovo } from './mensagens'
import type { RascunhoTarefa } from './tarefas'
import { pedeIntervalo, validarRascunho } from './tarefas'

type Cliente = SupabaseClient

export function mensagemAmigavel(mensagem: string, reserva: string): string {
  if (faltaSqlNovo(mensagem)) return AVISO_SQL_NOVO
  if (
    mensagem.includes('concluir_tarefa') ||
    mensagem.includes('desfazer_conclusao') ||
    mensagem.includes('Could not find the function') ||
    mensagem.includes('schema cache')
  ) {
    return 'Falta aplicar um SQL novo no Supabase. No SQL Editor, cole o arquivo supabase/migrations/20261012070000_concluir_e_desfazer.sql e clique em Run.'
  }
  if (/fetch|network|Failed to fetch/i.test(mensagem)) return 'Sem conexão. Tente de novo.'
  const limpa = mensagem.replace(/^Erro:\s*/i, '').trim()
  if (limpa && !/violat|constraint|duplicate|permission|JWT|syntax|stack/i.test(limpa)) return limpa
  return reserva
}

function falha(erro: { message: string } | null, reserva: string): string | null {
  if (!erro) return null
  return mensagemAmigavel(erro.message, reserva)
}

export async function concluirTarefa(cliente: Cliente, tarefaId: string): Promise<string | null> {
  const { error } = await cliente.rpc('concluir_tarefa', { p_tarefa_id: tarefaId })
  return falha(error, 'Não consegui concluir a tarefa.')
}

export async function desfazerConclusao(cliente: Cliente, conclusaoId: string): Promise<string | null> {
  const { error } = await cliente.rpc('desfazer_conclusao', { p_conclusao_id: conclusaoId })
  return falha(error, 'Não consegui desfazer.')
}

export async function gravarEtapa(
  cliente: Cliente,
  etapaId: string,
  marcar: boolean,
  usuarioId: string,
): Promise<string | null> {
  const { error } = await cliente
    .from('etapas')
    .update({
      concluida: marcar,
      concluida_em: marcar ? new Date().toISOString() : null,
      concluida_por: marcar ? usuarioId : null,
    })
    .eq('id', etapaId)
  return falha(error, 'Não consegui atualizar a etapa.')
}

export async function etapasConcluidas(cliente: Cliente, tarefaId: string): Promise<boolean | null> {
  const { data, error } = await cliente.from('etapas').select('concluida').eq('tarefa_id', tarefaId)
  if (error || !Array.isArray(data) || data.length === 0) return null
  return data.every((linha) => {
    if (!linha || typeof linha !== 'object') return false
    return (linha as { concluida?: unknown }).concluida === true
  })
}

export async function arquivarTarefa(cliente: Cliente, tarefaId: string): Promise<string | null> {
  const { data, error } = await cliente
    .from('tarefas')
    .update({ status: 'arquivada' })
    .eq('id', tarefaId)
    .select('id')
    .maybeSingle()
  if (error || !data) return falha(error, 'Não consegui arquivar.')
  return null
}

export async function reativarTarefa(
  cliente: Cliente,
  tarefaId: string,
  proximaData: string | null,
): Promise<string | null> {
  const campos: { status: 'ativa'; proxima_data?: string } = { status: 'ativa' }
  if (proximaData) campos.proxima_data = proximaData
  const { data, error } = await cliente.from('tarefas').update(campos).eq('id', tarefaId).select('id').maybeSingle()
  if (error || !data) return falha(error, 'Não consegui reativar.')
  return null
}

export async function salvarTarefa(cliente: Cliente, rascunho: RascunhoTarefa): Promise<string | null> {
  const erro = validarRascunho(rascunho)
  if (erro) return erro

  const titulo = rascunho.titulo.trim()
  const missao = rascunho.tipo === 'missao'
  const campos = {
    titulo,
    comodo_id: rascunho.comodoId,
    tipo: rascunho.tipo,
    estrelinhas: rascunho.estrelinhas,
    frequencia: missao ? 'nenhuma' : rascunho.frequencia,
    intervalo: missao || !pedeIntervalo(rascunho.frequencia) ? null : rascunho.intervalo,
    proxima_data: missao ? null : rascunho.proximaData,
  }

  let tarefaId = rascunho.id
  if (tarefaId) {
    const { data, error } = await cliente.from('tarefas').update(campos).eq('id', tarefaId).select('id').maybeSingle()
    const falhou = falha(error, 'Não consegui salvar a tarefa.')
    if (falhou || !data) return falhou ?? 'Não consegui salvar a tarefa.'
  } else {
    const { data, error } = await cliente
      .from('tarefas')
      .insert({ ...campos, status: 'ativa' })
      .select('id')
      .single()
    const falhou = falha(error, 'Não consegui criar a tarefa.')
    const id = data && typeof data === 'object' && 'id' in data && typeof data.id === 'string' ? data.id : null
    if (falhou || !id) return falhou ?? 'Não consegui criar a tarefa.'
    tarefaId = id
  }

  return sincronizarEtapas(cliente, tarefaId, missao ? rascunho.etapas : [])
}

async function sincronizarEtapas(
  cliente: Cliente,
  tarefaId: string,
  etapas: RascunhoTarefa['etapas'],
): Promise<string | null> {
  const { data, error } = await cliente.from('etapas').select('id').eq('tarefa_id', tarefaId)
  if (error) return 'A tarefa foi salva, mas as etapas não. Abra de novo e salve.'

  const atuais = new Set(
    (Array.isArray(data) ? data : [])
      .map((linha) => (linha && typeof linha === 'object' && 'id' in linha ? linha.id : null))
      .filter((id): id is string => typeof id === 'string'),
  )
  const preenchidas = etapas
    .map((etapa) => ({ id: etapa.id && atuais.has(etapa.id) ? etapa.id : undefined, titulo: etapa.titulo.trim() }))
    .filter((etapa) => etapa.titulo.length > 0)

  const mantidos = new Set(preenchidas.map((etapa) => etapa.id).filter((id): id is string => Boolean(id)))
  const apagar = [...atuais].filter((id) => !mantidos.has(id))
  if (apagar.length > 0) {
    const { error: erroApagar } = await cliente.from('etapas').delete().in('id', apagar)
    if (erroApagar) return 'A tarefa foi salva, mas as etapas não. Abra de novo e salve.'
  }

  for (const [indice, etapa] of preenchidas.entries()) {
    if (!etapa.id) continue
    const { error: erroOrdem } = await cliente
      .from('etapas')
      .update({ ordem: indice + 1 + 1000 })
      .eq('id', etapa.id)
    if (erroOrdem) return 'A tarefa foi salva, mas as etapas não. Abra de novo e salve.'
  }

  for (const [indice, etapa] of preenchidas.entries()) {
    if (etapa.id) {
      const { error: erroAtualizar } = await cliente
        .from('etapas')
        .update({ titulo: etapa.titulo, ordem: indice + 1 })
        .eq('id', etapa.id)
      if (erroAtualizar) return 'A tarefa foi salva, mas as etapas não. Abra de novo e salve.'
      continue
    }
    const { error: erroInserir } = await cliente.from('etapas').insert({
      tarefa_id: tarefaId,
      titulo: etapa.titulo,
      ordem: indice + 1,
    })
    if (erroInserir) return 'A tarefa foi salva, mas as etapas não. Abra de novo e salve.'
  }

  return null
}
