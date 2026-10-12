import { useRef, useState } from 'react'
import { FormularioTarefa } from '../componentes/FormularioTarefa'
import { Barrinha } from '../componentes/Barrinha'
import { IconeLapis } from '../componentes/Icones'
import { LinhaTarefa } from '../componentes/LinhaTarefa'
import { useCasa } from '../hooks/useCasa'
import { useSessao } from '../hooks/useSessao'
import { dataEmPortugues } from '../lib/datas'
import { comoChamar } from '../lib/perfil'
import { notaDasRotinas, rotuloFaixa } from '../lib/saude'
import {
  bonusDaTarefa,
  detalheTarefa,
  diasDeAtraso,
  ehAMaisRecente,
  ordenarTarefas,
  rotuloAtraso,
  type Comodo,
  type Conclusao,
  type Tarefa,
} from '../lib/tarefas'

type Filtro = 'todas' | 'rotina' | 'missao'

const filtros: { id: Filtro; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'rotina', rotulo: 'Rotinas' },
  { id: 'missao', rotulo: 'Missões' },
]

function passaFiltro(tarefa: Tarefa, filtro: Filtro): boolean {
  if (tarefa.tipo === 'compra') return false
  if (filtro === 'todas') return true
  return tarefa.tipo === filtro
}

function missaoEncerrada(tarefa: Tarefa, conclusoes: Conclusao[]): boolean {
  return tarefa.tipo === 'missao' && conclusoes.some((item) => item.tarefaId === tarefa.id)
}

function maisRecente(conclusoes: Conclusao[], tarefaId: string): Conclusao | null {
  return conclusoes.find((item) => item.tarefaId === tarefaId && ehAMaisRecente(conclusoes, item)) ?? null
}

function agrupar(comodos: Comodo[], tarefas: Tarefa[]) {
  const conhecidos = new Set(comodos.map((comodo) => comodo.id))
  const grupos = comodos
    .map((comodo) => ({
      id: comodo.id,
      nome: `${comodo.emoji} ${comodo.nome}`,
      tarefas: tarefas.filter((tarefa) => tarefa.comodoId === comodo.id),
    }))
    .filter((grupo) => grupo.tarefas.length > 0)
  const soltas = tarefas.filter((tarefa) => !tarefa.comodoId || !conhecidos.has(tarefa.comodoId))
  if (soltas.length > 0) grupos.push({ id: 'soltas', nome: 'Sem cômodo', tarefas: soltas })
  return grupos
}

export function Tarefas() {
  const { dados, hoje, erro, carregando, concluir, desfazer, marcarEtapa, reativar } = useCasa()
  const { perfil, outros } = useSessao()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [edicao, setEdicao] = useState<Tarefa | 'nova' | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const emCurso = useRef(false)

  if (!perfil) return null
  if (edicao) {
    return (
      <FormularioTarefa
        key={edicao === 'nova' ? 'nova' : edicao.id}
        tarefa={edicao === 'nova' ? null : edicao}
        aoFechar={() => setEdicao(null)}
      />
    )
  }
  if (carregando && !dados) return <p className="text-texto-suave">Carregando as tarefas…</p>
  if (!dados) {
    return (
      <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
        {erro}
      </p>
    )
  }

  const lista = ordenarTarefas(dados.tarefas.filter((tarefa) => passaFiltro(tarefa, filtro)), dados.comodos)
  const ativas = lista.filter((tarefa) => tarefa.status !== 'arquivada' && !missaoEncerrada(tarefa, dados.conclusoes))
  const arquivadas = lista.filter((tarefa) => tarefa.status === 'arquivada' || missaoEncerrada(tarefa, dados.conclusoes))
  const grupos = agrupar(dados.comodos, ativas)

  async function executar(id: string, acao: () => Promise<string | null>) {
    if (emCurso.current) return
    emCurso.current = true
    setOcupada(id)
    setAviso(null)
    try {
      setAviso(await acao())
    } finally {
      setOcupada(null)
      emCurso.current = false
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Tarefas</h2>
      {(erro || aviso) && (
        <p role="alert" className="mt-4 rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
          {aviso || erro}
        </p>
      )}
      <div role="radiogroup" aria-label="Filtro de tarefas" className="mt-4 grid grid-cols-3 gap-2">
        {filtros.map((opcao) => {
          const ativa = filtro === opcao.id
          return (
            <button
              key={opcao.id}
              type="button"
              role="radio"
              aria-checked={ativa}
              onClick={() => setFiltro(opcao.id)}
              className={`min-h-11 rounded-full px-2 font-medium ${
                ativa ? 'bg-primaria text-sobre-primaria' : 'border border-borda bg-superficie'
              }`}
            >
              {opcao.rotulo}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setEdicao('nova')}
        className="mt-4 min-h-11 w-full rounded-[14px] bg-primaria font-medium text-sobre-primaria"
      >
        Nova tarefa
      </button>

      {grupos.length === 0 && (
        <p className="mt-6 text-center text-texto-suave">
          {dados.tarefas.length === 0
            ? 'Nenhuma tarefa por aqui. Rode o supabase/seed.sql no Supabase ou crie uma agora.'
            : 'Nenhuma tarefa neste filtro.'}
        </p>
      )}

      {grupos.map((grupo) => {
        const nota = notaDasRotinas(
          dados.tarefas.filter((tarefa) =>
            grupo.id === 'soltas'
              ? !tarefa.comodoId || !dados.comodos.some((comodo) => comodo.id === tarefa.comodoId)
              : tarefa.comodoId === grupo.id,
          ),
          hoje,
        )
        return (
          <section key={grupo.id} className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold">{grupo.nome}</h3>
              {nota && <p className="shrink-0 text-sm text-texto-suave tabular-nums">{nota.saude}%</p>}
            </div>
            {nota && (
              <div className="mt-2">
                <Barrinha
                  valor={nota.saude}
                  faixa={nota.faixa}
                  rotulo={`Saúde de ${grupo.nome}: ${nota.saude}%, ${rotuloFaixa(nota.faixa)}`}
                />
              </div>
            )}
            <ul className="mt-2 overflow-hidden rounded-[20px] border border-borda bg-superficie">
              {grupo.tarefas.map((tarefa) => (
                <LinhaAtiva
                  key={tarefa.id}
                  tarefa={tarefa}
                  ocupada={
                    ocupada === tarefa.id ||
                    dados.etapas.some((etapa) => etapa.tarefaId === tarefa.id && etapa.id === ocupada)
                  }
                  aoConcluir={() => void executar(tarefa.id, () => concluir(tarefa.id))}
                  aoEtapa={(etapaId, marcar) => void executar(etapaId, () => marcarEtapa(etapaId, marcar))}
                  aoEditar={() => setEdicao(tarefa)}
                />
              ))}
            </ul>
          </section>
        )
      })}

      {arquivadas.length > 0 && (
        <section className="mt-8">
          <h3 className="font-bold">Arquivadas</h3>
          <ul className="mt-2 overflow-hidden rounded-[20px] border border-borda bg-superficie">
            {arquivadas.map((tarefa) => {
              const recente = maisRecente(dados.conclusoes, tarefa.id)
              const encerrada = tarefa.tipo === 'missao' && recente
              const minha = Boolean(recente && recente.usuarioId === perfil.id && ehAMaisRecente(dados.conclusoes, recente))
              return (
                <li key={tarefa.id} className="flex items-center gap-1 border-b border-borda px-3 py-2 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-texto-suave line-through">{tarefa.titulo}</p>
                    <p className="text-sm text-texto-suave">
                      {encerrada && recente
                        ? `Concluída por ${recente.usuarioId === perfil.id ? 'você' : comoChamar([perfil, ...outros], recente.usuarioId)}`
                        : detalheTarefa(tarefa, dados.comodos)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar ${tarefa.titulo}`}
                    onClick={() => setEdicao(tarefa)}
                    className="flex size-11 shrink-0 items-center justify-center text-texto-suave"
                  >
                    <IconeLapis className="size-5" />
                  </button>
                  {encerrada && minha && recente && (
                    <button
                      type="button"
                      disabled={ocupada === recente.id}
                      onClick={() => void executar(recente.id, () => desfazer(recente.id))}
                      className="min-h-11 shrink-0 rounded-[14px] px-3 font-medium text-primaria disabled:opacity-60"
                    >
                      Desfazer
                    </button>
                  )}
                  {!encerrada && (
                    <button
                      type="button"
                      disabled={ocupada === tarefa.id}
                      onClick={() => void executar(tarefa.id, () => reativar(tarefa.id))}
                      className="min-h-11 shrink-0 rounded-[14px] px-3 font-medium text-primaria disabled:opacity-60"
                    >
                      Reativar
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function LinhaAtiva({
  tarefa,
  ocupada,
  aoConcluir,
  aoEtapa,
  aoEditar,
}: {
  tarefa: Tarefa
  ocupada: boolean
  aoConcluir: () => void
  aoEtapa: (etapaId: string, marcar: boolean) => void
  aoEditar: () => void
}) {
  const { dados, hoje } = useCasa()
  if (!dados) return null

  const etapas = dados.etapas.filter((etapa) => etapa.tarefaId === tarefa.id)
  const comEtapas = tarefa.tipo === 'missao' && etapas.length > 0
  const todasMarcadas = comEtapas && etapas.every((etapa) => etapa.concluida)
  const bloqueada = tarefa.status === 'bloqueada'
  const vence =
    tarefa.tipo === 'rotina' && tarefa.status === 'ativa' && tarefa.proximaData !== null && tarefa.proximaData <= hoje
  const podeMarcar = !bloqueada && !comEtapas && (tarefa.tipo === 'missao' || vence)
  const atraso = diasDeAtraso(tarefa, hoje)
  const bonus = bonusDaTarefa(tarefa, hoje, dados.casa.bonusPorDia)
  let detalhe = detalheTarefa(tarefa, dados.comodos)
  if (tarefa.tipo === 'rotina' && tarefa.proximaData && tarefa.proximaData > hoje) {
    detalhe = `${detalhe} · volta em ${dataEmPortugues(tarefa.proximaData)}`
  }
  if (comEtapas) {
    const feitas = etapas.filter((etapa) => etapa.concluida).length
    detalhe = `${detalhe} · ${feitas}/${etapas.length}`
  }

  return (
    <LinhaTarefa
      titulo={tarefa.titulo}
      detalhe={detalhe}
      etiqueta={bloqueada ? 'Esperando a compra' : atraso > 0 ? rotuloAtraso(atraso, bonus) : undefined}
      estrelinhas={tarefa.estrelinhas + bonus}
      caixa={podeMarcar ? 'marcar' : 'nenhuma'}
      ocupada={ocupada}
      etapas={comEtapas ? etapas : undefined}
      aoMarcar={podeMarcar ? aoConcluir : undefined}
      aoAlternarEtapa={comEtapas && !bloqueada ? aoEtapa : undefined}
      aoEditar={aoEditar}
      aoConcluirMissao={todasMarcadas ? aoConcluir : undefined}
    />
  )
}
