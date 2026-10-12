import type { SupabaseClient } from '@supabase/supabase-js'
import { mensagemAmigavel } from './acoesTarefa'
import { AVISO_LOJA, faltaSqlLoja } from './loja'

type Cliente = SupabaseClient

function falha(erro: { message: string } | null, reserva: string): string | null {
  if (!erro) return null
  if (faltaSqlLoja(erro.message)) return AVISO_LOJA
  return mensagemAmigavel(erro.message, reserva)
}

export async function resgatarCupom(
  cliente: Cliente,
  cupomId: string,
  tarefaId: string | null,
  quem: string | null,
): Promise<string | null> {
  const { error } = await cliente.rpc('resgatar_cupom', {
    p_cupom_id: cupomId,
    p_tarefa_id: tarefaId,
    p_quem: quem,
  })
  return falha(error, 'Não consegui resgatar o cupom.')
}

export async function marcarCupomFeito(cliente: Cliente, resgateId: string): Promise<string | null> {
  const { error } = await cliente.rpc('marcar_cupom_feito', { p_resgate_id: resgateId })
  return falha(error, 'Não consegui marcar o cupom.')
}

export async function confirmarCupom(cliente: Cliente, resgateId: string): Promise<string | null> {
  const { error } = await cliente.rpc('confirmar_cupom', { p_resgate_id: resgateId })
  return falha(error, 'Não consegui carimbar o cupom.')
}

export async function aceitarPassaVez(cliente: Cliente, resgateId: string): Promise<string | null> {
  const { error } = await cliente.rpc('aceitar_passa_vez', { p_resgate_id: resgateId })
  return falha(error, 'Não consegui aceitar.')
}

export async function negociarPassaVez(cliente: Cliente, resgateId: string): Promise<string | null> {
  const { error } = await cliente.rpc('negociar_passa_vez', { p_resgate_id: resgateId })
  return falha(error, 'Não consegui devolver o cupom.')
}

export async function depositarCofrinho(cliente: Cliente, quantidade: number): Promise<string | null> {
  const { error } = await cliente.rpc('depositar_cofrinho', { p_quantidade: quantidade })
  return falha(error, 'Não consegui depositar.')
}

export async function salvarCupom(
  cliente: Cliente,
  cupom: {
    id: string | null
    titulo: string
    descricao: string
    icone: string
    custo: number
    limiteSemana: number | null
    prazoDias: number | null
    ativo: boolean
  },
): Promise<string | null> {
  const { error } = await cliente.rpc('salvar_cupom', {
    p_id: cupom.id,
    p_titulo: cupom.titulo,
    p_descricao: cupom.descricao,
    p_icone: cupom.icone,
    p_custo: cupom.custo,
    p_limite: cupom.limiteSemana,
    p_prazo: cupom.prazoDias,
    p_ativo: cupom.ativo,
  })
  return falha(error, 'Não consegui salvar o cupom.')
}

export async function salvarCofrinho(
  cliente: Cliente,
  desejo: { titulo: string; descricao: string; custo: number },
): Promise<string | null> {
  const { error } = await cliente.rpc('salvar_cofrinho', {
    p_titulo: desejo.titulo,
    p_descricao: desejo.descricao,
    p_custo: desejo.custo,
  })
  return falha(error, 'Não consegui salvar o cofrinho.')
}

export async function salvarLimitePassaVez(cliente: Cliente, valor: number): Promise<string | null> {
  const { error } = await cliente.rpc('salvar_parametro', { p_chave: 'passa_vez_limite', p_valor: valor })
  return falha(error, 'Não consegui salvar o limite.')
}
