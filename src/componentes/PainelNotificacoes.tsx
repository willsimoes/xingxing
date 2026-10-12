import { useEffect, useState } from 'react'
import { useSessao } from '../hooks/useSessao'
import {
  desligarNotificacoes,
  inscricaoDesteAparelho,
  lerAjustesNotificacao,
  ligarNotificacoes,
  salvarHorarioResumo,
  salvarPreferencia,
  suportePush,
  type PreferenciasNotificacao,
} from '../lib/notificacoes'
import { supabase } from '../lib/supabase'

const campos: { id: 'avisar_conclusao' | 'avisar_compras' | 'receber_resumo'; chave: keyof PreferenciasNotificacao; rotulo: string; ajuda: string }[] = [
  {
    id: 'avisar_conclusao',
    chave: 'avisarConclusao',
    rotulo: 'Quando o outro conclui',
    ajuda: 'Você recebe quando a outra pessoa marca uma tarefa.',
  },
  {
    id: 'avisar_compras',
    chave: 'avisarCompras',
    rotulo: 'Lista de compras',
    ajuda: 'Você recebe quando entra um item novo. Dá para desligar só este.',
  },
  {
    id: 'receber_resumo',
    chave: 'receberResumo',
    rotulo: 'Resumo do dia',
    ajuda: 'As rotinas de hoje e as atrasadas, no horário abaixo.',
  },
]

export function PainelNotificacoes() {
  const { perfil } = useSessao()
  const cliente = supabase
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacao | null>(null)
  const [horario, setHorario] = useState('08:00')
  const [horarioSalvo, setHorarioSalvo] = useState('08:00')
  const [ligado, setLigado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<'horario' | 'aparelho' | null>(null)
  const suporte = suportePush()

  useEffect(() => {
    if (!cliente || !perfil) return
    let ativo = true
    void lerAjustesNotificacao(cliente, perfil.id).then((resultado) => {
      if (!ativo) return
      if (resultado.erro) {
        setErro(resultado.erro)
        return
      }
      setPreferencias(resultado.preferencias)
      if (resultado.horario) {
        setHorario(resultado.horario)
        setHorarioSalvo(resultado.horario)
      }
    })
    if (suportePush() === 'pronto') {
      void inscricaoDesteAparelho(cliente, perfil.id).then((ativa) => {
        if (ativo) setLigado(ativa)
      })
    }
    return () => {
      ativo = false
    }
  }, [cliente, perfil])

  if (!perfil || !cliente) return null

  async function aoAlternar(campo: (typeof campos)[number]) {
    if (!cliente || !perfil || !preferencias) return
    setErro(null)
    setAviso(null)
    const proximo = !preferencias[campo.chave]
    setPreferencias({ ...preferencias, [campo.chave]: proximo })
    const mensagem = await salvarPreferencia(cliente, perfil.id, campo.id, proximo)
    if (mensagem) {
      setPreferencias({ ...preferencias, [campo.chave]: !proximo })
      setErro(mensagem)
    }
  }

  async function aoSalvarHorario() {
    if (!cliente) return
    setErro(null)
    setAviso(null)
    setOcupado('horario')
    const mensagem = await salvarHorarioResumo(cliente, horario)
    setOcupado(null)
    if (mensagem) setErro(mensagem)
    else {
      setHorarioSalvo(horario)
      setAviso('Horário do resumo salvo para os dois.')
    }
  }

  async function aoLigar() {
    if (!cliente || !perfil) return
    setErro(null)
    setAviso(null)
    setOcupado('aparelho')
    const mensagem = await ligarNotificacoes(cliente, perfil.id)
    setOcupado(null)
    if (mensagem) setErro(mensagem)
    else {
      setLigado(true)
      setAviso('Notificações ligadas neste aparelho.')
    }
  }

  async function aoDesligar() {
    if (!cliente || !perfil) return
    setErro(null)
    setAviso(null)
    setOcupado('aparelho')
    const mensagem = await desligarNotificacoes(cliente, perfil.id)
    setOcupado(null)
    if (mensagem) setErro(mensagem)
    else {
      setLigado(false)
      setAviso('Este aparelho não recebe mais avisos.')
    }
  }

  return (
    <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
      <h3 className="font-bold">Notificações</h3>
      <p className="mt-1 text-sm text-texto-suave">
        {suporte === 'iphone'
          ? 'No iPhone, o aviso só funciona com o app aberto pelo ícone da Tela de Início, no iOS 16.4 ou mais novo.'
          : 'O aviso chega mesmo com o Xingxing fechado, depois que você ativar neste aparelho.'}
      </p>

      {preferencias ? (
        <div className="mt-4 flex flex-col gap-2">
          {campos.map((campo) => {
            const ativo = preferencias[campo.chave]
            return (
              <button
                key={campo.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => void aoAlternar(campo)}
                className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] bg-fundo px-4 text-left"
              >
                <span>
                  <span className="block font-medium">{campo.rotulo}</span>
                  <span className="block text-sm text-texto-suave">{campo.ajuda}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                    ativo ? 'bg-primaria text-sobre-primaria' : 'bg-superficie text-texto-suave'
                  }`}
                >
                  {ativo ? 'Ligado' : 'Desligado'}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        !erro && <p className="mt-4 text-sm">Carregando preferências…</p>
      )}

      <label className="mt-4 flex flex-col gap-1 font-medium" htmlFor="horario-resumo">
        Horário do resumo
        <span className="font-normal text-sm text-texto-suave">Vale para os dois, no fuso da casa.</span>
        <input
          id="horario-resumo"
          type="time"
          value={horario}
          onChange={(evento) => {
            setHorario(evento.target.value)
            setAviso(null)
          }}
          className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal text-texto"
        />
      </label>
      <button
        type="button"
        onClick={() => void aoSalvarHorario()}
        disabled={ocupado !== null || horario === horarioSalvo}
        className="mt-3 min-h-11 w-full rounded-[14px] border border-borda bg-fundo font-medium disabled:opacity-60"
      >
        Salvar horário
      </button>

      {ligado ? (
        <button
          type="button"
          onClick={() => void aoDesligar()}
          disabled={ocupado !== null}
          className="mt-3 min-h-11 w-full rounded-[14px] border border-borda bg-fundo font-medium disabled:opacity-60"
        >
          {ocupado === 'aparelho' ? 'Desligando…' : 'Desligar neste aparelho'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void aoLigar()}
          disabled={ocupado !== null}
          className="mt-3 min-h-11 w-full rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
        >
          {ocupado === 'aparelho' ? 'Ativando…' : 'Ativar notificações'}
        </button>
      )}

      {aviso && <p className="mt-3 text-sm">{aviso}</p>}
      {erro && (
        <p role="alert" className="mt-3 text-sm">
          {erro}
        </p>
      )}
    </section>
  )
}
