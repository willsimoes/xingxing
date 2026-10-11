import { useContext } from 'react'
import { ContextoSessao } from '../contexto/contextoSessao'

export function useSessao() {
  const valor = useContext(ContextoSessao)
  if (!valor) throw new Error('useSessao precisa ficar dentro do provedor de sessão')
  return valor
}
