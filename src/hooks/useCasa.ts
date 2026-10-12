import { useContext } from 'react'
import { ContextoCasa } from '../contexto/contextoCasa'

export function useCasa() {
  const valor = useContext(ContextoCasa)
  if (!valor) throw new Error('useCasa precisa ficar dentro do provedor da casa')
  return valor
}
