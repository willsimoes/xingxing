function iphoneForaDoApp() {
  const ua = navigator.userAgent
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const instalado =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  return ios && !instalado
}

export function InstalarIphone() {
  if (!iphoneForaDoApp()) return null

  const passos = [
    'Toque em Compartilhar, o quadrado com a seta para cima.',
    'Toque em Adicionar à Tela de Início.',
    'Abra o Xingxing pelo ícone novo.',
  ]

  return (
    <section className="mb-4 rounded-[20px] border border-borda bg-superficie p-4">
      <h2 className="font-bold">Instale o Xingxing no iPhone</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {passos.map((passo, indice) => (
          <li key={passo} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primaria text-sm font-bold text-sobre-primaria">
              {indice + 1}
            </span>
            <span className="text-sm">{passo}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
