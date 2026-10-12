export const AVISO_SQL_NOVO =
  'Falta aplicar um SQL novo no Supabase. No SQL Editor, cole o arquivo supabase/migrations/20261012120000_compras_e_fechamento.sql e clique em Run.'

export function faltaSqlNovo(mensagem: string): boolean {
  return /fechar_semanas|comprar_tarefa|ultima_semana_bateu/i.test(mensagem)
}
