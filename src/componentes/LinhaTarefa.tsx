import { Estrela } from './Estrela'
import { CaixaFeita, CaixaMarcacao } from './CaixaMarcacao'
import { IconeLapis } from './Icones'

type EtapaVisivel = {
  id: string
  titulo: string
  concluida: boolean
}

type Props = {
  titulo: string
  detalhe: string
  etiqueta?: string
  estrelinhas: number
  caixa: 'marcar' | 'desfazer' | 'feita' | 'nenhuma'
  ocupada?: boolean
  etapas?: EtapaVisivel[]
  aoMarcar?: () => void
  aoAlternarEtapa?: (id: string, marcar: boolean) => void
  aoEditar?: () => void
  aoConcluirMissao?: () => void
}

export function LinhaTarefa({
  titulo,
  detalhe,
  etiqueta,
  estrelinhas,
  caixa,
  ocupada = false,
  etapas,
  aoMarcar,
  aoAlternarEtapa,
  aoEditar,
  aoConcluirMissao,
}: Props) {
  const feita = caixa === 'feita' || caixa === 'desfazer'
  const rotuloCaixa = caixa === 'desfazer' ? `Desfazer ${titulo}` : `Concluir ${titulo}`

  return (
    <li className="border-b border-borda last:border-b-0" aria-busy={ocupada || undefined}>
      <div className="flex items-center gap-1 py-1 pr-1">
        {caixa === 'feita' && <CaixaFeita />}
        {(caixa === 'marcar' || caixa === 'desfazer') && (
          <CaixaMarcacao marcada={caixa === 'desfazer'} rotulo={rotuloCaixa} desabilitada={ocupada} aoClicar={aoMarcar} />
        )}
        {caixa === 'nenhuma' && <span className="size-11 shrink-0" aria-hidden="true" />}
        <div className="min-w-0 flex-1 py-2">
          <p className={feita ? 'font-medium text-texto-suave line-through' : 'font-medium'}>{titulo}</p>
          <p className="text-sm text-texto-suave">{detalhe}</p>
          {etiqueta && (
            <span className="mt-1 inline-flex w-fit rounded-full bg-secundaria px-2 py-0.5 text-xs font-medium text-sobre-secundaria">
              {etiqueta}
            </span>
          )}
        </div>
        <p className="flex shrink-0 items-center gap-1" aria-label={`${estrelinhas} estrelinhas`}>
          <Estrela />
          <span className="font-medium tabular-nums">{estrelinhas}</span>
        </p>
        {aoEditar && (
          <button
            type="button"
            aria-label={`Editar ${titulo}`}
            onClick={aoEditar}
            className="flex size-11 shrink-0 items-center justify-center text-texto-suave"
          >
            <IconeLapis className="size-5" />
          </button>
        )}
      </div>
      {etapas && etapas.length > 0 && (
        <ul className="pb-1">
          {etapas.map((etapa) => (
            <li key={etapa.id}>
              <div className="flex items-center gap-1">
                <CaixaMarcacao
                  marcada={etapa.concluida}
                  rotulo={etapa.concluida ? `Desmarcar ${etapa.titulo}` : `Concluir ${etapa.titulo}`}
                  desabilitada={ocupada || !aoAlternarEtapa}
                  aoClicar={aoAlternarEtapa ? () => aoAlternarEtapa(etapa.id, !etapa.concluida) : undefined}
                />
                <span className={etapa.concluida ? 'text-texto-suave line-through' : ''}>{etapa.titulo}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {aoConcluirMissao && (
        <button
          type="button"
          onClick={aoConcluirMissao}
          disabled={ocupada}
          className="mb-3 ml-11 min-h-11 rounded-[14px] bg-primaria px-4 font-medium text-sobre-primaria disabled:opacity-60"
        >
          Concluir missão
        </button>
      )}
    </li>
  )
}
