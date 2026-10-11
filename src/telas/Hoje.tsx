import { Estrela } from '../componentes/Estrela'
import { XingxingMascote } from '../componentes/XingxingMascote'

export function Hoje() {
  return (
    <div>
      <section className="rounded-[20px] bg-matcha-forte p-5 text-sobre-matcha-forte">
        <h2 className="text-sm font-medium">Meta da semana</h2>
        <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <Estrela />
          <span>0</span>
        </p>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da meta semanal"
        >
          <div className="h-full w-0 rounded-full bg-secundaria" />
        </div>
        <p className="mt-3 text-sm">Semanas seguidas: 0</p>
      </section>

      <div className="mt-8 flex flex-col items-center text-center">
        <XingxingMascote />
        <p className="font-medium">Nenhuma tarefa para hoje</p>
      </div>
    </div>
  )
}
