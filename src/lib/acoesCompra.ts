import type { SupabaseClient } from '@supabase/supabase-js'
import { avisoDeVariasSemanas, lerFechamento, type ResultadoFechamento } from './fechamento'
import { mensagemAmigavel } from './acoesTarefa'
import { AVISO_SQL_NOVO, faltaSqlNovo } from './mensagens'

type Cliente = SupabaseClient

function falha(erro: { message: string } | null, reserva: string): string | null {
  if (!erro) return null
  return mensagemAmigavel(erro.message, reserva)
}

export function validarItemCompra(nome: string): string | null {
  const limpo = nome.trim()
  if (!limpo) return 'Escreva o que falta comprar.'
  if (limpo.length > 80) return 'Use um nome de até 80 caracteres.'
  return null
}

export async function adicionarItem(cliente: Cliente, nome: string, usuarioId: string): Promise<string | null> {
  const erroNome = validarItemCompra(nome)
  if (erroNome) return erroNome
  const { error } = await cliente.from('itens_compra').insert({ nome: nome.trim(), criado_por: usuarioId })
  return falha(error, 'Não consegui adicionar o item.')
}

export async function marcarItem(
  cliente: Cliente,
  itemId: string,
  comprado: boolean,
  usuarioId: string,
): Promise<string | null> {
  const { data, error } = await cliente
    .from('itens_compra')
    .update({
      comprado,
      comprado_em: comprado ? new Date().toISOString() : null,
      comprado_por: comprado ? usuarioId : null,
    })
    .eq('id', itemId)
    .is('tarefa_id', null)
    .select('id')
    .maybeSingle()
  if (error || !data) return falha(error, 'Não consegui atualizar o item.')
  return null
}

export async function comprarTarefa(cliente: Cliente, tarefaId: string): Promise<string | null> {
  const { error } = await cliente.rpc('comprar_tarefa', { p_tarefa_id: tarefaId })
  return falha(error, 'Não consegui marcar a compra.')
}

export async function limparComprados(cliente: Cliente): Promise<string | null> {
  const { error } = await cliente.from('itens_compra').delete().eq('comprado', true)
  return falha(error, 'Não consegui limpar os comprados.')
}

export async function fecharSemanas(cliente: Cliente): Promise<{
  resultado: ResultadoFechamento | null
  aviso: string | null
  erro: string | null
  semFuncao: boolean
}> {
  const { data, error } = await cliente.rpc('fechar_semanas')
  if (error) {
    const semFuncao = faltaSqlNovo(error.message)
    return {
      resultado: null,
      aviso: null,
      erro: semFuncao ? AVISO_SQL_NOVO : mensagemAmigavel(error.message, 'Não consegui fechar a semana.'),
      semFuncao,
    }
  }
  const resultado = lerFechamento(data)
  return { resultado, aviso: resultado ? avisoDeVariasSemanas(resultado.fechadas) : null, erro: null, semFuncao: false }
}
