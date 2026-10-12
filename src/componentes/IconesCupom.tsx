import type { ReactNode } from 'react'

type Props = { className?: string }

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Moldura({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

const desenhos: Record<string, (className?: string) => ReactNode> = {
  filme: (className) => (
    <Moldura className={className}>
      <rect x="4" y="7" width="16" height="11" rx="2" {...traco} />
      <path d="M8 7l1.2-2.5h5.6L16 7M8 18v2.2M16 18v2.2" {...traco} />
    </Moldura>
  ),
  prato: (className) => (
    <Moldura className={className}>
      <circle cx="12" cy="12" r="7.2" {...traco} />
      <circle cx="12" cy="12" r="3.2" {...traco} />
    </Moldura>
  ),
  xicara: (className) => (
    <Moldura className={className}>
      <path d="M6 8h9.5v5.2a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z" {...traco} />
      <path d="M15.5 9.5H18a2 2 0 0 1 0 4h-2.2M7 20.5h8" {...traco} />
    </Moldura>
  ),
  maos: (className) => (
    <Moldura className={className}>
      <path d="M8 13.5V8.8a1.3 1.3 0 0 1 2.6 0V12M10.6 11.2V7.6a1.3 1.3 0 0 1 2.6 0v4.2M13.2 11V8.2a1.3 1.3 0 0 1 2.6 0V13" {...traco} />
      <path d="M8 13.5c0 3.2 1.8 5.5 4.6 5.5 2.2 0 3.6-1.2 4.4-2.8l1.2-2.2" {...traco} />
    </Moldura>
  ),
  esponja: (className) => (
    <Moldura className={className}>
      <rect x="4" y="8" width="16" height="9" rx="3" {...traco} />
      <path d="M8 8V6.8A2.2 2.2 0 0 1 10.2 4.6h3.6A2.2 2.2 0 0 1 16 6.8V8M8 12.5h.01M12 14.5h.01M15.5 12h.01" {...traco} />
    </Moldura>
  ),
  sol: (className) => (
    <Moldura className={className}>
      <circle cx="12" cy="12" r="3.2" {...traco} />
      <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4" {...traco} />
    </Moldura>
  ),
  troca: (className) => (
    <Moldura className={className}>
      <path d="M5 8h11M14 5l3 3-3 3M19 16H8M10 13l-3 3 3 3" {...traco} />
    </Moldura>
  ),
  pote: (className) => (
    <Moldura className={className}>
      <path d="M8 8h8l-.8 10.2a2 2 0 0 1-2 1.8h-2.4a2 2 0 0 1-2-1.8L8 8z" {...traco} />
      <path d="M9 8c0-2 1.2-3.5 3-3.5S15 6 15 8" {...traco} />
    </Moldura>
  ),
  presente: (className) => (
    <Moldura className={className}>
      <rect x="4" y="10" width="16" height="9" rx="1.6" {...traco} />
      <path d="M4 10h16M12 10v9M12 10c-2 0-3.2-2.8-1.6-4S12 8.2 12 10zM12 10c2 0 3.2-2.8 1.6-4S12 8.2 12 10z" {...traco} />
    </Moldura>
  ),
  flor: (className) => (
    <Moldura className={className}>
      <circle cx="12" cy="9" r="2" {...traco} />
      <path d="M12 11v8M9.2 7.2a2 2 0 1 1 2-2.8M14.8 7.2a2 2 0 1 0-2-2.8M8.4 11.2a2 2 0 1 1-2.6-2M15.6 11.2a2 2 0 1 0 2.6-2" {...traco} />
    </Moldura>
  ),
  livro: (className) => (
    <Moldura className={className}>
      <path d="M5 6.5h6.2A2 2 0 0 1 13.2 8.5V19H7.2A2.2 2.2 0 0 1 5 16.8V6.5zM19 6.5h-6.2A2 2 0 0 0 10.8 8.5V19h6A2.2 2.2 0 0 0 19 16.8V6.5z" {...traco} />
    </Moldura>
  ),
  musica: (className) => (
    <Moldura className={className}>
      <path d="M9 17V7.5l9-2V15" {...traco} />
      <circle cx="7.2" cy="17" r="2.2" {...traco} />
      <circle cx="16.2" cy="15" r="2.2" {...traco} />
    </Moldura>
  ),
  jogo: (className) => (
    <Moldura className={className}>
      <rect x="3.5" y="8" width="17" height="8.5" rx="4" {...traco} />
      <path d="M8 10.8v3M6.5 12.3h3M15.2 11.2h.01M17.2 13.4h.01" {...traco} />
    </Moldura>
  ),
  bolo: (className) => (
    <Moldura className={className}>
      <path d="M6 19.5h12V13H6v6.5zM7 13v-1.5A2 2 0 0 1 9 9.5h6a2 2 0 0 1 2 2V13M12 6.5v3" {...traco} />
      <path d="M12 6.2c.6-.8.6-1.6 0-2.2" {...traco} />
    </Moldura>
  ),
  casa: (className) => (
    <Moldura className={className}>
      <path d="M4 11.5L12 5l8 6.5V19a1 1 0 0 1-1 1h-5.2v-5.2H10.2V20H5a1 1 0 0 1-1-1v-7.5z" {...traco} />
    </Moldura>
  ),
  lua: (className) => (
    <Moldura className={className}>
      <path d="M15 4.8a7 7 0 1 0 4.2 11.6A6.2 6.2 0 0 1 15 4.8z" {...traco} />
    </Moldura>
  ),
  passo: (className) => (
    <Moldura className={className}>
      <path d="M8 18c2.5-4 2-7.5 1-10M14 18c-1-3.5.2-6.5 2.2-8" {...traco} />
      <circle cx="8.2" cy="6.2" r="1.6" {...traco} />
      <circle cx="16.5" cy="8.2" r="1.6" {...traco} />
    </Moldura>
  ),
  gota: (className) => (
    <Moldura className={className}>
      <path d="M12 4.5s5 5.2 5 8.6a5 5 0 0 1-10 0c0-3.4 5-8.6 5-8.6z" {...traco} />
    </Moldura>
  ),
  carta: (className) => (
    <Moldura className={className}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" {...traco} />
      <path d="M4 7.5l8 6 8-6" {...traco} />
    </Moldura>
  ),
  estrela: (className) => (
    <Moldura className={className}>
      <path d="M12 4.2l1.8 4.6 5 .2-3.9 3.2 1.3 4.8L12 14.6 7.8 17l1.3-4.8L5.2 9l5-.2L12 4.2z" {...traco} />
    </Moldura>
  ),
}

export function IconeCupom({ codigo, className }: { codigo: string } & Props) {
  const desenhar = desenhos[codigo] ?? desenhos.presente
  return desenhar(className)
}
