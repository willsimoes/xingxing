import { useEffect, useRef, useState } from 'react'
import { useSessao } from '../hooks/useSessao'
import { lerAvisos, marcarAvisosLidos, textoQuando, type Aviso } from '../lib/notificacoes'
import { supabase } from '../lib/supabase'
import { IconeSino } from './Icones'

export function SinoNotificacoes() {
  const { perfil } = useSessao()
  const cliente = supabase
  const usuarioId = perfil?.id
  const caixa = useRef<HTMLDivElement>(null)
  const [aberto, setAberto] = useState(false)
  const [itens, setItens] = useState<Aviso[]>([])
  const [destaque, setDestaque] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)
  const naoLidas = itens.filter((item) => !item.lida).length

  useEffect(() => {
    if (!cliente || !usuarioId) return
    let ativo = true

    async function carregar() {
      if (!cliente || !usuarioId) return
      const resultado = await lerAvisos(cliente, usuarioId)
      if (!ativo) return
      setItens(resultado.avisos)
      setErro(resultado.erro)
      setPronto(true)
    }

    void carregar()

    const canal = cliente
      .channel(`xingxing-avisos-${usuarioId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `usuario_id=eq.${usuarioId}` },
        () => {
          void carregar()
        },
      )
      .subscribe()

    return () => {
      ativo = false
      void cliente.removeChannel(canal)
    }
  }, [cliente, usuarioId])

  useEffect(() => {
    if (!aberto) return
    function aoPointer(evento: PointerEvent) {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false)
    }
    function aoTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', aoPointer)
    document.addEventListener('keydown', aoTecla)
    return () => {
      document.removeEventListener('pointerdown', aoPointer)
      document.removeEventListener('keydown', aoTecla)
    }
  }, [aberto])

  if (!perfil || !cliente) return null

  async function aoAlternar() {
    const vaiAbrir = !aberto
    setAberto(vaiAbrir)
    if (!vaiAbrir || !cliente) return
    setDestaque(itens.filter((item) => !item.lida).map((item) => item.id))
    const falha = await marcarAvisosLidos(cliente)
    if (!falha) setItens((atuais) => atuais.map((item) => ({ ...item, lida: true })))
  }

  return (
    <div className="relative" ref={caixa}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="painel-notificacoes"
        aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} sem abrir` : 'Notificações'}
        onClick={() => void aoAlternar()}
        className="relative flex size-11 items-center justify-center rounded-full border border-borda bg-superficie text-texto shadow-md"
      >
        <IconeSino className="size-6" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secundaria px-1 text-xs font-medium text-sobre-secundaria">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>
      {aberto && (
        <div
          id="painel-notificacoes"
          className="absolute right-0 z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-[20px] border border-borda bg-superficie shadow-lg"
        >
          <p className="border-b border-borda px-4 py-3 font-bold">Últimas notificações</p>
          {erro && (
            <p role="alert" className="px-4 py-3 text-sm [overflow-wrap:anywhere]">
              {erro}
            </p>
          )}
          {!erro && !pronto && <p className="px-4 py-3 text-sm text-texto-suave">Carregando…</p>}
          {!erro && pronto && itens.length === 0 && (
            <p className="px-4 py-3 text-sm text-texto-suave">Nenhuma notificação ainda.</p>
          )}
          {itens.length > 0 && (
            <ul className="max-h-80 overflow-y-auto">
              {itens.map((item) => (
                <li
                  key={item.id}
                  className={`border-b border-borda px-4 py-3 last:border-b-0 ${
                    destaque.includes(item.id) ? 'bg-fundo' : ''
                  }`}
                >
                  <p className="font-medium">{item.titulo}</p>
                  <p className="mt-1 text-sm">{item.corpo}</p>
                  <p className="mt-1 text-sm text-texto-suave">{textoQuando(item.criadaEm)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
