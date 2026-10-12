export const FUSO_PADRAO = 'America/Sao_Paulo'

export function dataNoFuso(instante: Date, fuso: string): string {
  let partes: Intl.DateTimeFormatPart[]
  try {
    partes = new Intl.DateTimeFormat('en-US', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instante)
  } catch {
    if (fuso === FUSO_PADRAO) return '1970-01-01'
    return dataNoFuso(instante, FUSO_PADRAO)
  }
  const ano = partes.find((parte) => parte.type === 'year')?.value
  const mes = partes.find((parte) => parte.type === 'month')?.value
  const dia = partes.find((parte) => parte.type === 'day')?.value
  if (!ano || !mes || !dia) return '1970-01-01'
  return `${ano}-${mes}-${dia}`
}

export function diferencaDias(de: string, ate: string): number {
  const [anoDe, mesDe, diaDe] = de.split('-').map(Number)
  const [anoAte, mesAte, diaAte] = ate.split('-').map(Number)
  const ms = Date.UTC(anoAte, mesAte - 1, diaAte) - Date.UTC(anoDe, mesDe - 1, diaDe)
  return Math.round(ms / 86_400_000)
}

export function segundaDaSemana(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const diaSemana = data.getUTCDay()
  const isodow = diaSemana === 0 ? 7 : diaSemana
  data.setUTCDate(data.getUTCDate() - (isodow - 1))
  return data.toISOString().slice(0, 10)
}

export function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}

export function dataEmPortugues(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
}
