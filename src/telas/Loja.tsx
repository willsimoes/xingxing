import { useState } from 'react'
import { Estrela } from '../componentes/Estrela'
import { IconeCupom } from '../componentes/IconesCupom'
import { useCasa } from '../hooks/useCasa'
import { useSessao } from '../hooks/useSessao'
import { dataEmPortugues, dataNoFuso } from '../lib/datas'
import {
  custoPassaVez,
  resgatesNaSemana,
  type Cupom,
  type Resgate,
} from '../lib/loja'
import { comoChamar } from '../lib/perfil'
import { ordenarTarefas, type Tarefa } from '../lib/tarefas'

type AbaLoja = 'loja' | 'meus' | 'cumprir'

const abas: { id: AbaLoja; rotulo: string }[] = [
  { id: 'loja', rotulo: 'Na loja' },
  { id: 'meus', rotulo: 'Resgatados' },
  { id: 'cumprir', rotulo: 'A cumprir' },
]

export function Loja() {
  const { perfil, outros } = useSessao()
  const {
    dados,
    dadosLoja,
    erroLoja,
    hoje,
    semana,
    carregando,
    resgatar,
    marcarFeito,
    confirmarResgate,
    aceitarPassa,
    devolverPassa,
    depositar,
  } = useCasa()
  const [aba, setAba] = useState<AbaLoja>('loja')
  const [extrato, setExtrato] = useState(false)
  const [cupomAberto, setCupomAberto] = useState<string | null>(null)
  const [tarefaId, setTarefaId] = useState<string | null>(null)
  const [deposito, setDeposito] = useState('')
  const [quemId, setQuemId] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (!perfil) return null
  if (carregando && !dadosLoja && !erroLoja) return <p className="text-texto-suave">Carregando a lojinha…</p>
  if (!dadosLoja) {
    return (
      <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
        {erroLoja}
      </p>
    )
  }

  const pessoas = [perfil, ...outros]
  const quem = outros.length === 1 ? outros[0].id : quemId
  const cupomEscolhido = dadosLoja.cupons.find((cupom) => cupom.id === cupomAberto) ?? null
  const tarefaEscolhida = dados?.tarefas.find((tarefa) => tarefa.id === tarefaId) ?? null
  const cofrinho = dadosLoja.cofrinho
  const depositado = dadosLoja.aportes.reduce((soma, aporte) => soma + aporte.total, 0)
  const restante = cofrinho && cofrinho.status === 'aberto' ? Math.max(0, cofrinho.custo - depositado) : 0
  const meusMovimentos = dadosLoja.movimentos.filter((movimento) => movimento.usuarioId === perfil.id).slice(0, 50)

  async function executar(id: string, acao: () => Promise<string | null>) {
    setOcupado(id)
    setAviso(null)
    const mensagem = await acao()
    setOcupado(null)
    setAviso(mensagem)
    if (!mensagem) {
      setCupomAberto(null)
      setTarefaId(null)
      setDeposito('')
    }
  }

  function pedirResgate() {
    if (!cupomEscolhido) return
    if (outros.length === 0) {
      setAviso('Falta a outra pessoa na casa para cumprir o cupom.')
      return
    }
    if (outros.length > 1 && !quem) {
      setAviso('Escolha quem vai cumprir o cupom.')
      return
    }
    const tarefa = cupomEscolhido.tipo === 'passa_vez' ? tarefaId : null
    if (cupomEscolhido.tipo === 'passa_vez' && !tarefa) {
      setAviso('Escolha a tarefa para passar a vez.')
      return
    }
    void executar(cupomEscolhido.id, () => resgatar(cupomEscolhido.id, tarefa, quem))
  }

  return (
    <div>
      {(aviso || erroLoja) && (
        <p role="alert" className="mb-4 rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
          {aviso || erroLoja}
        </p>
      )}

      <section className="rounded-[20px] border border-borda bg-superficie p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-texto-suave">Para gastar</h2>
            <p className="mt-1 flex items-center gap-1 text-2xl font-bold" aria-label={`${dadosLoja.disponivel} estrelinhas para gastar`}>
              <Estrela />
              <span className="tabular-nums">{dadosLoja.disponivel}</span>
            </p>
          </div>
          <p className="text-right text-sm text-texto-suave">
            Ganhas
            <span className="mt-1 flex items-center justify-end gap-1 font-medium text-texto">
              <Estrela className="size-4" />
              <span className="tabular-nums">{dadosLoja.ganhas}</span>
            </span>
          </p>
        </div>
        <button type="button" onClick={() => setExtrato((aberto) => !aberto)} className="mt-3 min-h-11 text-sm font-medium text-primaria">
          {extrato ? 'Voltar para a loja' : 'Ver extrato'}
        </button>
      </section>

      {extrato ? (
        <Extrato movimentos={meusMovimentos} fuso={dados?.casa.fuso ?? 'America/Sao_Paulo'} />
      ) : (
        <>
          {cofrinho && (
            <CofrinhoCartao
              titulo={cofrinho.titulo}
              descricao={cofrinho.descricao}
              icone={cofrinho.icone}
              custo={cofrinho.custo}
              status={cofrinho.status}
              depositado={depositado}
              restante={restante}
              aportes={dadosLoja.aportes}
              pessoas={pessoas}
              deposito={deposito}
              aoDigitar={setDeposito}
              ocupado={ocupado === 'cofrinho'}
              disponivel={dadosLoja.disponivel}
              aoDepositar={() => {
                const quantidade = Number(deposito)
                if (!Number.isInteger(quantidade) || quantidade < 1) {
                  setAviso('Escolha quantas estrelinhas depositar.')
                  return
                }
                void executar('cofrinho', () => depositar(quantidade))
              }}
            />
          )}

          <div role="tablist" aria-label="Cupons" className="mt-4 grid grid-cols-3 gap-2">
            {abas.map((item) => {
              const ativa = aba === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => {
                    setAba(item.id)
                    setCupomAberto(null)
                    setTarefaId(null)
                  }}
                  className={`min-h-11 rounded-[14px] px-2 text-sm ${ativa ? 'bg-primaria font-medium text-sobre-primaria' : 'bg-superficie text-texto'}`}
                >
                  {item.rotulo}
                </button>
              )
            })}
          </div>

          {aba === 'loja' && (
            <ul className="mt-4 flex flex-col gap-3">
              {dadosLoja.cupons.filter((cupom) => cupom.ativo).length === 0 && (
                <li className="text-sm text-texto-suave">Nenhum cupom na loja agora.</li>
              )}
              {dadosLoja.cupons
                .filter((cupom) => cupom.ativo)
                .map((cupom) => (
                  <li key={cupom.id}>
                    <CartaoCupom
                      cupom={cupom}
                      usados={resgatesNaSemana(dadosLoja.resgates, cupom.id, perfil.id, semana)}
                      limitePassa={dadosLoja.limitePassaVez}
                      aberto={cupomAberto === cupom.id}
                      aoAbrir={() => {
                        setCupomAberto(cupomAberto === cupom.id ? null : cupom.id)
                        setTarefaId(null)
                        setAviso(null)
                      }}
                    />
                    {cupomAberto === cupom.id && cupom.tipo === 'passa_vez' && dados && (
                      <ListaTarefas
                        tarefas={tarefasPassaveis(dados.tarefas, dadosLoja.resgates, hoje)}
                        comodos={dados.comodos}
                        escolhida={tarefaId}
                        aoEscolher={setTarefaId}
                      />
                    )}
                    {cupomAberto === cupom.id && (
                      <Confirmacao
                        cupom={cupom}
                        tarefa={tarefaEscolhida}
                        quem={quem ? comoChamar(pessoas, quem) : ''}
                        outros={outros}
                        quemId={quem}
                        aoEscolherQuem={setQuemId}
                        ocupado={ocupado === cupom.id}
                        aoResgatar={pedirResgate}
                        aoFechar={() => setCupomAberto(null)}
                      />
                    )}
                  </li>
                ))}
            </ul>
          )}

          {aba === 'meus' && (
            <ListaResgates
              resgates={dadosLoja.resgates.filter((resgate) => resgate.quemResgatou === perfil.id)}
              cupons={dadosLoja.cupons}
              tarefas={dados?.tarefas ?? []}
              pessoas={pessoas}
              vazio="Você ainda não resgatou um cupom."
              fuso={dados?.casa.fuso ?? 'America/Sao_Paulo'}
              ocupado={ocupado}
              aoConfirmar={(id) => void executar(id, () => confirmarResgate(id))}
            />
          )}

          {aba === 'cumprir' && (
            <ListaResgates
              resgates={dadosLoja.resgates.filter(
                (resgate) => resgate.quemCumpre === perfil.id && resgate.status !== 'negociado' && resgate.status !== 'cumprido',
              )}
              cupons={dadosLoja.cupons}
              tarefas={dados?.tarefas ?? []}
              pessoas={pessoas}
              vazio="Nada para cumprir agora."
              fuso={dados?.casa.fuso ?? 'America/Sao_Paulo'}
              ocupado={ocupado}
              aoFeito={(id) => void executar(id, () => marcarFeito(id))}
              aoAceitar={(id) => void executar(id, () => aceitarPassa(id))}
              aoDevolver={(id) => void executar(id, () => devolverPassa(id))}
            />
          )}
        </>
      )}
    </div>
  )
}

function tarefasPassaveis(tarefas: Tarefa[], resgates: Resgate[], hoje: string): Tarefa[] {
  const ocupadas = new Set(
    resgates.filter((resgate) => resgate.status === 'pendente' || resgate.status === 'aceito').map((resgate) => resgate.tarefaId),
  )
  return tarefas.filter((tarefa) => {
    if (ocupadas.has(tarefa.id) || tarefa.status !== 'ativa' || tarefa.tipo === 'compra') return false
    if (tarefa.tipo === 'missao') return true
    return tarefa.proximaData !== null && tarefa.proximaData <= hoje
  })
}

function CartaoCupom({
  cupom,
  usados,
  limitePassa,
  aberto,
  aoAbrir,
}: {
  cupom: Cupom
  usados: number
  limitePassa: number
  aberto: boolean
  aoAbrir: () => void
}) {
  const limite = cupom.tipo === 'passa_vez' ? limitePassa : cupom.limiteSemana
  return (
    <button
      type="button"
      onClick={aoAbrir}
      aria-expanded={aberto}
      className="flex w-full items-start gap-3 rounded-[20px] border border-borda bg-superficie p-4 text-left"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fundo text-primaria">
        <IconeCupom codigo={cupom.icone} className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{cupom.titulo}</span>
        {cupom.descricao && <span className="mt-1 block text-sm text-texto-suave">{cupom.descricao}</span>}
        <span className="mt-2 flex items-center gap-1 text-sm font-medium">
          <Estrela className="size-4" />
          <span className="tabular-nums">
            {cupom.tipo === 'passa_vez' ? `${cupom.custo} + metade da tarefa` : cupom.custo}
          </span>
        </span>
        {limite !== null && (
          <span className="mt-1 block text-sm text-texto-suave">
            {usados} de {limite} nesta semana
          </span>
        )}
      </span>
    </button>
  )
}

function ListaTarefas({
  tarefas,
  comodos,
  escolhida,
  aoEscolher,
}: {
  tarefas: Tarefa[]
  comodos: { id: string; nome: string; emoji: string; ordem: number }[]
  escolhida: string | null
  aoEscolher: (id: string) => void
}) {
  const lista = ordenarTarefas(tarefas, comodos)
  if (lista.length === 0) {
    return <p className="mt-2 text-sm text-texto-suave">Nenhuma tarefa pendente para passar a vez.</p>
  }
  return (
    <ul className="mt-2 flex flex-col gap-2" aria-label="Tarefa para passar a vez">
      {lista.map((tarefa) => {
        const ativa = escolhida === tarefa.id
        return (
          <li key={tarefa.id}>
            <button
              type="button"
              aria-pressed={ativa}
              onClick={() => aoEscolher(tarefa.id)}
              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-2 text-left text-sm ${
                ativa ? 'border-primaria bg-fundo' : 'border-borda bg-superficie'
              }`}
            >
              <span>{tarefa.titulo}</span>
              <span className="flex shrink-0 items-center gap-1 tabular-nums">
                <Estrela className="size-4" />
                {custoPassaVez(0, tarefa.estrelinhas)} a mais
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Confirmacao({
  cupom,
  tarefa,
  quem,
  outros,
  quemId,
  aoEscolherQuem,
  ocupado,
  aoResgatar,
  aoFechar,
}: {
  cupom: Cupom
  tarefa: Tarefa | null
  quem: string
  outros: { id: string; nome: string; username: string }[]
  quemId: string | null
  aoEscolherQuem: (id: string) => void
  ocupado: boolean
  aoResgatar: () => void
  aoFechar: () => void
}) {
  const custo = cupom.tipo === 'passa_vez' && tarefa ? custoPassaVez(cupom.custo, tarefa.estrelinhas) : cupom.custo
  const pronto = (cupom.tipo !== 'passa_vez' || tarefa !== null) && quemId !== null
  return (
    <div className="mt-2 rounded-[20px] border border-borda bg-fundo p-4" role="dialog" aria-labelledby="confirma-cupom">
      <p id="confirma-cupom" className="font-medium">
        {cupom.tipo === 'passa_vez'
          ? tarefa
            ? `Passar «${tarefa.titulo}» por ${custo} estrelinhas?`
            : 'Escolha a tarefa acima.'
          : `Resgatar por ${custo} estrelinhas?`}
      </p>
      {outros.length > 1 && (
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium" htmlFor="quem-cumpre">
          Quem cumpre
          <select
            id="quem-cumpre"
            value={quemId ?? ''}
            onChange={(evento) => aoEscolherQuem(evento.target.value)}
            className="min-h-11 rounded-[14px] border border-borda bg-superficie px-3 font-normal"
          >
            <option value="">Escolha</option>
            {outros.map((pessoa) => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.username ? `@${pessoa.username}` : pessoa.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="mt-1 text-sm text-texto-suave">
        {quem ? `${quem} cumpre.` : 'Escolha quem vai cumprir.'} Dá para confirmar quando estiver combinado.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!pronto || ocupado}
          onClick={aoResgatar}
          className="min-h-11 flex-1 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
        >
          {ocupado ? 'Resgatando…' : 'Resgatar'}
        </button>
        <button type="button" onClick={aoFechar} className="min-h-11 flex-1 rounded-[14px] border border-borda bg-superficie font-medium">
          Agora não
        </button>
      </div>
    </div>
  )
}

function CofrinhoCartao({
  titulo,
  descricao,
  icone,
  custo,
  status,
  depositado,
  restante,
  aportes,
  pessoas,
  deposito,
  aoDigitar,
  ocupado,
  disponivel,
  aoDepositar,
}: {
  titulo: string
  descricao: string
  icone: string
  custo: number
  status: 'aberto' | 'completo'
  depositado: number
  restante: number
  aportes: { usuarioId: string; total: number; ordem: number }[]
  pessoas: { id: string; nome: string; username: string; emoji: string; cor: string }[]
  deposito: string
  aoDigitar: (valor: string) => void
  ocupado: boolean
  disponivel: number
  aoDepositar: () => void
}) {
  const cheio = status === 'completo' || depositado >= custo
  const progresso = custo > 0 ? Math.min(100, Math.round((depositado / custo) * 100)) : 0
  return (
    <section className={`mt-4 rounded-[20px] border border-borda bg-superficie p-4 ${cheio ? 'cofrinho-cheio' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fundo text-destaque">
          <IconeCupom codigo={icone} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{titulo}</h2>
          {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1 text-sm">
        <Estrela className="size-4" />
        <span className="tabular-nums">
          {Math.min(depositado, custo)} / {custo}
        </span>
      </p>
      <div
        className="mt-2 flex h-2 overflow-hidden rounded-full bg-borda"
        role="progressbar"
        aria-valuenow={Math.min(depositado, custo)}
        aria-valuemin={0}
        aria-valuemax={custo}
        aria-label="Progresso do cofrinho"
      >
        {aportes.map((aporte) => (
          <div
            key={aporte.usuarioId}
            className={`barra-enche h-full ${aporte.ordem === 1 ? 'bg-primaria' : 'bg-secundaria'}`}
            style={{ width: `${custo > 0 ? (aporte.total / custo) * 100 : 0}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-3 text-sm" aria-label="Quem depositou">
        {aportes.map((aporte) => (
          <li key={aporte.usuarioId} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${aporte.ordem === 1 ? 'bg-primaria' : 'bg-secundaria'}`} aria-hidden />
            {comoChamar(pessoas, aporte.usuarioId)}
            <span className="tabular-nums">{aporte.total}</span>
          </li>
        ))}
      </ul>
      {cheio ? (
        <p className="mt-3 text-sm font-medium">O cofrinho encheu. {titulo} é de vocês.</p>
      ) : (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(evento) => {
            evento.preventDefault()
            aoDepositar()
          }}
        >
          <label className="sr-only" htmlFor="deposito">
            Estrelinhas para depositar
          </label>
          <input
            id="deposito"
            inputMode="numeric"
            value={deposito}
            onChange={(evento) => aoDigitar(evento.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={restante > 0 ? `Até ${Math.min(restante, disponivel)}` : '0'}
            className="min-h-11 w-28 rounded-[14px] border border-borda bg-fundo px-3 tabular-nums"
          />
          <button
            type="submit"
            disabled={ocupado || disponivel < 1}
            className="min-h-11 flex-1 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
          >
            {ocupado ? 'Depositando…' : 'Depositar'}
          </button>
        </form>
      )}
      <p className="sr-only">{progresso}% do cofrinho</p>
    </section>
  )
}

function ListaResgates({
  resgates,
  cupons,
  tarefas,
  pessoas,
  vazio,
  fuso,
  ocupado,
  aoConfirmar,
  aoFeito,
  aoAceitar,
  aoDevolver,
}: {
  resgates: Resgate[]
  cupons: Cupom[]
  tarefas: Tarefa[]
  pessoas: { id: string; nome: string; username: string; emoji: string; cor: string }[]
  vazio: string
  fuso: string
  ocupado: string | null
  aoConfirmar?: (id: string) => void
  aoFeito?: (id: string) => void
  aoAceitar?: (id: string) => void
  aoDevolver?: (id: string) => void
}) {
  if (resgates.length === 0) return <p className="mt-4 text-sm text-texto-suave">{vazio}</p>
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {resgates.map((resgate) => {
        const cupom = cupons.find((item) => item.id === resgate.cupomId)
        const tarefa = tarefas.find((item) => item.id === resgate.tarefaId)
        const prazo = resgate.prazo ? dataEmPortugues(dataNoFuso(new Date(resgate.prazo), fuso)) : null
        return (
          <li key={resgate.id} className="rounded-[20px] border border-borda bg-superficie p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fundo text-primaria">
                <IconeCupom codigo={cupom?.icone ?? 'presente'} className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{cupom?.titulo ?? 'Cupom'}</p>
                {tarefa && <p className="mt-1 text-sm">{tarefa.titulo}</p>}
                <p className="mt-1 text-sm text-texto-suave">
                  {textoResgate(resgate, pessoas)}
                  {prazo ? ` · até ${prazo}` : ''}
                </p>
              </div>
              {resgate.status === 'cumprido' && (
                <p className="shrink-0 -rotate-6 rounded-full border-2 border-primaria px-2 py-1 text-xs font-bold text-primaria">
                  Cumprido
                </p>
              )}
            </div>
            <AcoesResgate
              resgate={resgate}
              cupom={cupom}
              ocupado={ocupado === resgate.id}
              aoConfirmar={aoConfirmar}
              aoFeito={aoFeito}
              aoAceitar={aoAceitar}
              aoDevolver={aoDevolver}
            />
          </li>
        )
      })}
    </ul>
  )
}

function textoResgate(
  resgate: Resgate,
  pessoas: { id: string; nome: string; username: string; emoji: string; cor: string }[],
): string {
  const outro = resgate.quemCumpre
  const quemFez = comoChamar(pessoas, outro)
  const quemPediu = comoChamar(pessoas, resgate.quemResgatou)
  if (resgate.status === 'pendente') return `Com ${quemFez}`
  if (resgate.status === 'feito') return `${quemFez} marcou feito`
  if (resgate.status === 'aceito') return `${quemFez} aceitou`
  if (resgate.status === 'negociado') return `${quemFez} devolveu`
  return `${quemPediu} carimbou`
}

function AcoesResgate({
  resgate,
  cupom,
  ocupado,
  aoConfirmar,
  aoFeito,
  aoAceitar,
  aoDevolver,
}: {
  resgate: Resgate
  cupom: Cupom | undefined
  ocupado: boolean
  aoConfirmar?: (id: string) => void
  aoFeito?: (id: string) => void
  aoAceitar?: (id: string) => void
  aoDevolver?: (id: string) => void
}) {
  if (resgate.status === 'feito' && aoConfirmar) {
    return (
      <button
        type="button"
        disabled={ocupado}
        onClick={() => aoConfirmar(resgate.id)}
        className="mt-3 min-h-11 w-full rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
      >
        {ocupado ? 'Carimbando…' : 'Carimbar cumprido'}
      </button>
    )
  }
  if (resgate.status === 'pendente' && cupom?.tipo === 'passa_vez' && aoAceitar && aoDevolver) {
    return (
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => aoAceitar(resgate.id)}
          className="min-h-11 flex-1 rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
        >
          Aceitar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => aoDevolver(resgate.id)}
          className="min-h-11 flex-1 rounded-[14px] border border-borda font-medium disabled:opacity-60"
        >
          Devolver
        </button>
      </div>
    )
  }
  if (resgate.status === 'pendente' && cupom?.tipo !== 'passa_vez' && aoFeito) {
    return (
      <button
        type="button"
        disabled={ocupado}
        onClick={() => aoFeito(resgate.id)}
        className="mt-3 min-h-11 w-full rounded-[14px] bg-primaria font-medium text-sobre-primaria disabled:opacity-60"
      >
        {ocupado ? 'Marcando…' : 'Marcar feito'}
      </button>
    )
  }
  if (resgate.status === 'aceito') {
    return <p className="mt-3 text-sm text-texto-suave">A tarefa fica no Hoje, com quem aceitou.</p>
  }
  return null
}

function Extrato({
  movimentos,
  fuso,
}: {
  movimentos: { id: string; quantidade: number; descricao: string; criadoEm: string }[]
  fuso: string
}) {
  if (movimentos.length === 0) {
    return <p className="mt-4 text-sm text-texto-suave">Quando uma estrelinha entrar ou for para a lojinha, ela aparece aqui.</p>
  }
  return (
    <ul className="mt-4 flex flex-col gap-2" aria-label="Extrato de estrelinhas">
      {movimentos.map((movimento) => (
        <li key={movimento.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-borda bg-superficie px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm">{movimento.descricao || 'Estrelinhas'}</span>
            <span className="text-xs text-texto-suave">{dataEmPortugues(dataNoFuso(new Date(movimento.criadoEm), fuso))}</span>
          </span>
          <span className={`flex shrink-0 items-center gap-1 font-medium tabular-nums ${movimento.quantidade > 0 ? 'text-primaria' : ''}`}>
            <Estrela className="size-4" />
            {movimento.quantidade > 0 ? `+${movimento.quantidade}` : movimento.quantidade}
          </span>
        </li>
      ))}
    </ul>
  )
}
