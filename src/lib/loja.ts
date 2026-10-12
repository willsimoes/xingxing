import type { SupabaseClient } from '@supabase/supabase-js'

export const AVISO_LOJA =
  'Falta aplicar um SQL novo no Supabase. No SQL Editor, cole o arquivo supabase/migrations/20261012200000_loja_e_saldos.sql e clique em Run.'

export type TipoCupom = 'cupom' | 'passa_vez'
export type StatusResgate = 'pendente' | 'feito' | 'cumprido' | 'aceito' | 'negociado'
export type StatusCofrinho = 'aberto' | 'completo'

export type Cupom = {
  id: string
  titulo: string
  descricao: string
  custo: number
  icone: string
  ativo: boolean
  limiteSemana: number | null
  prazoDias: number | null
  tipo: TipoCupom
  ordem: number
}

export type Resgate = {
  id: string
  cupomId: string
  quemResgatou: string
  quemCumpre: string
  status: StatusResgate
  tarefaId: string | null
  prazo: string | null
  estrelinhas: number
  semana: string
  criadoEm: string
}

export type Cofrinho = {
  id: string
  titulo: string
  descricao: string
  icone: string
  custo: number
  status: StatusCofrinho
  criadoEm: string
}

export type Movimento = {
  id: string
  usuarioId: string
  quantidade: number
  motivo: string
  descricao: string
  criadoEm: string
}

export type Aporte = {
  usuarioId: string
  total: number
  ordem: number
}

export type DadosLoja = {
  cupons: Cupom[]
  resgates: Resgate[]
  cofrinho: Cofrinho | null
  aportes: Aporte[]
  movimentos: Movimento[]
  ganhas: number
  disponivel: number
  limitePassaVez: number
}

const tipos = new Set<TipoCupom>(['cupom', 'passa_vez'])
const statusResgate = new Set<StatusResgate>(['pendente', 'feito', 'cumprido', 'aceito', 'negociado'])
const statusCofrinho = new Set<StatusCofrinho>(['aberto', 'completo'])

function registro(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== 'object') return null
  return valor as Record<string, unknown>
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

function inteiro(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isInteger(valor)) return valor
  if (typeof valor === 'string' && /^-?\d+$/.test(valor)) return Number(valor)
  return null
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : []
}

export function faltaSqlLoja(mensagem: string): boolean {
  return /movimentos|resgates|cofrinhos|meus_saldos|aportes_cofrinho|resgatar_cupom|parametros|schema cache|does not exist|Could not find/i.test(
    mensagem,
  )
}

function lerCupom(valor: unknown): Cupom | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const titulo = texto(linha.titulo)
  const descricao = texto(linha.descricao)
  const icone = texto(linha.icone)
  const tipo = texto(linha.tipo)
  const custo = inteiro(linha.custo)
  const ordem = inteiro(linha.ordem)
  if (!id || !titulo || descricao === null || !icone || custo === null || custo < 0 || ordem === null) return null
  if (!tipo || !tipos.has(tipo as TipoCupom) || typeof linha.ativo !== 'boolean') return null
  const limite = linha.limite_semana === null || linha.limite_semana === undefined ? null : inteiro(linha.limite_semana)
  if (linha.limite_semana !== null && linha.limite_semana !== undefined && limite === null) return null
  const prazo = linha.prazo_dias === null || linha.prazo_dias === undefined ? null : inteiro(linha.prazo_dias)
  if (linha.prazo_dias !== null && linha.prazo_dias !== undefined && prazo === null) return null
  return {
    id,
    titulo,
    descricao,
    custo,
    icone,
    ativo: linha.ativo,
    limiteSemana: limite,
    prazoDias: prazo,
    tipo: tipo as TipoCupom,
    ordem,
  }
}

function lerResgate(valor: unknown): Resgate | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const cupomId = texto(linha.cupom_id)
  const quemResgatou = texto(linha.quem_resgatou)
  const quemCumpre = texto(linha.quem_cumpre)
  const status = texto(linha.status)
  const estrelinhas = inteiro(linha.estrelinhas)
  const semana = texto(linha.semana)?.slice(0, 10) ?? null
  const criadoEm = texto(linha.criado_em)
  if (!id || !cupomId || !quemResgatou || !quemCumpre || !status || !statusResgate.has(status as StatusResgate)) return null
  if (estrelinhas === null || estrelinhas < 0 || !semana || !criadoEm) return null
  const tarefaId = linha.tarefa_id === null || linha.tarefa_id === undefined ? null : texto(linha.tarefa_id)
  if (linha.tarefa_id !== null && linha.tarefa_id !== undefined && !tarefaId) return null
  const prazo = linha.prazo === null || linha.prazo === undefined ? null : texto(linha.prazo)
  return {
    id,
    cupomId,
    quemResgatou,
    quemCumpre,
    status: status as StatusResgate,
    tarefaId,
    prazo,
    estrelinhas,
    semana,
    criadoEm,
  }
}

function lerCofrinho(valor: unknown): Cofrinho | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const titulo = texto(linha.titulo)
  const descricao = texto(linha.descricao)
  const icone = texto(linha.icone)
  const custo = inteiro(linha.custo)
  const status = texto(linha.status)
  const criadoEm = texto(linha.criado_em)
  if (!id || !titulo || descricao === null || !icone || custo === null || custo < 1 || !criadoEm) return null
  if (!status || !statusCofrinho.has(status as StatusCofrinho)) return null
  return { id, titulo, descricao, icone, custo, status: status as StatusCofrinho, criadoEm }
}

function lerMovimento(valor: unknown): Movimento | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const usuarioId = texto(linha.usuario_id)
  const quantidade = inteiro(linha.quantidade)
  const motivo = texto(linha.motivo)
  const descricao = texto(linha.descricao)
  const criadoEm = texto(linha.criado_em)
  if (!id || !usuarioId || quantidade === null || quantidade === 0 || !motivo || descricao === null || !criadoEm) return null
  return { id, usuarioId, quantidade, motivo, descricao, criadoEm }
}

function lerAporte(valor: unknown): Aporte | null {
  const linha = registro(valor)
  if (!linha) return null
  const usuarioId = texto(linha.usuario_id)
  const total = inteiro(linha.total)
  const ordem = inteiro(linha.ordem)
  if (!usuarioId || total === null || total < 0 || ordem === null || ordem < 1) return null
  return { usuarioId, total, ordem }
}

function lerSaldos(valor: unknown): { ganhas: number; disponivel: number } | null {
  const linha = registro(valor)
  if (!linha) return null
  const ganhas = inteiro(linha.ganhas)
  const disponivel = inteiro(linha.disponivel)
  if (ganhas === null || disponivel === null) return null
  return { ganhas, disponivel }
}

export const ICONES_CUPOM: { codigo: string; rotulo: string }[] = [
  { codigo: 'filme', rotulo: 'Filme' },
  { codigo: 'prato', rotulo: 'Prato' },
  { codigo: 'xicara', rotulo: 'Xícara' },
  { codigo: 'maos', rotulo: 'Mãos' },
  { codigo: 'esponja', rotulo: 'Esponja' },
  { codigo: 'sol', rotulo: 'Sol' },
  { codigo: 'troca', rotulo: 'Troca' },
  { codigo: 'pote', rotulo: 'Pote' },
  { codigo: 'presente', rotulo: 'Presente' },
  { codigo: 'flor', rotulo: 'Flor' },
  { codigo: 'livro', rotulo: 'Livro' },
  { codigo: 'musica', rotulo: 'Música' },
  { codigo: 'jogo', rotulo: 'Jogo' },
  { codigo: 'bolo', rotulo: 'Bolo' },
  { codigo: 'casa', rotulo: 'Casa' },
  { codigo: 'lua', rotulo: 'Lua' },
  { codigo: 'passo', rotulo: 'Passo' },
  { codigo: 'gota', rotulo: 'Gota' },
  { codigo: 'carta', rotulo: 'Carta' },
  { codigo: 'estrela', rotulo: 'Estrela' },
]

export function iconeConhecido(codigo: string): boolean {
  return ICONES_CUPOM.some((item) => item.codigo === codigo)
}

export function custoPassaVez(base: number, estrelinhas: number): number {
  return base + Math.ceil(estrelinhas / 2)
}

export function resgatesNaSemana(resgates: Resgate[], cupomId: string, usuarioId: string, semana: string): number {
  return resgates.filter(
    (resgate) =>
      resgate.cupomId === cupomId &&
      resgate.quemResgatou === usuarioId &&
      resgate.semana === semana &&
      resgate.status !== 'negociado',
  ).length
}

export async function lerLoja(cliente: SupabaseClient): Promise<{ dados: DadosLoja | null; erro: string | null }> {
  const [cupons, resgates, cofrinhos, movimentos, parametros, saldos, aportes] = await Promise.all([
    cliente.from('cupons').select('id, titulo, descricao, custo, icone, ativo, limite_semana, prazo_dias, tipo, ordem').order('ordem'),
    cliente
      .from('resgates')
      .select('id, cupom_id, quem_resgatou, quem_cumpre, status, tarefa_id, prazo, estrelinhas, semana, criado_em')
      .order('criado_em', { ascending: false }),
    cliente.from('cofrinhos').select('id, titulo, descricao, icone, custo, status, criado_em').order('criado_em', { ascending: false }),
    cliente
      .from('movimentos')
      .select('id, usuario_id, quantidade, motivo, descricao, criado_em')
      .order('criado_em', { ascending: false }),
    cliente.from('parametros').select('chave, valor').eq('chave', 'passa_vez_limite').maybeSingle(),
    cliente.rpc('meus_saldos'),
    cliente.rpc('aportes_cofrinho'),
  ])

  const mensagens = [cupons.error, resgates.error, cofrinhos.error, movimentos.error, parametros.error, saldos.error, aportes.error].flatMap(
    (item) => (item ? [item.message] : []),
  )
  if (mensagens.length > 0) {
    const textoErro = mensagens.join(' ')
    if (/jwt|session/i.test(textoErro)) return { dados: null, erro: 'Sua sessão expirou. Saia e entre de novo.' }
    if (faltaSqlLoja(textoErro)) return { dados: null, erro: AVISO_LOJA }
    return { dados: null, erro: 'Não consegui ler a lojinha. Confira a conexão e se a migration rodou no Supabase.' }
  }

  const saldosLidos = lerSaldos(saldos.data)
  if (!saldosLidos) return { dados: null, erro: 'Não consegui calcular as estrelinhas.' }

  const listaCofrinhos = lista(cofrinhos.data).map(lerCofrinho).filter((item): item is Cofrinho => item !== null)
  const aberto = listaCofrinhos.find((item) => item.status === 'aberto') ?? listaCofrinhos[0] ?? null
  const limite = inteiro((parametros.data as { valor?: unknown } | null)?.valor)

  return {
    erro: null,
    dados: {
      cupons: lista(cupons.data)
        .map(lerCupom)
        .filter((item): item is Cupom => item !== null)
        .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, 'pt-BR')),
      resgates: lista(resgates.data).map(lerResgate).filter((item): item is Resgate => item !== null),
      cofrinho: aberto,
      aportes: lista(aportes.data).map(lerAporte).filter((item): item is Aporte => item !== null),
      movimentos: lista(movimentos.data).map(lerMovimento).filter((item): item is Movimento => item !== null),
      ganhas: saldosLidos.ganhas,
      disponivel: saldosLidos.disponivel,
      limitePassaVez: limite !== null && limite > 0 ? limite : 1,
    },
  }
}
