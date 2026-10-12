import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ContextoSessao } from './contextoSessao'
import { mensagemDeEntrada } from '../lib/errosAuth'
import { emojiUnico, lerPerfil, limparUsername, usernameValido, type Perfil } from '../lib/perfil'
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
    const id = usuarioId

    let cancelado = false
    let primeira = true

    async function carregar() {
      const inicial = primeira
      primeira = false
      const completo = await cliente.from('profiles').select('id, nome, username, emoji, cor')
      let linhas = completo.data
      let error = completo.error
      if (error && /schema cache|does not exist/i.test(error.message)) {
        const basico = await cliente.from('profiles').select('id, nome, emoji, cor')
        if (!basico.error) {
          linhas = (Array.isArray(basico.data) ? basico.data : []).map((linha) =>
            linha && typeof linha === 'object' ? { ...linha, username: '' } : linha,
          )
          error = null
        }
      }
      if (cancelado) return
      if (error) {
        if (!inicial) return
        setPerfis([])
        setErroPerfil('Não consegui ler os perfis. Confira se o SQL da migration rodou no Supabase.')
        setLidoPara(id)
        return
      }
      const lidos = (Array.isArray(linhas) ? linhas : [])
        .map(lerPerfil)
        .filter((item): item is Perfil => item !== null)
      const meu = lidos.find((item) => item.id === id)
      if (!meu) {
        if (!inicial) return
        setPerfis([])
        setErroPerfil(
          'Entrei com o seu e-mail, mas não achei o seu nome em profiles. Rode a migration antes de criar os usuários e, se precisar, apague os dois e crie de novo.',
        )
        setLidoPara(id)
        return
      }
      setPerfis(lidos)
      setErroPerfil(null)
      setLidoPara(id)
    }

    void carregar()

    const canal = cliente
      .channel('xingxing-perfis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void carregar()
      })
      .subscribe()

    return () => {
      cancelado = true
      void cliente.removeChannel(canal)
    }
  }, [cliente, usuarioId])

  const leituraPronta = typeof usuarioId === 'string' && lidoPara === usuarioId
  const perfil = leituraPronta ? (perfis.find((item) => item.id === usuarioId) ?? null) : null
  const outros = perfil ? perfis.filter((item) => item.id !== perfil.id) : []
  const erroPerfilAtual = leituraPronta ? erroPerfil : null

  async function entrar(username: string, senha: string) {
    const limpo = limparUsername(username)
    if (!usernameValido(limpo)) return 'O username usa de 3 a 20 letras minúsculas, números ou _.'

    const { data, error } = await cliente.rpc('email_por_username', { p_username: limpo })
    if (error) {
      if (/schema cache|does not exist|email_por_username/i.test(error.message)) {
        return 'O login por username ainda não está no banco. No SQL Editor, rode supabase/migrations/20261012190000_login_username.sql.'
      }
      return 'Não consegui entrar. Tente de novo em instantes.'
    }
    if (typeof data !== 'string' || !data.includes('@')) return 'Não encontrei esse username.'

    const { error: erroEntrada } = await cliente.auth.signInWithPassword({
      email: data,
      password: senha,
    })
    if (erroEntrada) return mensagemDeEntrada(erroEntrada)
    return null
  }

  async function sair() {
    const { error } = await cliente.auth.signOut()
    if (error) return 'Não consegui sair. Tente de novo.'
    return null
  }

  async function salvarPerfil(entrada: { nome: string; username: string; emoji: string }) {
    const nome = entrada.nome.trim()
    const username = limparUsername(entrada.username)
    const emoji = emojiUnico(entrada.emoji)
    if (nome.length > 40) return 'Use um nome de até 40 caracteres.'
    if (!usernameValido(username)) return 'O username usa de 3 a 20 letras minúsculas, números ou _.'
    if (!emoji) return 'Escolha um emoji só.'
    if (!usuarioId) return 'Entre de novo para salvar.'

    const { data, error } = await cliente
      .from('profiles')
      .update({ nome, username, emoji })
      .eq('id', usuarioId)
      .select('id, nome, username, emoji, cor')
      .maybeSingle()

    const atualizado = lerPerfil(data)
    if (error?.code === '23505') return 'Esse username já está em uso.'
    if (error?.code === '23514') return 'Confira o username e o emoji.'
    if (error && /schema cache|does not exist/i.test(error.message)) {
      const parcial = await cliente
        .from('profiles')
        .update({ nome, emoji })
        .eq('id', usuarioId)
        .select('id, nome, emoji, cor')
        .maybeSingle()
      const salvo = lerPerfil(parcial.data ? { ...parcial.data, username: '' } : null)
      if (parcial.error || !salvo) return 'Não consegui salvar.'
      setPerfis((atuais) => atuais.map((item) => (item.id === salvo.id ? salvo : item)))
      return 'O nome e o emoji foram salvos. O username entra depois de rodar supabase/migrations/20261012180000_username_e_caixa.sql no SQL Editor.'
    }
    if (error || !atualizado) return 'Não consegui salvar.'
    setPerfis((atuais) => atuais.map((item) => (item.id === atualizado.id ? atualizado : item)))
    return null
  }

  return (
    <ContextoSessao.Provider
      value={{ sessao, perfil, outros, erroPerfil: erroPerfilAtual, entrar, sair, salvarPerfil }}
    >
      {children}
    </ContextoSessao.Provider>
  )
}
