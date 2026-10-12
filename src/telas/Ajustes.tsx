import { useState, type FormEvent } from 'react'
import { IconeCheck } from '../componentes/Icones'
import { PainelNotificacoes } from '../componentes/PainelNotificacoes'
import { useSessao } from '../hooks/useSessao'
import { corSegura } from '../lib/perfil'
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

export function Ajustes({ escolha, aoEscolher }: Props) {
  const { perfil, outros, salvarNome, sair } = useSessao()
  const [rascunho, setRascunho] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const nome = rascunho ?? perfil?.nome ?? ''

  if (!perfil) return null

  async function aoSalvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setAviso(null)
    setErro(null)
    setSalvando(true)
    const mensagem = await salvarNome(nome)
    setSalvando(false)
    if (mensagem) setErro(mensagem)
    else {
      setRascunho(null)
      setAviso('Nome salvo.')
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
          <Marca emoji={perfil.emoji} cor={perfil.cor} />
          Este nome aparece para os dois.
        </p>
        <form onSubmit={(evento) => void aoSalvar(evento)} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-medium" htmlFor="nome">
            Nome
            <input
              id="nome"
              name="nome"
              type="text"
              required
              maxLength={40}
              autoComplete="nickname"
              value={nome}
              onChange={(evento) => {
                setRascunho(evento.target.value)
                setAviso(null)
              }}
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
            disabled={salvando || nome.trim() === perfil.nome}
            className="min-h-11 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar nome'}
          </button>
        </form>
        {outros.length > 0 && (
          <div className="mt-4 border-t border-borda pt-4">
            <h3 className="font-bold">Também nesta casa</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {outros.map((pessoa) => (
                <li key={pessoa.id} className="flex min-h-11 items-center gap-2">
                  <Marca emoji={pessoa.emoji} cor={pessoa.cor} />
                  <span>{pessoa.nome}</span>
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
