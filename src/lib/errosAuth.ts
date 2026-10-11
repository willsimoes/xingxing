type ErroAuth = { message: string; code?: string | null }

export function mensagemDeEntrada(erro: ErroAuth): string {
  const codigo = erro.code ?? ''
  const texto = erro.message.toLowerCase()

  if (codigo === 'invalid_credentials' || texto.includes('invalid login credentials')) {
    return 'E-mail ou senha não conferem.'
  }
  if (codigo === 'email_not_confirmed' || texto.includes('email not confirmed')) {
    return 'Este e-mail ainda não foi confirmado. No painel, apague o usuário e crie de novo com Auto Confirm User ligado.'
  }
  if (codigo === 'over_request_rate_limit' || texto.includes('rate limit')) {
    return 'Muitas tentativas. Espere um minuto e tente de novo.'
  }
  if (texto.includes('failed to fetch') || texto.includes('network') || texto.includes('load failed')) {
    return 'Não consegui falar com o Supabase. Confira a internet e a URL no .env. Se você acabou de salvar o arquivo, pare o app e rode npm run dev de novo.'
  }
  return 'Não consegui entrar. Tente de novo em instantes.'
}
