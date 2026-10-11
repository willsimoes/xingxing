import { useState } from 'react'
import { InstalarIphone } from './componentes/InstalarIphone'
import { Estrela } from './componentes/Estrela'
import { Navegacao, type Aba } from './componentes/Navegacao'
import { ProvedorSessao } from './contexto/Sessao'
import { useSessao } from './hooks/useSessao'
import { useTema } from './hooks/useTema'
import { corSegura } from './lib/perfil'
import { problemaConfig } from './lib/supabase'
import { Ajustes } from './telas/Ajustes'
import { Abrindo, AvisoConfiguracao, Login, PerfilIndisponivel } from './telas/Acesso'
import { Compras } from './telas/Compras'
import { Hoje } from './telas/Hoje'
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

  return <Casa tema={tema} />
}

function Casa({ tema }: { tema: ReturnType<typeof useTema> }) {
  const [aba, setAba] = useState<Aba>('hoje')
  const { perfil } = useSessao()
  if (!perfil) return null

  const cor = corSegura(perfil.cor)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Xingxing</h1>
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-texto-suave" aria-label={perfil.nome}>
            {cor && (
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
            )}
            <span aria-hidden="true">{perfil.emoji}</span>
            <span className="truncate">{perfil.nome}</span>
          </p>
        </div>
        <p
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-borda bg-superficie px-3"
          aria-label="0 estrelinhas"
        >
          <Estrela />
          <span className="font-medium tabular-nums">0</span>
        </p>
      </header>
      <main className="flex-1 px-4 pb-4">
        <InstalarIphone />
        {aba === 'hoje' && <Hoje />}
        {aba === 'tarefas' && <Tarefas />}
        {aba === 'compras' && <Compras />}
        {aba === 'ajustes' && <Ajustes escolha={tema.escolha} aoEscolher={tema.definir} />}
      </main>
      <Navegacao aba={aba} aoEscolher={setAba} />
    </div>
  )
}
