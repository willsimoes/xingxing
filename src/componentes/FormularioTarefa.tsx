import { useState, type FormEvent } from 'react'
import { useCasa } from '../hooks/useCasa'
import {
  ajudaFrequencia,
  frequenciasRotina,
  pedeIntervalo,
  rotuloIntervalo,
  validarRascunho,
  type Etapa,
  type Frequencia,
  type RascunhoTarefa,
  type Tarefa,
} from '../lib/tarefas'

const campo = 'min-h-11 rounded-[14px] border border-borda bg-superficie px-3 font-normal text-texto'

type RascunhoEtapaLocal = { chave: string; id?: string; titulo: string }

type Estado = {
  titulo: string
  comodoId: string
  tipo: 'rotina' | 'missao'
  estrelinhas: string
  frequencia: Frequencia
  intervalo: string
  proximaData: string
  etapas: RascunhoEtapaLocal[]
}

type Props = {
  tarefa: Tarefa | null
  aoFechar: () => void
}

function estadoInicial(tarefa: Tarefa | null, etapas: Etapa[], hoje: string, comodoPadrao: string): Estado {
  const daTarefa = etapas
    .filter((etapa) => etapa.tarefaId === tarefa?.id)
    .sort((a, b) => a.ordem - b.ordem)
    .map((etapa) => ({ chave: etapa.id, id: etapa.id, titulo: etapa.titulo }))

  if (!tarefa || tarefa.tipo === 'compra') {
    return {
      titulo: '',
      comodoId: comodoPadrao,
      tipo: 'rotina',
      estrelinhas: '10',
      frequencia: 'semanal',
      intervalo: '2',
      proximaData: hoje,
      etapas: [],
    }
  }

  return {
    titulo: tarefa.titulo,
    comodoId: tarefa.comodoId ?? comodoPadrao,
    tipo: tarefa.tipo === 'missao' ? 'missao' : 'rotina',
    estrelinhas: String(tarefa.estrelinhas),
    frequencia: tarefa.frequencia === 'nenhuma' ? 'semanal' : tarefa.frequencia,
    intervalo: String(tarefa.intervalo ?? (tarefa.frequencia === 'validade' ? 60 : 2)),
    proximaData: tarefa.proximaData ?? hoje,
    etapas: tarefa.tipo === 'missao' ? daTarefa : [],
  }
}

function numero(valor: string): number | null {
  if (!/^\d+$/.test(valor)) return null
  return Number(valor)
}

export function FormularioTarefa({ tarefa, aoFechar }: Props) {
  const { dados, hoje, salvar, arquivar, reativar } = useCasa()
  const comodos = dados?.comodos ?? []
  const [estado, setEstado] = useState(() => estadoInicial(tarefa, dados?.etapas ?? [], hoje, comodos[0]?.id ?? ''))
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmaArquivo, setConfirmaArquivo] = useState(false)

  if (!dados) return null

  const temConclusao = Boolean(tarefa && dados.conclusoes.some((item) => item.tarefaId === tarefa.id))
  const podeArquivar = tarefa !== null && tarefa.status !== 'arquivada'
  const podeReativar = tarefa?.status === 'arquivada' && (tarefa.tipo === 'rotina' || !temConclusao)

  function atualizar(parcial: Partial<Estado>) {
    setEstado((atual) => ({ ...atual, ...parcial }))
    setErro(null)
  }

  function montar(): RascunhoTarefa {
    return {
      id: tarefa?.id,
      titulo: estado.titulo,
      comodoId: estado.comodoId,
      tipo: estado.tipo,
      estrelinhas: numero(estado.estrelinhas) ?? -1,
      frequencia: estado.tipo === 'missao' ? 'nenhuma' : estado.frequencia,
      intervalo: pedeIntervalo(estado.frequencia) ? numero(estado.intervalo) : null,
      proximaData: estado.tipo === 'missao' ? null : estado.proximaData,
      etapas: estado.etapas.map((etapa) => ({ id: etapa.id, titulo: etapa.titulo })),
    }
  }

  async function aoSalvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const rascunho = montar()
    const validacao = validarRascunho(rascunho)
    if (validacao) {
      setErro(validacao)
      return
    }
    setSalvando(true)
    const mensagem = await salvar(rascunho)
    setSalvando(false)
    if (mensagem) setErro(mensagem)
    else aoFechar()
  }

  async function aoArquivar() {
    if (!tarefa) return
    if (!confirmaArquivo) {
      setConfirmaArquivo(true)
      return
    }
    setSalvando(true)
    const mensagem = await arquivar(tarefa.id)
    setSalvando(false)
    if (mensagem) setErro(mensagem)
    else aoFechar()
  }

  async function aoReativar() {
    if (!tarefa) return
    setSalvando(true)
    const mensagem = await reativar(tarefa.id)
    setSalvando(false)
    if (mensagem) setErro(mensagem)
    else aoFechar()
  }

  if (comodos.length === 0) {
    return (
      <div>
        <button type="button" onClick={aoFechar} className="min-h-11 font-medium text-primaria">
          Voltar
        </button>
        <p className="mt-4 text-texto-suave">
          Ainda não há cômodos. No SQL Editor do Supabase, rode o arquivo supabase/seed.sql.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={(evento) => void aoSalvar(evento)}>
      <button type="button" onClick={aoFechar} className="min-h-11 font-medium text-primaria">
        Voltar
      </button>
      <h2 className="text-lg font-bold">{tarefa ? 'Editar tarefa' : 'Nova tarefa'}</h2>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-titulo">
          Nome
          <input
            id="tarefa-titulo"
            value={estado.titulo}
            maxLength={120}
            required
            autoComplete="off"
            onChange={(evento) => atualizar({ titulo: evento.target.value })}
            className={campo}
          />
        </label>
        <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-comodo">
          Cômodo
          <select
            id="tarefa-comodo"
            value={estado.comodoId}
            onChange={(evento) => atualizar({ comodoId: evento.target.value })}
            className={campo}
          >
            {comodos.map((comodo) => (
              <option key={comodo.id} value={comodo.id}>
                {comodo.emoji} {comodo.nome}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="font-medium">Tipo</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ['rotina', 'Rotina'],
                ['missao', 'Missão'],
              ] as const
            ).map(([id, rotulo]) => {
              const ativa = estado.tipo === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => atualizar({ tipo: id })}
                  className={`min-h-11 rounded-[14px] font-medium ${
                    ativa ? 'bg-primaria text-sobre-primaria' : 'border border-borda bg-superficie'
                  }`}
                >
                  {rotulo}
                </button>
              )
            })}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-estrelinhas">
          Estrelinhas
          <input
            id="tarefa-estrelinhas"
            inputMode="numeric"
            value={estado.estrelinhas}
            onChange={(evento) => atualizar({ estrelinhas: evento.target.value.replace(/\D/g, '').slice(0, 3) })}
            className={campo}
          />
        </label>
        {estado.tipo === 'rotina' && (
          <>
            <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-frequencia">
              Frequência
              <select
                id="tarefa-frequencia"
                value={estado.frequencia}
                onChange={(evento) => {
                  const frequencia = evento.target.value as Frequencia
                  const intervalo =
                    pedeIntervalo(frequencia) && estado.intervalo === ''
                      ? frequencia === 'validade'
                        ? '60'
                        : '2'
                      : estado.intervalo
                  atualizar({ frequencia, intervalo })
                }}
                className={campo}
              >
                {frequenciasRotina.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-texto-suave">{ajudaFrequencia(estado.frequencia)}</p>
            {pedeIntervalo(estado.frequencia) && (
              <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-intervalo">
                {rotuloIntervalo(estado.frequencia)}
                <input
                  id="tarefa-intervalo"
                  inputMode="numeric"
                  value={estado.intervalo}
                  onChange={(evento) => atualizar({ intervalo: evento.target.value.replace(/\D/g, '').slice(0, 3) })}
                  className={campo}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 font-medium" htmlFor="tarefa-data">
              Próxima data
              <input
                id="tarefa-data"
                type="date"
                required
                value={estado.proximaData}
                onChange={(evento) => atualizar({ proximaData: evento.target.value })}
                className={campo}
              />
            </label>
          </>
        )}
        {estado.tipo === 'missao' && (
          <fieldset>
            <legend className="font-medium">Etapas</legend>
            <p className="mt-1 text-sm text-texto-suave">Opcional. A missão só conclui quando todas estiverem feitas.</p>
            <ul className="mt-2 flex flex-col gap-2">
              {estado.etapas.map((etapa, indice) => (
                <li key={etapa.chave} className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`etapa-${etapa.chave}`}>
                    Etapa {indice + 1}
                  </label>
                  <input
                    id={`etapa-${etapa.chave}`}
                    value={etapa.titulo}
                    maxLength={120}
                    onChange={(evento) => {
                      const titulo = evento.target.value
                      atualizar({
                        etapas: estado.etapas.map((item) => (item.chave === etapa.chave ? { ...item, titulo } : item)),
                      })
                    }}
                    className={`${campo} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    aria-label={`Remover etapa ${indice + 1}`}
                    onClick={() => atualizar({ etapas: estado.etapas.filter((item) => item.chave !== etapa.chave) })}
                    className="min-h-11 shrink-0 px-2 font-medium text-texto-suave"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            {estado.etapas.length < 12 && (
              <button
                type="button"
                onClick={() =>
                  atualizar({
                    etapas: [...estado.etapas, { chave: crypto.randomUUID(), titulo: '' }],
                  })
                }
                className="mt-2 min-h-11 font-medium text-primaria"
              >
                Adicionar etapa
              </button>
            )}
          </fieldset>
        )}
        {erro && (
          <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={salvando}
          className="min-h-11 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : 'Salvar tarefa'}
        </button>
        {podeArquivar && (
          <div>
            {confirmaArquivo && (
              <p className="mb-2 text-sm text-texto-suave">
                Ela sai das listas. As estrelinhas já ganhas continuam na semana.
              </p>
            )}
            <button
              type="button"
              onClick={() => void aoArquivar()}
              disabled={salvando}
              className="min-h-11 w-full rounded-[14px] border border-borda bg-superficie font-medium disabled:opacity-60"
            >
              {confirmaArquivo ? 'Arquivar agora' : 'Arquivar'}
            </button>
          </div>
        )}
        {podeReativar && (
          <button
            type="button"
            onClick={() => void aoReativar()}
            disabled={salvando}
            className="min-h-11 w-full rounded-[14px] border border-borda bg-superficie font-medium disabled:opacity-60"
          >
            Reativar
          </button>
        )}
      </div>
    </form>
  )
}
