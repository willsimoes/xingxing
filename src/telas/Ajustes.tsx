import { useState, type FormEvent } from 'react'
import { IconeCheck } from '../componentes/Icones'
import { PainelNotificacoes } from '../componentes/PainelNotificacoes'
import { useSessao } from '../hooks/useSessao'
import { SUGESTOES_EMOJI, corSegura, limparUsername, rotuloCurto } from '../lib/perfil'
import type { EscolhaTema } from '../lib/tema'

const opcoes: { id: EscolhaTema; rotulo: string }[] = [
  { id: 'auto', rotulo: 'Automático' },
  { id: 'dia', rotulo: 'Dia' },
  { id: 'noite', rotulo: 'Noite' },
]

type Props = {
  escolha: EscolhaTema
  aoEscolher: (escolha: EscolhaTema) => void
}

type Rascunho = { nome: string; username: string; emoji: string }

export function Ajustes({ escolha, aoEscolher }: Props) {
  const { perfil, outros, salvarPerfil, sair } = useSessao()
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const nome = rascunho?.nome ?? perfil?.nome ?? ''
  const username = rascunho?.username ?? perfil?.username ?? ''
  const emoji = rascunho?.emoji ?? perfil?.emoji ?? '🌟'
  const emojis = emoji && !SUGESTOES_EMOJI.includes(emoji) ? [emoji, ...SUGESTOES_EMOJI] : SUGESTOES_EMOJI
  const mudou = Boolean(
    perfil &&
      (nome.trim() !== perfil.nome ||
        limparUsername(username) !== perfil.username ||
        emoji.trim() !== perfil.emoji),
  )

  if (!perfil) return null

  function editar(parcial: Partial<Rascunho>) {
    setRascunho({ nome, username, emoji, ...parcial })
    setAviso(null)
  }

  async function aoSalvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setAviso(null)
    setErro(null)
    setSalvando(true)
    const mensagem = await salvarPerfil({ nome, username, emoji })
    setSalvando(false)
    if (mensagem) setErro(mensagem)
    else {
      setRascunho(null)
      setAviso('Salvo.')
    }
  }

  async function aoSair() {
    setSaindo(true)
    setErro(null)
    const mensagem = await sair()
    if (mensagem) {
      setErro(mensagem)
      setSaindo(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Ajustes</h2>
      <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
        <h3 className="font-bold">Você</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-texto-suave">
          <Marca emoji={emoji} cor={perfil.cor} />
          O username é o jeito curto. Dá para deixar o nome em branco e usar só ele.
        </p>
        <form onSubmit={(evento) => void aoSalvar(evento)} className="mt-4 flex flex-col gap-3">
          <fieldset>
            <legend className="font-medium">Emoji</legend>
            <div role="radiogroup" aria-label="Emoji" className="mt-2 flex flex-wrap gap-2">
              {emojis.map((opcao) => {
                const ativa = opcao === emoji
                return (
                  <button
                    key={opcao}
                    type="button"
                    role="radio"
                    aria-checked={ativa}
                    aria-label={opcao}
                    onClick={() => editar({ emoji: opcao })}
                    className={`flex size-11 items-center justify-center rounded-full text-xl ${
                      ativa ? 'bg-fundo ring-2 ring-primaria' : 'bg-fundo'
                    }`}
                  >
                    {opcao}
                  </button>
                )
              })}
            </div>
            <label className="mt-3 flex flex-col gap-1 text-sm font-medium" htmlFor="emoji">
              Ou digite um emoji
              <input
                id="emoji"
                name="emoji"
                type="text"
                maxLength={32}
                autoComplete="off"
                value={emoji}
                onChange={(evento) => editar({ emoji: evento.target.value })}
                className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal text-texto"
              />
            </label>
          </fieldset>
          <label className="flex flex-col gap-1 font-medium" htmlFor="nome">
            Nome
            <span className="font-normal text-sm text-texto-suave">Opcional. Até 40 caracteres. Os dois veem em Ajustes.</span>
            <input
              id="nome"
              name="nome"
              type="text"
              maxLength={40}
              autoComplete="name"
              value={nome}
              onChange={(evento) => editar({ nome: evento.target.value })}
              className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal text-texto"
            />
          </label>
          <label className="flex flex-col gap-1 font-medium" htmlFor="username">
            Username
            <span className="font-normal text-sm text-texto-suave">
              De 3 a 20. Letras minúsculas, números e _. É ele que aparece no topo e nas tarefas.
            </span>
            <input
              id="username"
              name="username"
              type="text"
              required
              maxLength={20}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              value={username}
              onChange={(evento) =>
                editar({ username: evento.target.value.toLowerCase().replace(/^@+/, '').replace(/\s/g, '') })
              }
              className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal text-texto"
            />
          </label>
          {aviso && <p className="text-sm">{aviso}</p>}
          {erro && (
            <p role="alert" className="text-sm">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={salvando || !mudou}
            className="min-h-11 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
        {outros.length > 0 && (
          <div className="mt-4 border-t border-borda pt-4">
            <h3 className="font-bold">Também nesta casa</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {outros.map((pessoa) => (
                <li key={pessoa.id} className="flex min-h-11 items-center gap-2">
                  <Marca emoji={pessoa.emoji} cor={pessoa.cor} />
                  <span className="min-w-0">
                    <span className="block truncate">{rotuloCurto(pessoa)}</span>
                    {pessoa.username && pessoa.nome && pessoa.nome !== pessoa.username && (
                      <span className="block truncate text-sm text-texto-suave">{pessoa.nome}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <PainelNotificacoes />
      <button
        type="button"
        onClick={() => void aoSair()}
        disabled={saindo}
        className="mt-4 min-h-11 w-full rounded-[14px] border border-borda bg-superficie font-medium disabled:opacity-60"
      >
        {saindo ? 'Saindo…' : 'Sair'}
      </button>
      <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
        <h3 className="font-bold">Aparência</h3>
        <p className="mt-1 text-sm text-texto-suave">
          Automático acompanha o modo claro ou escuro do aparelho.
        </p>
        <div role="radiogroup" aria-label="Aparência" className="mt-4 flex flex-col gap-2">
          {opcoes.map((opcao) => {
            const ativa = escolha === opcao.id
            return (
              <button
                key={opcao.id}
                type="button"
                role="radio"
                aria-checked={ativa}
                onClick={() => aoEscolher(opcao.id)}
                className={`flex min-h-11 items-center justify-between rounded-[14px] px-4 font-medium ${
                  ativa ? 'bg-primaria text-sobre-primaria' : 'bg-fundo text-texto'
                }`}
              >
                {opcao.rotulo}
                {ativa && <IconeCheck className="size-5" />}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Marca({ emoji, cor }: { emoji: string; cor: string }) {
  const fundo = corSegura(cor)
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {fundo && <span className="size-3 rounded-full" style={{ backgroundColor: fundo }} />}
      <span>{emoji}</span>
    </span>
  )
}
