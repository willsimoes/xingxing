import { diferencaDias } from './datas'
import type { Comodo, Tarefa } from './tarefas'

export type FaixaSaude = 'em-dia' | 'cuidado' | 'atrasando'

export type NotaComodo = {
  id: string
  nome: string
  emoji: string
  saude: number
  rotinas: number
  atrasadas: number
  faixa: FaixaSaude
}

function cicloDaRotina(tarefa: Tarefa): number {
  switch (tarefa.frequencia) {
    case 'diaria':
      return 1
    case 'a_cada_n_dias':
      return Math.max(1, tarefa.intervalo ?? 1)
    case 'n_vezes_por_semana':
      return Math.max(1, Math.round(7 / Math.max(1, tarefa.intervalo ?? 1)))
    case 'semanal':
      return 7
    case 'quinzenal':
      return 14
    case 'mensal':
      return 30
    case 'validade':
      return Math.max(1, tarefa.intervalo ?? 30)
    default:
      return 7
  }
}

export function saudeDaRotina(tarefa: Tarefa, hoje: string): number {
  if (!tarefa.proximaData) return 100
  const diasRestantes = diferencaDias(hoje, tarefa.proximaData)
  const ciclo = cicloDaRotina(tarefa)
  const nota = 50 + 50 * (diasRestantes / ciclo)
  return Math.max(0, Math.min(100, nota))
}

export function faixaSaude(saude: number): FaixaSaude {
  if (saude >= 75) return 'em-dia'
  if (saude >= 40) return 'cuidado'
  return 'atrasando'
}

export function rotuloFaixa(faixa: FaixaSaude): string {
  if (faixa === 'em-dia') return 'em dia'
  if (faixa === 'cuidado') return 'pedindo cuidado'
  return 'atrasando'
}

function rotinasContaveis(tarefas: Tarefa[]): Tarefa[] {
  return tarefas.filter((tarefa) => tarefa.tipo === 'rotina' && tarefa.status === 'ativa' && tarefa.proximaData)
}

export function notaDasRotinas(rotinas: Tarefa[], hoje: string): Omit<NotaComodo, 'id' | 'nome' | 'emoji'> | null {
  const contaveis = rotinasContaveis(rotinas)
  if (contaveis.length === 0) return null
  const media = contaveis.reduce((soma, tarefa) => soma + saudeDaRotina(tarefa, hoje), 0) / contaveis.length
  const saude = Math.round(media)
  const atrasadas = contaveis.filter((tarefa) => tarefa.proximaData !== null && tarefa.proximaData < hoje).length
  return { saude, rotinas: contaveis.length, atrasadas, faixa: faixaSaude(saude) }
}

export function saudeDaCasa(comodos: Comodo[], tarefas: Tarefa[], hoje: string): NotaComodo[] {
  const conhecidos = new Set(comodos.map((comodo) => comodo.id))
  const barras = [...comodos]
    .sort((a, b) => a.ordem - b.ordem)
    .flatMap((comodo) => {
      const nota = notaDasRotinas(
        tarefas.filter((tarefa) => tarefa.comodoId === comodo.id),
        hoje,
      )
      if (!nota) return []
      return [{ id: comodo.id, nome: comodo.nome, emoji: comodo.emoji, ...nota }]
    })

  const soltas = tarefas.filter((tarefa) => !tarefa.comodoId || !conhecidos.has(tarefa.comodoId))
  const notaSoltas = notaDasRotinas(soltas, hoje)
  if (notaSoltas) {
    barras.push({ id: 'soltas', nome: 'Sem cômodo', emoji: '', ...notaSoltas })
  }
  return barras
}
