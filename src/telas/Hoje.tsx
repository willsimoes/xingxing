import { useRef, useState, type ReactNode } from 'react'
import { BarrasSaude } from '../componentes/Barrinha'
import { Estrela } from '../componentes/Estrela'
import { LinhaTarefa } from '../componentes/LinhaTarefa'
import { XingxingMascote } from '../componentes/XingxingMascote'
import { useCasa } from '../hooks/useCasa'
import { useSessao } from '../hooks/useSessao'
import { textoSemanaPassada } from '../lib/fechamento'
import { corSegura, nomeDe } from '../lib/perfil'
import { saudeDaCasa } from '../lib/saude'
import {
  bonusDaTarefa,
  detalheTarefa,
  diasDeAtraso,
  ehAMaisRecente,
  feitasNoDia,
  ordenarTarefas,
  rotuloAtraso,
  saldoDoCasal,
  saldoNaSemana,
  type Tarefa,
} from '../lib/tarefas'

export function Hoje() {
  const { perfil, outros } = useSessao()
  const { dados, hoje, semana, erro, avisoFechamento, carregando, concluir, desfazer } = useCasa()
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const emCurso = useRef(false)

  if (!perfil) return null
  if (carregando && !dados) return <p className="text-texto-suave">Carregando as tarefas…</p>
  if (!dados) {
    return (
      <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
        {erro}
      </p>
    )
  }

  const pessoas = [perfil, ...outros]
  const soma = saldoDoCasal(dados.conclusoes, semana)
  const meta = dados.casa.metaSemanal
  const progresso = meta > 0 ? Math.min(100, Math.round((soma / meta) * 100)) : 0
  const rotinas = ordenarTarefas(
    dados.tarefas.filter((tarefa) => tarefa.tipo === 'rotina' && tarefa.status === 'ativa' && tarefa.proximaData),
    dados.comodos,
  )
  const atrasadas = rotinas.filter((tarefa) => tarefa.proximaData !== null && tarefa.proximaData < hoje)
  const deHoje = rotinas.filter((tarefa) => tarefa.proximaData === hoje)
  const feitas = feitasNoDia(dados.conclusoes, hoje, dados.casa.fuso)
  const semanaPassada = textoSemanaPassada(dados.casa, dados.conclusoes)
  const notas = saudeDaCasa(dados.comodos, dados.tarefas, hoje)
  const vazio = atrasadas.length === 0 && deHoje.length === 0 && feitas.length === 0
  const semCadastro = dados.comodos.length === 0 && dados.tarefas.length === 0

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
      {(erro || aviso) && (
        <p role="alert" className="mb-4 rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
          {aviso || erro}
        </p>
      )}
      {avisoFechamento && avisoFechamento !== erro && avisoFechamento !== aviso && (
        <p className="mb-4 rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">{avisoFechamento}</p>
      )}
      <section className="rounded-[20px] bg-matcha-forte p-5 text-sobre-matcha-forte">
        <h2 className="text-sm font-medium">Meta da semana</h2>
        <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <Estrela />
          <span className="tabular-nums">
            {soma}
            <span className="text-base font-medium"> / {meta}</span>
          </span>
        </p>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-valuenow={Math.min(soma, meta)}
          aria-valuemin={0}
          aria-valuemax={meta}
          aria-label="Progresso da meta semanal"
        >
          <div className="h-full rounded-full bg-secundaria" style={{ width: `${progresso}%` }} />
        </div>
        {soma >= meta && <p className="mt-3 text-sm">A casa bateu a meta.</p>}
        {dados.casa.recompensa.trim() && <p className="mt-2 text-sm">{dados.casa.recompensa}</p>}
        {semanaPassada && <p className="mt-3 text-sm">{semanaPassada}</p>}
        <p className="mt-3 text-sm">Semanas seguidas: {dados.casa.semanasSeguidas}</p>
      </section>

      <ul
        aria-label="Estrelinhas de cada um nesta semana"
        className={`mt-3 grid gap-3 ${pessoas.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        {pessoas.map((pessoa) => {
          const cor = corSegura(pessoa.cor)
          return (
            <li key={pessoa.id} className="rounded-[20px] border border-borda bg-superficie p-3">
              <p className="flex min-w-0 items-center gap-1.5 text-sm text-texto-suave">
                {cor && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden />}
                <span className="truncate">{pessoa.id === perfil.id ? 'Você' : pessoa.nome}</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xl font-bold" aria-label={`${saldoNaSemana(dados.conclusoes, pessoa.id, semana)} estrelinhas`}>
                <Estrela />
                <span className="tabular-nums">{saldoNaSemana(dados.conclusoes, pessoa.id, semana)}</span>
              </p>
            </li>
          )
        })}
      </ul>

      <BarrasSaude notas={notas} />

      {atrasadas.length > 0 && (
        <Secao
          titulo="Atrasadas"
          nota={
            dados.casa.bonusPorDia > 0
              ? `Cada dia de atraso vale mais ${dados.casa.bonusPorDia} estrelinhas.`
              : undefined
          }
        >
          {atrasadas.map((tarefa) => (
            <LinhaRotina
              key={tarefa.id}
              tarefa={tarefa}
              hoje={hoje}
              bonusPorDia={dados.casa.bonusPorDia}
              ocupada={ocupada === tarefa.id}
              aoConcluir={() => void executar(tarefa.id, () => concluir(tarefa.id))}
            />
          ))}
        </Secao>
      )}

      {deHoje.length > 0 && (
        <Secao titulo="Para hoje">
          {deHoje.map((tarefa) => (
            <LinhaRotina
              key={tarefa.id}
              tarefa={tarefa}
              hoje={hoje}
              bonusPorDia={dados.casa.bonusPorDia}
              ocupada={ocupada === tarefa.id}
              aoConcluir={() => void executar(tarefa.id, () => concluir(tarefa.id))}
            />
          ))}
        </Secao>
      )}

      {feitas.length > 0 && (
        <Secao titulo="Feitas hoje">
          {feitas.map((conclusao) => {
            const tarefa = dados.tarefas.find((item) => item.id === conclusao.tarefaId)
            if (!tarefa) return null
            const total = conclusao.estrelinhasBase + conclusao.estrelinhasBonus
            const minha = conclusao.usuarioId === perfil.id
            const podeDesfazer = minha && ehAMaisRecente(dados.conclusoes, conclusao)
            const quem = minha ? 'Você' : nomeDe(pessoas, conclusao.usuarioId)
            return (
              <LinhaTarefa
                key={conclusao.id}
                titulo={tarefa.titulo}
                detalhe={`${detalheTarefa(tarefa, dados.comodos)} · ${quem}`}
                etiqueta={conclusao.estrelinhasBonus > 0 ? `Inclui ${conclusao.estrelinhasBonus} de atraso` : undefined}
                estrelinhas={total}
                caixa={podeDesfazer ? 'desfazer' : 'feita'}
                ocupada={ocupada === conclusao.id}
                aoMarcar={podeDesfazer ? () => void executar(conclusao.id, () => desfazer(conclusao.id)) : undefined}
              />
            )
          })}
        </Secao>
      )}

      {vazio && (
        <div className="mt-8 flex flex-col items-center text-center">
          <XingxingMascote />
          <p className="font-medium">{semCadastro ? 'A casa ainda não tem tarefas' : 'Nenhuma tarefa para hoje'}</p>
          {semCadastro && (
            <p className="mt-2 text-sm text-texto-suave">
              No SQL Editor do Supabase, rode o arquivo supabase/seed.sql.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Secao({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-bold">{titulo}</h2>
      {nota && <p className="mt-1 text-sm text-texto-suave">{nota}</p>}
      <ul className="mt-2 overflow-hidden rounded-[20px] border border-borda bg-superficie">{children}</ul>
    </section>
  )
}

function LinhaRotina({
  tarefa,
  hoje,
  bonusPorDia,
  ocupada,
  aoConcluir,
}: {
  tarefa: Tarefa
  hoje: string
  bonusPorDia: number
  ocupada: boolean
  aoConcluir: () => void
}) {
  const { dados } = useCasa()
  if (!dados) return null
  const atraso = diasDeAtraso(tarefa, hoje)
  const bonus = bonusDaTarefa(tarefa, hoje, bonusPorDia)
  return (
    <LinhaTarefa
      titulo={tarefa.titulo}
      detalhe={detalheTarefa(tarefa, dados.comodos)}
      etiqueta={atraso > 0 ? rotuloAtraso(atraso, bonus) : undefined}
      estrelinhas={tarefa.estrelinhas + bonus}
      caixa="marcar"
      ocupada={ocupada}
      aoMarcar={aoConcluir}
    />
  )
}
