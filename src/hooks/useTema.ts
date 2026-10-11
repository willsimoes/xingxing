import { useEffect, useState } from 'react'
import { aplicarTema, lerEscolha, salvarEscolha, type EscolhaTema } from '../lib/tema'

export function useTema() {
  const [escolha, setEscolha] = useState<EscolhaTema>(lerEscolha)

  useEffect(() => {
    aplicarTema(escolha)
    if (escolha !== 'auto') return
    const midia = window.matchMedia('(prefers-color-scheme: dark)')
    const aoMudar = () => aplicarTema('auto')
    midia.addEventListener('change', aoMudar)
    return () => midia.removeEventListener('change', aoMudar)
  }, [escolha])

  function definir(nova: EscolhaTema) {
    salvarEscolha(nova)
    setEscolha(nova)
  }

  return { escolha, definir }
}
