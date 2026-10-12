import { IconeCheck } from './Icones'

type Props = {
  marcada: boolean
  rotulo: string
  desabilitada?: boolean
  aoClicar?: () => void
}

export function CaixaMarcacao({ marcada, rotulo, desabilitada = false, aoClicar }: Props) {
  return (
    <button
      type="button"
      aria-pressed={marcada}
      aria-label={rotulo}
      disabled={desabilitada || !aoClicar}
      onClick={aoClicar}
      className="flex size-11 shrink-0 items-center justify-center disabled:opacity-60"
    >
      <span
        className={`flex size-7 items-center justify-center rounded-[8px] ${
          marcada ? 'bg-sucesso text-sobre-primaria' : 'border border-primaria bg-superficie'
        }`}
      >
        {marcada && <IconeCheck className="size-4" />}
      </span>
    </button>
  )
}

export function CaixaFeita() {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center" aria-hidden="true">
      <span className="flex size-7 items-center justify-center rounded-[8px] bg-sucesso text-sobre-primaria">
        <IconeCheck className="size-4" />
      </span>
    </span>
  )
}
