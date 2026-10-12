import { useState, type FormEvent, type ReactNode } from 'react'
import { XingxingMascote } from '../componentes/XingxingMascote'
import { useSessao } from '../hooks/useSessao'
import type { ProblemaConfig } from '../lib/supabase'

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Abrindo() {
  return (
    <Moldura>
      <XingxingMascote />
      <p className="font-medium">Abrindo a Xingxing…</p>
    </Moldura>
  )
}

export function AvisoConfiguracao({ problema }: { problema: ProblemaConfig }) {
  return (
    <Moldura>
      <XingxingMascote />
      <h1 className="text-3xl font-bold">Xingxing</h1>
      <p className="mt-3 max-w-sm text-center text-texto-suave">
        {problema === 'secreta'
          ? 'A chave no .env é secreta. Apague essa linha e cole a chave publishable, que começa com sb_publishable_. A chave anon antiga também serve. Depois pare o app e rode npm run dev de novo.'
          : 'Ainda falta ligar o Supabase. Copie .env.example para .env, cole a URL do projeto e a chave publishable, salve e rode npm run dev de novo.'}
      </p>
    </Moldura>
  )
}

export function PerfilIndisponivel() {
  const { erroPerfil, sair } = useSessao()
  const [saindo, setSaindo] = useState(false)
  const [erroSaida, setErroSaida] = useState<string | null>(null)

  async function aoSair() {
    setSaindo(true)
    setErroSaida(null)
    const mensagem = await sair()
    if (mensagem) {
      setErroSaida(mensagem)
      setSaindo(false)
    }
  }

  return (
    <Moldura>
      <XingxingMascote />
      <h1 className="text-3xl font-bold">Xingxing</h1>
      <p className="mt-3 max-w-sm text-center" role="alert">
        {erroPerfil}
      </p>
      {erroSaida && <p className="mt-3 text-center text-sm">{erroSaida}</p>}
      <button
        type="button"
        onClick={() => void aoSair()}
        disabled={saindo}
        className="mt-6 min-h-11 w-full max-w-sm rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
      >
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
    </Moldura>
  )
}

export function Login() {
  const { entrar } = useSessao()
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    const username = String(dados.get('username') ?? '')
    const senha = String(dados.get('password') ?? '')
    setErro(null)
    setEnviando(true)
    const mensagem = await entrar(username, senha)
    if (mensagem) {
      setErro(mensagem)
      setEnviando(false)
    }
  }

  return (
    <Moldura>
      <XingxingMascote />
      <h1 className="text-3xl font-bold">Xingxing</h1>
      <p className="mt-1 text-center text-texto-suave">Casa em dia, estrelinhas no bolso</p>
      <form onSubmit={(evento) => void aoEnviar(evento)} className="mt-8 flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1 font-medium" htmlFor="username">
          Username
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            className="min-h-11 rounded-[14px] border border-borda bg-superficie px-3 font-normal text-texto"
          />
        </label>
        <label className="flex flex-col gap-1 font-medium" htmlFor="senha">
          Senha
          <input
            id="senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-11 rounded-[14px] border border-borda bg-superficie px-3 font-normal text-texto"
          />
        </label>
        {erro && (
          <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          aria-busy={enviando}
          className="min-h-11 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Moldura>
  )
}
