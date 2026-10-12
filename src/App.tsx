import { useEffect, useState } from 'react'
import { InstalarIphone } from './componentes/InstalarIphone'
import { Estrela } from './componentes/Estrela'
import { IconeGuia } from './componentes/Icones'
import { Navegacao, type Aba } from './componentes/Navegacao'
import { SinoNotificacoes } from './componentes/SinoNotificacoes'
import { ProvedorCasa } from './contexto/Casa'
import { ProvedorSessao } from './contexto/Sessao'
import { useCasa } from './hooks/useCasa'
import { useSessao } from './hooks/useSessao'
import { useTema } from './hooks/useTema'
import { corSegura } from './lib/perfil'
import { saldoNaSemana } from './lib/tarefas'
import { problemaConfig } from './lib/supabase'
import { Ajustes } from './telas/Ajustes'
import { Abrindo, AvisoConfiguracao, Login, PerfilIndisponivel } from './telas/Acesso'
import { Compras } from './telas/Compras'
import { Guia } from './telas/Guia'
import { Hoje } from './telas/Hoje'
import { Loja } from './telas/Loja'
import { Tarefas } from './telas/Tarefas'

export default function App() {
  const tema = useTema()

  if (problemaConfig) return <AvisoConfiguracao problema={problemaConfig} />

  return (
    <ProvedorSessao>
      <ComSessao tema={tema} />
    </ProvedorSessao>
  )
}

function ComSessao({ tema }: { tema: ReturnType<typeof useTema> }) {
  const { sessao, perfil, erroPerfil } = useSessao()

  if (sessao === undefined || (sessao && !perfil && !erroPerfil)) return <Abrindo />
  if (!sessao) return <Login />
  if (!perfil) return <PerfilIndisponivel />

  return (
    <ProvedorCasa>
      <Casa tema={tema} />
    </ProvedorCasa>
  )
}

function Casa({ tema }: { tema: ReturnType<typeof useTema> }) {
  const [aba, setAba] = useState<Aba>('hoje')
  const [guiaAberta, setGuiaAberta] = useState(false)
  const { perfil } = useSessao()
  const { dados, semana, animacaoEstrela } = useCasa()

  useEffect(() => {
    if (!guiaAberta) return
    document.getElementById('guia-titulo')?.focus()
  }, [guiaAberta])

  if (!perfil) return null

  const cor = corSegura(perfil.cor)
  const saldo = dados ? saldoNaSemana(dados.conclusoes, perfil.id, semana) : null
  const identidade = perfil.username
    ? perfil.nome
      ? `${perfil.nome}, @${perfil.username}`
      : `@${perfil.username}`
    : perfil.nome

  function alternarGuia() {
    setGuiaAberta((aberta) => !aberta)
    window.scrollTo({ top: 0, left: 0 })
  }

  function escolherAba(proxima: Aba) {
    setGuiaAberta(false)
    setAba(proxima)
    window.scrollTo({ top: 0, left: 0 })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-fundo px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          type="button"
          aria-expanded={guiaAberta}
          aria-controls="conteudo"
          onClick={alternarGuia}
          aria-label={guiaAberta ? 'Fechar o guia' : 'Abrir o guia'}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border shadow-md ${
            guiaAberta
              ? 'border-primaria bg-primaria text-sobre-primaria'
              : 'border-borda bg-superficie text-texto'
          }`}
        >
          <IconeGuia className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">Xingxing</h1>
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-texto-suave" aria-label={identidade}>
            {cor && (
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
            )}
            <span aria-hidden="true">{perfil.emoji}</span>
            <span className="truncate">{perfil.username ? `@${perfil.username}` : perfil.nome}</span>
          </p>
        </div>
        <p
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-borda bg-superficie px-3"
          aria-live="polite"
          aria-label={saldo === null ? 'Carregando estrelinhas' : `${saldo} estrelinhas suas nesta semana`}
        >
          <Estrela key={animacaoEstrela} animar={animacaoEstrela > 0} />
          <span className="font-medium tabular-nums">{saldo === null ? '…' : saldo}</span>
        </p>
        <SinoNotificacoes />
      </header>
      <main id="conteudo" className="flex-1 px-4 pb-4">
        <InstalarIphone />
        {guiaAberta ? (
          <Guia />
        ) : (
          <>
            {aba === 'hoje' && <Hoje />}
            {aba === 'tarefas' && <Tarefas />}
            {aba === 'compras' && <Compras />}
            {aba === 'loja' && <Loja />}
            {aba === 'ajustes' && <Ajustes escolha={tema.escolha} aoEscolher={tema.definir} />}
          </>
        )}
      </main>
      <Navegacao aba={aba} aoEscolher={escolherAba} />
    </div>
  )
}
