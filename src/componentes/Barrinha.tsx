import { rotuloFaixa, type FaixaSaude, type NotaComodo } from '../lib/saude'

const faixas: Record<FaixaSaude, string> = {
  'em-dia': 'bg-primaria',
  cuidado: 'bg-destaque',
  atrasando: 'bg-secundaria',
}

export function Barrinha({ valor, faixa, rotulo }: { valor: number; faixa: FaixaSaude; rotulo: string }) {
  const largura = Math.max(0, Math.min(100, Math.round(valor)))
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-borda"
      role="progressbar"
      aria-valuenow={largura}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
    >
      <div className={`barra-enche h-full rounded-full ${faixas[faixa]}`} style={{ width: `${largura}%` }} />
    </div>
  )
}

export function BarrasSaude({ notas }: { notas: NotaComodo[] }) {
  if (notas.length === 0) return null
  return (
    <section className="mt-6" aria-labelledby="saude-comodos">
      <h2 id="saude-comodos" className="font-bold">
        Saúde dos cômodos
      </h2>
      <p className="mt-1 text-sm text-texto-suave">
        No dia do vencimento, pela metade. Sobe ao concluir e desce se atrasar.
      </p>
      <ul className="mt-2 flex flex-col gap-4 rounded-[20px] border border-borda bg-superficie p-4">
        {notas.map((nota) => (
          <li key={nota.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 font-medium">
                {nota.emoji ? <span aria-hidden="true">{nota.emoji} </span> : null}
                {nota.nome}
              </p>
              <p className="shrink-0 text-sm text-texto-suave tabular-nums">
                {nota.saude}% · {rotuloFaixa(nota.faixa)}
              </p>
            </div>
            <div className="mt-1.5">
              <Barrinha
                valor={nota.saude}
                faixa={nota.faixa}
                rotulo={`${nota.nome}, ${nota.saude}%, ${rotuloFaixa(nota.faixa)}`}
              />
            </div>
            {nota.atrasadas > 0 && (
              <p className="mt-1 text-sm text-texto-suave">
                {nota.atrasadas === 1 ? '1 rotina atrasada' : `${nota.atrasadas} rotinas atrasadas`}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
