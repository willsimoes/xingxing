export type EscolhaTema = 'auto' | 'dia' | 'noite'
export type Tema = 'dia' | 'noite'

const CHAVE = 'xingxing-tema'

const COR_BARRA = {
  dia: '#F3F1E4',
  noite: '#171D14',
} as const

export function lerEscolha(): EscolhaTema {
  const valor = localStorage.getItem(CHAVE)
  if (valor === 'dia' || valor === 'noite' || valor === 'auto') return valor
  return 'auto'
}

export function temaDe(escolha: EscolhaTema): Tema {
  if (escolha === 'dia' || escolha === 'noite') return escolha
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noite' : 'dia'
}

export function aplicarTema(escolha: EscolhaTema): Tema {
  const tema = temaDe(escolha)
  document.documentElement.dataset.tema = tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema])
  return tema
}

export function salvarEscolha(escolha: EscolhaTema) {
  localStorage.setItem(CHAVE, escolha)
  aplicarTema(escolha)
}
