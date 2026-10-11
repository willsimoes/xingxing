import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ContextoSessao } from './contextoSessao'
import { mensagemDeEntrada } from '../lib/errosAuth'
import { lerPerfil, type Perfil } from '../lib/perfil'
import { supabase } from '../lib/supabase'

type Props = { children: ReactNode }

export function ProvedorSessao({ children }: Props) {
  const cliente = supabase
  if (!cliente) return children

  return <SessaoLigada cliente={cliente}>{children}</SessaoLigada>
}

function SessaoLigada({
  cliente,
  children,
}: Props & { cliente: NonNullable<typeof supabase> }) {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [erroPerfil, setErroPerfil] = useState<string | null>(null)
  const [lidoPara, setLidoPara] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    cliente.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSessao(data.session ?? null)
    })

    const { data } = cliente.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova)
    })

    return () => {
      ativo = false
      data.subscription.unsubscribe()
    }
  }, [cliente])

  const usuarioId = sessao === undefined ? undefined : (sessao?.user.id ?? null)

  useEffect(() => {
    if (typeof usuarioId !== 'string') return

    let cancelado = false

    cliente
      .from('profiles')
      .select('id, nome, emoji, cor')
      .then(({ data: linhas, error }) => {
        if (cancelado) return
        if (error) {
          setPerfis([])
          setErroPerfil('Não consegui ler os perfis. Confira se o SQL da migration rodou no Supabase.')
          setLidoPara(usuarioId)
          return
        }
        const lidos = (Array.isArray(linhas) ? linhas : [])
          .map(lerPerfil)
          .filter((item): item is Perfil => item !== null)
        const meu = lidos.find((item) => item.id === usuarioId)
        if (!meu) {
          setPerfis([])
          setErroPerfil(
            'Entrei com o seu e-mail, mas não achei o seu nome em profiles. Rode a migration antes de criar os usuários e, se precisar, apague os dois e crie de novo.',
          )
          setLidoPara(usuarioId)
          return
        }
        setPerfis(lidos)
        setErroPerfil(null)
        setLidoPara(usuarioId)
      })

    return () => {
      cancelado = true
    }
  }, [cliente, usuarioId])

  const leituraPronta = typeof usuarioId === 'string' && lidoPara === usuarioId
  const perfil = leituraPronta ? (perfis.find((item) => item.id === usuarioId) ?? null) : null
  const outros = perfil ? perfis.filter((item) => item.id !== perfil.id) : []
  const erroPerfilAtual = leituraPronta ? erroPerfil : null

  async function entrar(email: string, senha: string) {
    const { error } = await cliente.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })
    if (error) return mensagemDeEntrada(error)
    return null
  }

  async function sair() {
    const { error } = await cliente.auth.signOut()
    if (error) return 'Não consegui sair. Tente de novo.'
    return null
  }

  async function salvarNome(nome: string) {
    const limpo = nome.trim()
    if (!limpo) return 'Escreva um nome.'
    if (limpo.length > 40) return 'Use um nome de até 40 caracteres.'
    if (!usuarioId) return 'Entre de novo para salvar o nome.'

    const { data, error } = await cliente
      .from('profiles')
      .update({ nome: limpo })
      .eq('id', usuarioId)
      .select('id, nome, emoji, cor')
      .maybeSingle()

    const atualizado = lerPerfil(data)
    if (error || !atualizado) return 'Não consegui salvar o nome.'
    setPerfis((atuais) => atuais.map((item) => (item.id === atualizado.id ? atualizado : item)))
    return null
  }

  return (
    <ContextoSessao.Provider
      value={{ sessao, perfil, outros, erroPerfil: erroPerfilAtual, entrar, sair, salvarNome }}
    >
      {children}
    </ContextoSessao.Provider>
  )
}
