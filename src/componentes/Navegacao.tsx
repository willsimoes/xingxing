import { IconeAjustes, IconeCompras, IconeHoje, IconeLoja, IconeTarefas } from './Icones'

export type Aba = 'hoje' | 'tarefas' | 'compras' | 'loja' | 'ajustes'

const abas: { id: Aba; rotulo: string; Icone: typeof IconeHoje }[] = [
  { id: 'hoje', rotulo: 'Hoje', Icone: IconeHoje },
  { id: 'tarefas', rotulo: 'Tarefas', Icone: IconeTarefas },
  { id: 'compras', rotulo: 'Compras', Icone: IconeCompras },
  { id: 'loja', rotulo: 'Loja', Icone: IconeLoja },
  { id: 'ajustes', rotulo: 'Ajustes', Icone: IconeAjustes },
]

type Props = {
  aba: Aba
  aoEscolher: (aba: Aba) => void
}

export function Navegacao({ aba, aoEscolher }: Props) {
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {abas.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={ativa ? 'page' : undefined}
                onClick={() => aoEscolher(id)}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 overflow-hidden px-0.5 text-xs leading-tight ${
                  ativa ? 'font-medium text-primaria' : 'text-texto-suave'
                }`}
              >
                <Icone className="size-6" />
                {rotulo}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
