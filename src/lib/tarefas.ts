import { dataNoFuso, dataValida, diferencaDias } from './datas'

export type Frequencia =
  | 'nenhuma'
  | 'diaria'
  | 'a_cada_n_dias'
  | 'n_vezes_por_semana'
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'validade'

export type TipoTarefa = 'rotina' | 'missao' | 'compra'
export type StatusTarefa = 'ativa' | 'bloqueada' | 'arquivada'

export type Comodo = {
  id: string
  nome: string
  emoji: string
  ordem: number
}

export type Tarefa = {
  id: string
  comodoId: string | null
  titulo: string
  tipo: TipoTarefa
  estrelinhas: number
  frequencia: Frequencia
  intervalo: number | null
  proximaData: string | null
  status: StatusTarefa
  liberaTarefaId: string | null
}

export type Etapa = {
  id: string
  tarefaId: string
  titulo: string
  ordem: number
  concluida: boolean
  concluidaEm: string | null
  concluidaPor: string | null
}

export type Conclusao = {
  id: string
  tarefaId: string
  usuarioId: string
  quando: string
  estrelinhasBase: number
  estrelinhasBonus: number
  semana: string
}

export type CasaConfig = {
  metaSemanal: number
  recompensa: string
  fuso: string
  bonusPorDia: number
  semanasSeguidas: number
  ultimaSemanaFechada: string | null
  ultimaSemanaBateu: boolean | null
}

export type ItemCompra = {
  id: string
  nome: string
  tarefaId: string | null
  comprado: boolean
  compradoEm: string | null
  compradoPor: string | null
  criadoPor: string | null
  criadoEm: string
}

export type RascunhoEtapa = {
  id?: string
  titulo: string
}

export type RascunhoTarefa = {
  id?: string
  titulo: string
  comodoId: string
  tipo: 'rotina' | 'missao'
  estrelinhas: number
  frequencia: Frequencia
  intervalo: number | null
  proximaData: string | null
  etapas: RascunhoEtapa[]
}

export const frequenciasRotina: { id: Frequencia; rotulo: string }[] = [
  { id: 'diaria', rotulo: 'Todo dia' },
  { id: 'a_cada_n_dias', rotulo: 'A cada quantos dias' },
  { id: 'n_vezes_por_semana', rotulo: 'Várias vezes por semana' },
  { id: 'semanal', rotulo: 'Toda semana' },
  { id: 'quinzenal', rotulo: 'A cada duas semanas' },
  { id: 'mensal', rotulo: 'Todo mês' },
  { id: 'validade', rotulo: 'Conforme a validade' },
]

const frequencias = new Set<Frequencia>([
  'nenhuma',
  'diaria',
  'a_cada_n_dias',
  'n_vezes_por_semana',
  'semanal',
  'quinzenal',
  'mensal',
  'validade',
])

const tipos = new Set<TipoTarefa>(['rotina', 'missao', 'compra'])
const status = new Set<StatusTarefa>(['ativa', 'bloqueada', 'arquivada'])

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

function dataCurta(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const curta = valor.slice(0, 10)
  return dataValida(curta) ? curta : null
}

export function lerComodo(valor: unknown): Comodo | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const nome = texto(linha.nome)
  const emoji = texto(linha.emoji)
  const ordem = inteiro(linha.ordem)
  if (!id || !nome || !emoji || ordem === null) return null
  return { id, nome, emoji, ordem }
}

export function lerTarefa(valor: unknown): Tarefa | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const titulo = texto(linha.titulo)
  const tipo = texto(linha.tipo)
  const frequencia = texto(linha.frequencia)
  const estrelinhas = inteiro(linha.estrelinhas)
  const situacao = texto(linha.status)
  if (!id || !titulo || estrelinhas === null || estrelinhas < 0) return null
  if (!tipo || !tipos.has(tipo as TipoTarefa)) return null
  if (!frequencia || !frequencias.has(frequencia as Frequencia)) return null
  if (!situacao || !status.has(situacao as StatusTarefa)) return null
  const intervalo = linha.intervalo === null ? null : inteiro(linha.intervalo)
  if (linha.intervalo !== null && intervalo === null) return null
  const proxima = linha.proxima_data === null ? null : dataCurta(linha.proxima_data)
  if (linha.proxima_data !== null && !proxima) return null
  const comodoId = linha.comodo_id === null ? null : texto(linha.comodo_id)
  const libera = linha.libera_tarefa_id === null ? null : texto(linha.libera_tarefa_id)
  return {
    id,
    comodoId,
    titulo,
    tipo: tipo as TipoTarefa,
    estrelinhas,
    frequencia: frequencia as Frequencia,
    intervalo,
    proximaData: proxima,
    status: situacao as StatusTarefa,
    liberaTarefaId: libera,
  }
}

export function lerEtapa(valor: unknown): Etapa | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const tarefaId = texto(linha.tarefa_id)
  const titulo = texto(linha.titulo)
  const ordem = inteiro(linha.ordem)
  if (!id || !tarefaId || !titulo || ordem === null || typeof linha.concluida !== 'boolean') return null
  const concluidaEm = linha.concluida_em === null ? null : texto(linha.concluida_em)
  const concluidaPor = linha.concluida_por === null ? null : texto(linha.concluida_por)
  return { id, tarefaId, titulo, ordem, concluida: linha.concluida, concluidaEm, concluidaPor }
}

export function lerConclusao(valor: unknown): Conclusao | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const tarefaId = texto(linha.tarefa_id)
  const usuarioId = texto(linha.usuario_id)
  const quando = texto(linha.quando)
  const base = inteiro(linha.estrelinhas_base)
  const bonus = inteiro(linha.estrelinhas_bonus)
  const semana = dataCurta(linha.semana)
  if (!id || !tarefaId || !usuarioId || !quando || base === null || bonus === null || !semana) return null
  if (Number.isNaN(new Date(quando).getTime())) return null
  return {
    id,
    tarefaId,
    usuarioId,
    quando,
    estrelinhasBase: base,
    estrelinhasBonus: bonus,
    semana,
  }
}

export function lerCasa(valor: unknown): CasaConfig | null {
  const linha = registro(valor)
  if (!linha) return null
  const meta = inteiro(linha.meta_semanal)
  const bonus = inteiro(linha.bonus_por_dia)
  const seguidas = inteiro(linha.semanas_seguidas)
  const recompensa = texto(linha.recompensa)
  const fuso = texto(linha.fuso)
  if (meta === null || meta <= 0 || bonus === null || bonus < 0 || seguidas === null || seguidas < 0) return null
  if (recompensa === null || !fuso) return null
  const fechadaBruta = linha.ultima_semana_fechada
  const fechada = fechadaBruta === null || fechadaBruta === undefined ? null : dataCurta(fechadaBruta)
  if (fechadaBruta !== null && fechadaBruta !== undefined && !fechada) return null
  const bateuBruto = linha.ultima_semana_bateu
  if (bateuBruto !== null && bateuBruto !== undefined && typeof bateuBruto !== 'boolean') return null
  return {
    metaSemanal: meta,
    recompensa,
    fuso,
    bonusPorDia: bonus,
    semanasSeguidas: seguidas,
    ultimaSemanaFechada: fechada,
    ultimaSemanaBateu: typeof bateuBruto === 'boolean' ? bateuBruto : null,
  }
}

export function lerItemCompra(valor: unknown): ItemCompra | null {
  const linha = registro(valor)
  if (!linha) return null
  const id = texto(linha.id)
  const nome = texto(linha.nome)
  const criadoEm = texto(linha.criado_em)
  if (!id || !nome || !criadoEm || typeof linha.comprado !== 'boolean') return null
  if (Number.isNaN(new Date(criadoEm).getTime())) return null
  const tarefaId = linha.tarefa_id === null || linha.tarefa_id === undefined ? null : texto(linha.tarefa_id)
  if (linha.tarefa_id !== null && linha.tarefa_id !== undefined && !tarefaId) return null
  const compradoEm = linha.comprado_em === null || linha.comprado_em === undefined ? null : texto(linha.comprado_em)
  const compradoPor = linha.comprado_por === null || linha.comprado_por === undefined ? null : texto(linha.comprado_por)
  const criadoPor = linha.criado_por === null || linha.criado_por === undefined ? null : texto(linha.criado_por)
  return { id, nome, tarefaId, comprado: linha.comprado, compradoEm, compradoPor, criadoPor, criadoEm }
}

export function pedeIntervalo(frequencia: Frequencia): boolean {
  return frequencia === 'a_cada_n_dias' || frequencia === 'n_vezes_por_semana' || frequencia === 'validade'
}

export function rotuloIntervalo(frequencia: Frequencia): string {
  if (frequencia === 'n_vezes_por_semana') return 'Quantas vezes na semana'
  if (frequencia === 'validade') return 'Validade em dias'
  return 'De quantos em quantos dias'
}

export function ajudaFrequencia(frequencia: Frequencia): string {
  switch (frequencia) {
    case 'diaria':
      return 'Ao concluir, volta amanhã.'
    case 'a_cada_n_dias':
      return 'Ao concluir, volta depois desses dias.'
    case 'n_vezes_por_semana':
      return 'Cada conclusão empurra para o dia seguinte até bater a cota. Aí ela só volta na segunda.'
    case 'semanal':
      return 'Ao concluir, volta daqui a 7 dias.'
    case 'quinzenal':
      return 'Ao concluir, volta daqui a 14 dias.'
    case 'mensal':
      return 'Ao concluir, volta no mesmo dia do mês que vem.'
    case 'validade':
      return 'Ao concluir, volta quando acabar a validade.'
    default:
      return 'Missão é única: ao concluir, sai da lista.'
  }
}

export function rotuloFrequencia(tarefa: Tarefa): string {
  switch (tarefa.frequencia) {
    case 'diaria':
      return 'Todo dia'
    case 'a_cada_n_dias':
      return `A cada ${tarefa.intervalo ?? '?'} dias`
    case 'n_vezes_por_semana':
      return `${tarefa.intervalo ?? '?'} vezes por semana`
    case 'semanal':
      return 'Toda semana'
    case 'quinzenal':
      return 'A cada duas semanas'
    case 'mensal':
      return 'Todo mês'
    case 'validade':
      return `Validade de ${tarefa.intervalo ?? '?'} dias`
    default:
      return 'Missão'
  }
}

export function rotuloAtraso(dias: number, bonus: number): string {
  const base = dias === 1 ? 'Atrasada há 1 dia' : `Atrasada há ${dias} dias`
  if (bonus <= 0) return base
  return `${base} · +${bonus}`
}

export function comodoDa(comodos: Comodo[], id: string | null): Comodo | null {
  return comodos.find((comodo) => comodo.id === id) ?? null
}

export function detalheTarefa(tarefa: Tarefa, comodos: Comodo[]): string {
  const comodo = comodoDa(comodos, tarefa.comodoId)
  const lugar = comodo ? `${comodo.emoji} ${comodo.nome}` : 'Sem cômodo'
  if (tarefa.tipo === 'missao') return `${lugar} · Missão`
  return `${lugar} · ${rotuloFrequencia(tarefa)}`
}

export function bonusDaTarefa(tarefa: Tarefa, hoje: string, bonusPorDia: number): number {
  if (tarefa.tipo !== 'rotina' || tarefa.status !== 'ativa' || !tarefa.proximaData) return 0
  if (tarefa.proximaData >= hoje) return 0
  return diferencaDias(tarefa.proximaData, hoje) * bonusPorDia
}

export function diasDeAtraso(tarefa: Tarefa, hoje: string): number {
  if (!tarefa.proximaData || tarefa.proximaData >= hoje) return 0
  return diferencaDias(tarefa.proximaData, hoje)
}

export function ordenarTarefas(tarefas: Tarefa[], comodos: Comodo[]): Tarefa[] {
  const ordem = new Map(comodos.map((comodo) => [comodo.id, comodo.ordem]))
  return [...tarefas].sort((a, b) => {
    const ordemA = ordem.get(a.comodoId ?? '') ?? 99
    const ordemB = ordem.get(b.comodoId ?? '') ?? 99
    if (ordemA !== ordemB) return ordemA - ordemB
    return a.titulo.localeCompare(b.titulo, 'pt-BR')
  })
}

export function saldoNaSemana(conclusoes: Conclusao[], usuarioId: string, semana: string): number {
  return conclusoes
    .filter((item) => item.usuarioId === usuarioId && item.semana === semana)
    .reduce((soma, item) => soma + item.estrelinhasBase + item.estrelinhasBonus, 0)
}

export function saldoDoCasal(conclusoes: Conclusao[], semana: string): number {
  return conclusoes
    .filter((item) => item.semana === semana)
    .reduce((soma, item) => soma + item.estrelinhasBase + item.estrelinhasBonus, 0)
}

export function feitasNoDia(conclusoes: Conclusao[], hoje: string, fuso: string): Conclusao[] {
  return conclusoes
    .filter((item) => {
      const instante = new Date(item.quando)
      if (Number.isNaN(instante.getTime())) return false
      return dataNoFuso(instante, fuso) === hoje
    })
    .sort((a, b) => (a.quando < b.quando ? 1 : a.quando > b.quando ? -1 : 0))
}

export function ehAMaisRecente(conclusoes: Conclusao[], conclusao: Conclusao): boolean {
  return !conclusoes.some(
    (outra) =>
      outra.tarefaId === conclusao.tarefaId &&
      (outra.quando > conclusao.quando || (outra.quando === conclusao.quando && outra.id > conclusao.id)),
  )
}

export function validarRascunho(rascunho: RascunhoTarefa): string | null {
  const titulo = rascunho.titulo.trim()
  if (!titulo) return 'Escreva o nome da tarefa.'
  if (titulo.length > 120) return 'Use um nome de até 120 caracteres.'
  if (!rascunho.comodoId) return 'Escolha o cômodo.'
  if (!Number.isInteger(rascunho.estrelinhas) || rascunho.estrelinhas < 0 || rascunho.estrelinhas > 999) {
    return 'As estrelinhas ficam entre 0 e 999.'
  }
  if (rascunho.etapas.length > 12) return 'Uma missão tem no máximo 12 etapas.'
  if (rascunho.etapas.some((etapa) => etapa.titulo.trim().length > 120)) {
    return 'Cada etapa tem no máximo 120 caracteres.'
  }
  if (rascunho.tipo === 'missao') return null
  if (!frequenciasRotina.some((item) => item.id === rascunho.frequencia)) return 'Escolha a frequência.'
  if (!rascunho.proximaData || !dataValida(rascunho.proximaData)) return 'Escolha a próxima data.'
  if (!pedeIntervalo(rascunho.frequencia)) return null
  const maximo = rascunho.frequencia === 'n_vezes_por_semana' ? 7 : 365
  const intervalo = rascunho.intervalo
  if (!intervalo || intervalo < 1 || intervalo > maximo) {
    return maximo === 7 ? 'Use de 1 a 7 vezes na semana.' : 'Use de 1 a 365 dias.'
  }
  return null
}
