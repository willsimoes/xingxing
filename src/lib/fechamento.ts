import { segundaDaSemana, somarDias } from './datas'
import { saldoDoCasal, type CasaConfig, type Conclusao } from './tarefas'

export type ResultadoFechamento = {
  fechadas: number
  atualizou: boolean
}

export function precisaFechar(casa: CasaConfig, hoje: string): boolean {
  const anterior = somarDias(segundaDaSemana(hoje), -7)
  if (!casa.ultimaSemanaFechada) return true
  return casa.ultimaSemanaFechada < anterior
}

function registro(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== 'object') return null
  return valor as Record<string, unknown>
}

function inteiro(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isInteger(valor)) return valor
  if (typeof valor === 'string' && /^\d+$/.test(valor)) return Number(valor)
  return null
}

export function lerFechamento(valor: unknown): ResultadoFechamento | null {
  let bruto = valor
  if (typeof bruto === 'string') {
    try {
      bruto = JSON.parse(bruto) as unknown
    } catch {
      return null
    }
  }
  const linha = registro(bruto)
  if (!linha) return null
  const fechadas = inteiro(linha.fechadas)
  if (fechadas === null || fechadas < 0) return null
  return { fechadas, atualizou: linha.atualizou === true }
}

export function avisoDeVariasSemanas(fechadas: number): string | null {
  if (fechadas < 2) return null
  return `Fechei ${fechadas} semanas que tinham ficado para trás.`
}

export function textoSemanaPassada(casa: CasaConfig, conclusoes: Conclusao[]): string | null {
  if (!casa.ultimaSemanaFechada || casa.ultimaSemanaBateu === null) return null
  const soma = saldoDoCasal(conclusoes, casa.ultimaSemanaFechada)
  if (casa.ultimaSemanaBateu) {
    return `Semana passada fechou com a meta batida, somando ${soma} estrelinhas.`
  }
  return `Semana passada fechou com ${soma} de ${casa.metaSemanal} estrelinhas.`
}
