import { IconeAjustes, IconeCompras, IconeHoje, IconeTarefas } from './Icones'

export type Aba = 'hoje' | 'tarefas' | 'compras' | 'ajustes'

const abas: { id: Aba; rotulo: string; Icone: typeof IconeHoje }[] = [
  { id: 'hoje', rotulo: 'Hoje', Icone: IconeHoje },
  { id: 'tarefas', rotulo: 'Tarefas', Icone: IconeTarefas },
  { id: 'compras', rotulo: 'Compras', Icone: IconeCompras },
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
      <ul className="grid grid-cols-4">
        {abas.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={ativa ? 'page' : undefined}
                onClick={() => aoEscolher(id)}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs ${
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
