import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSessao } from '../hooks/useSessao'
import { adicionarItem, comprarTarefa as gravarCompra, fecharSemanas, limparComprados, marcarItem } from '../lib/acoesCompra'
import {
  arquivarTarefa,
  concluirTarefa,
  desfazerConclusao,
  etapasConcluidas,
  gravarEtapa,
  reativarTarefa,
  salvarTarefa,
} from '../lib/acoesTarefa'
import { dataNoFuso, FUSO_PADRAO, segundaDaSemana } from '../lib/datas'
import { precisaFechar } from '../lib/fechamento'
import {
  aceitarPassaVez,
  confirmarCupom,
  depositarCofrinho,
  marcarCupomFeito,
  negociarPassaVez,
  resgatarCupom,
  salvarCofrinho,
  salvarCupom,
  salvarLimitePassaVez,
} from '../lib/acoesLoja'
import { lerTudo, type DadosCasa } from '../lib/lerCasa'
import { lerLoja, type Cupom, type DadosLoja } from '../lib/loja'
import { supabase } from '../lib/supabase'
import type { RascunhoTarefa } from '../lib/tarefas'
import { ContextoCasa } from './contextoCasa'

const tabelas = ['tarefas', 'etapas', 'conclusoes', 'comodos', 'casa', 'itens_compra'] as const

export function ProvedorCasa({ children }: { children: ReactNode }) {
  if (!supabase) return children
  return <CasaLigada cliente={supabase}>{children}</CasaLigada>
}

function CasaLigada({ cliente, children }: { cliente: SupabaseClient; children: ReactNode }) {
  const { perfil } = useSessao()
  const [dados, setDados] = useState<DadosCasa | null>(null)
  const [dadosLoja, setDadosLoja] = useState<DadosLoja | null>(null)
  const [erroLoja, setErroLoja] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [agora, setAgora] = useState(() => new Date())
  const [animacaoEstrela, setAnimacaoEstrela] = useState(0)
  const [avisoFechamento, setAvisoFechamento] = useState<string | null>(null)
  const carregarRef = useRef<() => Promise<void>>(async () => {})
  const dadosRef = useRef(dados)
  const pularFechamento = useRef(false)

  useEffect(() => {
    dadosRef.current = dados
  }, [dados])

  useEffect(() => {
    let vivo = true
    let pedido = 0

    async function carregar() {
      const meu = ++pedido
      let resultado = await lerTudo(cliente)
      if (!vivo || meu !== pedido) return
      if (
        resultado.dados &&
        !pularFechamento.current &&
        precisaFechar(resultado.dados.casa, dataNoFuso(new Date(), resultado.dados.casa.fuso))
      ) {
        const fechamento = await fecharSemanas(cliente)
        if (!vivo || meu !== pedido) return
        if (fechamento.semFuncao) pularFechamento.current = true
        if (fechamento.erro || fechamento.aviso) setAvisoFechamento(fechamento.erro ?? fechamento.aviso)
        if (fechamento.resultado?.atualizou) {
          resultado = await lerTudo(cliente)
          if (!vivo || meu !== pedido) return
        }
      }
      setAgora(new Date())
      if (resultado.erro || !resultado.dados) {
        setCarregando(false)
        setErro(resultado.erro ?? 'Não consegui ler as tarefas.')
        return
      }
      setErro(null)
      setDados(resultado.dados)
      const loja = await lerLoja(cliente)
      if (!vivo || meu !== pedido) return
      setDadosLoja(loja.dados)
      setErroLoja(loja.erro)
      setCarregando(false)
    }

    carregarRef.current = carregar
    void carregar()

    return () => {
      vivo = false
    }
  }, [cliente])

  useEffect(() => {
    let timer = 0
    let canal = cliente.channel('xingxing-casa')
    for (const tabela of tabelas) {
      canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void carregarRef.current(), 200)
      })
    }
    canal.subscribe()

    return () => {
      window.clearTimeout(timer)
      void cliente.removeChannel(canal)
    }
  }, [cliente])

  useEffect(() => {
    let timer = 0
    const canal = cliente.channel('xingxing-loja')
    for (const tabela of ['movimentos', 'resgates', 'cofrinhos', 'cupons'] as const) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => {
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void carregarRef.current(), 200)
      })
    }
    canal.subscribe()
    return () => {
      window.clearTimeout(timer)
      void cliente.removeChannel(canal)
    }
  }, [cliente])

  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === 'visible') void carregarRef.current()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [])

  const fuso = dados?.casa.fuso ?? FUSO_PADRAO
  const hoje = dataNoFuso(agora, fuso)
  const semana = segundaDaSemana(hoje)

  async function concluir(tarefaId: string) {
    const falha = await concluirTarefa(cliente, tarefaId)
    if (!falha) setAnimacaoEstrela((valor) => valor + 1)
    await carregarRef.current()
    return falha
  }

  async function desfazer(conclusaoId: string) {
    const falha = await desfazerConclusao(cliente, conclusaoId)
    await carregarRef.current()
    return falha
  }

  async function marcarEtapa(etapaId: string, marcar: boolean) {
    const usuarioId = perfil?.id
    if (!usuarioId) return 'Entre de novo para atualizar a etapa.'
    const etapa = dadosRef.current?.etapas.find((item) => item.id === etapaId)
    if (!etapa) return 'Não achei essa etapa.'

    const falha = await gravarEtapa(cliente, etapaId, marcar, usuarioId)
    if (falha) {
      await carregarRef.current()
      return falha
    }

    if (marcar) {
      const prontas = await etapasConcluidas(cliente, etapa.tarefaId)
      if (prontas) {
        const erroConclusao = await concluirTarefa(cliente, etapa.tarefaId)
        if (!erroConclusao) setAnimacaoEstrela((valor) => valor + 1)
        await carregarRef.current()
        return erroConclusao
      }
    }

    await carregarRef.current()
    return null
  }

  async function salvar(rascunho: RascunhoTarefa) {
    const falha = await salvarTarefa(cliente, rascunho)
    await carregarRef.current()
    return falha
  }

  async function arquivar(tarefaId: string) {
    const falha = await arquivarTarefa(cliente, tarefaId)
    await carregarRef.current()
    return falha
  }

  async function adicionarCompra(nome: string) {
    const usuarioId = perfil?.id
    if (!usuarioId) return 'Entre de novo para adicionar.'
    const falha = await adicionarItem(cliente, nome, usuarioId)
    await carregarRef.current()
    return falha
  }

  async function marcarCompra(itemId: string, comprado: boolean) {
    const usuarioId = perfil?.id
    if (!usuarioId) return 'Entre de novo para atualizar a lista.'
    const item = dadosRef.current?.itens.find((atual) => atual.id === itemId)
    if (!item) return 'Não achei esse item.'
    if (item.tarefaId) return 'Essa compra faz parte de uma tarefa da casa.'
    const falha = await marcarItem(cliente, itemId, comprado, usuarioId)
    await carregarRef.current()
    return falha
  }

  async function comprarTarefa(tarefaId: string) {
    const tarefa = dadosRef.current?.tarefas.find((atual) => atual.id === tarefaId)
    const falha = await gravarCompra(cliente, tarefaId)
    if (!falha && tarefa && tarefa.estrelinhas > 0) setAnimacaoEstrela((valor) => valor + 1)
    await carregarRef.current()
    return falha
  }

  async function limparCompras() {
    const falha = await limparComprados(cliente)
    await carregarRef.current()
    return falha
  }

  async function agirLoja(acao: () => Promise<string | null>) {
    const falha = await acao()
    await carregarRef.current()
    return falha
  }

  async function reativar(tarefaId: string) {
    const atual = dadosRef.current
    const tarefa = atual?.tarefas.find((item) => item.id === tarefaId)
    const proxima =
      tarefa?.tipo === 'rotina' && !tarefa.proximaData
        ? dataNoFuso(new Date(), atual?.casa.fuso ?? FUSO_PADRAO)
        : null
    const falha = await reativarTarefa(cliente, tarefaId, proxima)
    await carregarRef.current()
    return falha
  }

  return (
    <ContextoCasa.Provider
      value={{
        carregando,
        erro,
        avisoFechamento,
        dados,
        dadosLoja,
        erroLoja,
        hoje,
        semana,
        animacaoEstrela,
        concluir,
        desfazer,
        marcarEtapa,
        salvar,
        arquivar,
        reativar,
        adicionarCompra,
        marcarCompra,
        comprarTarefa,
        limparCompras,
        resgatar: (cupomId, tarefaId, quem) => agirLoja(() => resgatarCupom(cliente, cupomId, tarefaId, quem)),
        marcarFeito: (resgateId) => agirLoja(() => marcarCupomFeito(cliente, resgateId)),
        confirmarResgate: (resgateId) => agirLoja(() => confirmarCupom(cliente, resgateId)),
        aceitarPassa: (resgateId) => agirLoja(() => aceitarPassaVez(cliente, resgateId)),
        devolverPassa: (resgateId) => agirLoja(() => negociarPassaVez(cliente, resgateId)),
        depositar: (quantidade) => agirLoja(() => depositarCofrinho(cliente, quantidade)),
        salvarCupomLoja: (cupom: Cupom) =>
          agirLoja(() =>
            salvarCupom(cliente, {
              id: cupom.id || null,
              titulo: cupom.titulo,
              descricao: cupom.descricao,
              icone: cupom.icone,
              custo: cupom.custo,
              limiteSemana: cupom.limiteSemana,
              prazoDias: cupom.prazoDias,
              ativo: cupom.ativo,
            }),
          ),
        salvarDesejo: (titulo, descricao, custo) => agirLoja(() => salvarCofrinho(cliente, { titulo, descricao, custo })),
        salvarLimite: (valor) => agirLoja(() => salvarLimitePassaVez(cliente, valor)),
      }}
    >
      {children}
    </ContextoCasa.Provider>
  )
}
