import { useRef, useState, type FormEvent } from 'react'
import { CaixaFeita, CaixaMarcacao } from '../componentes/CaixaMarcacao'
import { Estrela } from '../componentes/Estrela'
import { XingxingMascote } from '../componentes/XingxingMascote'
import { useCasa } from '../hooks/useCasa'
import { useSessao } from '../hooks/useSessao'
import { comoChamar } from '../lib/perfil'
import { comodoDa, ehAMaisRecente, type Conclusao, type Tarefa } from '../lib/tarefas'

export function Compras() {
  const { perfil, outros } = useSessao()
  const {
    dados,
    erro,
    avisoFechamento,
    carregando,
    adicionarCompra,
    marcarCompra,
    comprarTarefa,
    limparCompras,
    desfazer,
  } = useCasa()
  const [nome, setNome] = useState('')
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const emCurso = useRef(false)

  if (!perfil) return null
  if (carregando && !dados) return <p className="text-texto-suave">Carregando a lista…</p>
  if (!dados) {
    return (
      <p role="alert" className="rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
        {erro}
      </p>
    )
  }

  const pessoas = [perfil, ...outros]
  const daCasa = dados.tarefas
    .filter((tarefa) => tarefa.tipo === 'compra' && tarefa.status === 'ativa')
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
  const idsDaCasa = new Set(daCasa.map((tarefa) => tarefa.id))
  const pendentes = dados.itens
    .filter((item) => !item.comprado && !(item.tarefaId && idsDaCasa.has(item.tarefaId)))
    .sort((a, b) => (a.criadoEm < b.criadoEm ? -1 : 1))
  const comprados = dados.itens
    .filter((item) => item.comprado)
    .sort((a, b) => ((a.compradoEm ?? '') < (b.compradoEm ?? '') ? 1 : -1))
  const vazio = daCasa.length === 0 && pendentes.length === 0 && comprados.length === 0
  const avisoSql = avisoFechamento?.includes('compras_e_fechamento.sql') ? avisoFechamento : null

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

  function aoAdicionar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void executar('novo', async () => {
      const falha = await adicionarCompra(nome)
      if (!falha) setNome('')
      return falha
    })
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Compras</h2>
      <p className="mt-1 text-sm text-texto-suave">A lista é dos dois. O que um marca, o outro vê.</p>
      {(erro || aviso || avisoSql) && (
        <p role="alert" className="mt-4 rounded-[14px] border border-borda bg-superficie px-3 py-2 text-sm">
          {aviso || erro || avisoSql}
        </p>
      )}
      <form onSubmit={aoAdicionar} className="mt-4 flex gap-2">
        <input
          aria-label="Novo item"
          placeholder="O que falta comprar?"
          value={nome}
          maxLength={80}
          onChange={(evento) => setNome(evento.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-[14px] border border-borda bg-superficie px-3"
        />
        <button
          type="submit"
          disabled={ocupada !== null || nome.trim().length === 0}
          className="min-h-11 shrink-0 rounded-[14px] bg-primaria px-4 font-medium text-sobre-primaria disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      {vazio && (
        <div className="mt-8 flex flex-col items-center text-center">
          <XingxingMascote />
          <p className="font-medium">Nenhum item na lista</p>
        </div>
      )}

      {(daCasa.length > 0 || pendentes.length > 0) && (
        <section className="mt-6">
          <h3 className="font-bold">Para comprar</h3>
          <ul className="mt-2 overflow-hidden rounded-[20px] border border-borda bg-superficie">
            {daCasa.map((tarefa) => {
              const liberada = dados.tarefas.find((item) => item.id === tarefa.liberaTarefaId)
              return (
                <LinhaCompra
                  key={tarefa.id}
                  titulo={tarefa.titulo}
                  detalhe={lugarDa(tarefa, dados.comodos)}
                  etiqueta={liberada ? `Libera ${liberada.titulo}` : undefined}
                  estrelinhas={tarefa.estrelinhas}
                  marcada={false}
                  podeAlternar
                  ocupada={ocupada === tarefa.id}
                  aoAlternar={() => void executar(tarefa.id, () => comprarTarefa(tarefa.id))}
                />
              )
            })}
            {pendentes.map((item) => (
              <LinhaCompra
                key={item.id}
                titulo={item.nome}
                detalhe={textoDeQuem('Adicionado por', item.criadoPor, perfil.id, pessoas)}
                marcada={false}
                podeAlternar
                ocupada={ocupada === item.id}
                aoAlternar={() => void executar(item.id, () => marcarCompra(item.id, true))}
              />
            ))}
          </ul>
        </section>
      )}

      {comprados.length > 0 && (
        <section className="mt-6">
          <h3 className="font-bold">Comprados</h3>
          <ul className="mt-2 overflow-hidden rounded-[20px] border border-borda bg-superficie">
            {comprados.map((item) => {
              const tarefa = item.tarefaId ? dados.tarefas.find((atual) => atual.id === item.tarefaId) : undefined
              const conclusao = tarefa ? conclusaoDaTarefa(dados.conclusoes, tarefa.id) : null
              const podeDesfazer = Boolean(
                conclusao &&
                  conclusao.usuarioId === perfil.id &&
                  ehAMaisRecente(dados.conclusoes, conclusao) &&
                  !liberadaJaFeita(tarefa ?? null, dados.conclusoes),
              )
              const liberada = tarefa?.liberaTarefaId
                ? dados.tarefas.find((atual) => atual.id === tarefa.liberaTarefaId)
                : undefined
              const por = textoDeQuem('Comprado por', item.compradoPor, perfil.id, pessoas)
              const detalhe = [por, liberada ? `Liberou ${liberada.titulo}` : null].filter(Boolean).join(' · ')
              const estrelinhas = conclusao ? conclusao.estrelinhasBase + conclusao.estrelinhasBonus : null
              return (
                <LinhaCompra
                  key={item.id}
                  titulo={item.nome}
                  detalhe={detalhe || undefined}
                  estrelinhas={item.tarefaId ? estrelinhas : null}
                  marcada
                  podeAlternar={item.tarefaId ? podeDesfazer : true}
                  ocupada={ocupada === item.id || ocupada === conclusao?.id}
                  aoAlternar={() => {
                    if (item.tarefaId) {
                      if (!conclusao) return
                      void executar(item.id, () => desfazer(conclusao.id))
                      return
                    }
                    void executar(item.id, () => marcarCompra(item.id, false))
                  }}
                />
              )
            })}
          </ul>
          <button
            type="button"
            disabled={ocupada !== null}
            onClick={() => void executar('limpar', limparCompras)}
            className="mt-3 min-h-11 w-full rounded-[14px] border border-borda bg-superficie font-medium disabled:opacity-60"
          >
            Limpar comprados
          </button>
          {comprados.some((item) => item.tarefaId) && (
            <p className="mt-2 text-sm text-texto-suave">
              Limpar tira os itens da lista. As estrelinhas já ganhas ficam.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function lugarDa(tarefa: Tarefa, comodos: Parameters<typeof comodoDa>[0]): string {
  const comodo = comodoDa(comodos, tarefa.comodoId)
  return comodo ? `${comodo.emoji} ${comodo.nome}` : 'Sem cômodo'
}

function textoDeQuem(
  prefixo: string,
  id: string | null,
  perfilId: string,
  pessoas: Parameters<typeof comoChamar>[0],
): string | undefined {
  if (!id) return undefined
  return `${prefixo} ${id === perfilId ? 'você' : comoChamar(pessoas, id)}`
}

function conclusaoDaTarefa(conclusoes: Conclusao[], tarefaId: string): Conclusao | null {
  return conclusoes.find((item) => item.tarefaId === tarefaId && ehAMaisRecente(conclusoes, item)) ?? null
}

function liberadaJaFeita(tarefa: Tarefa | null, conclusoes: Conclusao[]): boolean {
  if (!tarefa?.liberaTarefaId) return false
  return conclusoes.some((item) => item.tarefaId === tarefa.liberaTarefaId)
}

function LinhaCompra({
  titulo,
  detalhe,
  etiqueta,
  estrelinhas = null,
  marcada,
  podeAlternar,
  ocupada,
  aoAlternar,
}: {
  titulo: string
  detalhe?: string
  etiqueta?: string
  estrelinhas?: number | null
  marcada: boolean
  podeAlternar: boolean
  ocupada: boolean
  aoAlternar: () => void
}) {
  return (
    <li className="border-b border-borda last:border-b-0" aria-busy={ocupada || undefined}>
      <div className="flex items-center gap-1 py-1 pr-3">
        {podeAlternar ? (
          <CaixaMarcacao
            marcada={marcada}
            rotulo={marcada ? `Desmarcar ${titulo}` : `Marcar ${titulo} como comprado`}
            desabilitada={ocupada}
            aoClicar={aoAlternar}
          />
        ) : (
          <CaixaFeita />
        )}
        <div className="min-w-0 flex-1 py-2">
          <p className={marcada ? 'font-medium text-texto-suave line-through' : 'font-medium'}>{titulo}</p>
          {detalhe && <p className="text-sm text-texto-suave">{detalhe}</p>}
          {etiqueta && (
            <span className="mt-1 inline-flex w-fit rounded-full bg-secundaria px-2 py-0.5 text-xs font-medium text-sobre-secundaria">
              {etiqueta}
            </span>
          )}
        </div>
        {estrelinhas !== null && (
          <p className="flex shrink-0 items-center gap-1" aria-label={`${estrelinhas} estrelinhas`}>
            <Estrela />
            <span className="font-medium tabular-nums">{estrelinhas}</span>
          </p>
        )}
      </div>
    </li>
  )
}
