import { useState } from 'react'
import { IconeCupom } from '../componentes/IconesCupom'
import { useCasa } from '../hooks/useCasa'
import { ICONES_CUPOM, iconeConhecido, type Cupom } from '../lib/loja'

export function AjustesLoja() {
  const { dadosLoja, erroLoja, salvarCupomLoja, salvarDesejo, salvarLimite } = useCasa()
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  if (erroLoja && !dadosLoja) {
    return (
      <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
        <h3 className="font-bold">Lojinha</h3>
        <p className="mt-2 text-sm">{erroLoja}</p>
      </section>
    )
  }
  if (!dadosLoja) return null

  async function guardar(acao: () => Promise<string | null>) {
    setAviso(null)
    setErro(null)
    const mensagem = await acao()
    if (mensagem) setErro(mensagem)
    else setAviso('Salvo.')
  }

  return (
    <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
      <h3 className="font-bold">Lojinha</h3>
      <p className="mt-1 text-sm text-texto-suave">Custos, limite e o desejo do cofrinho. Os dois podem mudar.</p>
      {aviso && <p className="mt-2 text-sm">{aviso}</p>}
      {erro && (
        <p role="alert" className="mt-2 text-sm">
          {erro}
        </p>
      )}
      <Limite valor={dadosLoja.limitePassaVez} aoSalvar={(valor) => void guardar(() => salvarLimite(valor))} />
      {dadosLoja.cofrinho && (
        <Desejo
          titulo={dadosLoja.cofrinho.titulo}
          descricao={dadosLoja.cofrinho.descricao}
          custo={dadosLoja.cofrinho.custo}
          aberto={dadosLoja.cofrinho.status === 'aberto'}
          aoSalvar={(titulo, descricao, custo) => void guardar(() => salvarDesejo(titulo, descricao, custo))}
        />
      )}
      <ul className="mt-4 flex flex-col gap-4">
        {dadosLoja.cupons.map((cupom) => (
          <li key={cupom.id}>
            <EditorCupom cupom={cupom} aoSalvar={(rascunho) => void guardar(() => salvarCupomLoja(rascunho))} />
          </li>
        ))}
      </ul>
      <NovoCupom aoSalvar={(rascunho) => void guardar(() => salvarCupomLoja(rascunho))} />
    </section>
  )
}

function Limite({ valor, aoSalvar }: { valor: number; aoSalvar: (valor: number) => void }) {
  const [texto, setTexto] = useState(String(valor))
  return (
    <form
      className="mt-4 flex items-end gap-2"
      onSubmit={(evento) => {
        evento.preventDefault()
        const numero = Number(texto)
        if (!Number.isInteger(numero)) return
        aoSalvar(numero)
      }}
    >
      <label className="flex flex-1 flex-col gap-1 text-sm font-medium" htmlFor="limite-passa">
        Passa a vez por semana
        <input
          id="limite-passa"
          inputMode="numeric"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value.replace(/\D/g, '').slice(0, 1))}
          className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-[14px] bg-primaria px-4 font-medium text-sobre-primaria">
        Salvar
      </button>
    </form>
  )
}

function Desejo({
  titulo,
  descricao,
  custo,
  aberto,
  aoSalvar,
}: {
  titulo: string
  descricao: string
  custo: number
  aberto: boolean
  aoSalvar: (titulo: string, descricao: string, custo: number) => void
}) {
  const [nome, setNome] = useState(titulo)
  const [texto, setTexto] = useState(descricao)
  const [valor, setValor] = useState(String(custo))
  return (
    <form
      className="mt-4 flex flex-col gap-2 border-t border-borda pt-4"
      onSubmit={(evento) => {
        evento.preventDefault()
        const numero = Number(valor)
        if (!Number.isInteger(numero)) return
        aoSalvar(nome, texto, numero)
      }}
    >
      <h4 className="font-medium">{aberto ? 'Cofrinho aberto' : 'Próximo desejo'}</h4>
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="cofrinho-nome">
        Desejo
        <input
          id="cofrinho-nome"
          value={nome}
          maxLength={80}
          onChange={(evento) => setNome(evento.target.value)}
          className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="cofrinho-texto">
        Descrição
        <input
          id="cofrinho-texto"
          value={texto}
          maxLength={240}
          onChange={(evento) => setTexto(evento.target.value)}
          className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="cofrinho-custo">
        Custo em estrelinhas
        <input
          id="cofrinho-custo"
          inputMode="numeric"
          value={valor}
          onChange={(evento) => setValor(evento.target.value.replace(/\D/g, '').slice(0, 4))}
          className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal tabular-nums"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-[14px] bg-primaria font-medium text-sobre-primaria">
        {aberto ? 'Salvar desejo' : 'Abrir novo cofrinho'}
      </button>
    </form>
  )
}

function EditorCupom({ cupom, aoSalvar }: { cupom: Cupom; aoSalvar: (cupom: Cupom) => void }) {
  const [titulo, setTitulo] = useState(cupom.titulo)
  const [descricao, setDescricao] = useState(cupom.descricao)
  const [icone, setIcone] = useState(iconeConhecido(cupom.icone) ? cupom.icone : 'presente')
  const [custo, setCusto] = useState(String(cupom.custo))
  const [limite, setLimite] = useState(cupom.limiteSemana === null ? '' : String(cupom.limiteSemana))
  const [prazo, setPrazo] = useState(cupom.prazoDias === null ? '' : String(cupom.prazoDias))
  const [ativo, setAtivo] = useState(cupom.ativo)

  return (
    <form
      className="flex flex-col gap-2 border-t border-borda pt-4"
      onSubmit={(evento) => {
        evento.preventDefault()
        const numero = Number(custo)
        if (!Number.isInteger(numero)) return
        const limiteNumero = limite === '' ? null : Number(limite)
        const prazoNumero = prazo === '' ? null : Number(prazo)
        if (limiteNumero !== null && !Number.isInteger(limiteNumero)) return
        if (prazoNumero !== null && !Number.isInteger(prazoNumero)) return
        aoSalvar({
          ...cupom,
          titulo,
          descricao,
          icone,
          custo: numero,
          limiteSemana: cupom.tipo === 'passa_vez' ? null : limiteNumero,
          prazoDias: prazoNumero,
          ativo,
        })
      }}
    >
      <p className="font-medium">{cupom.tipo === 'passa_vez' ? 'Passa a vez' : 'Cupom'}</p>
      <Campo id={`titulo-${cupom.id}`} rotulo="Nome" valor={titulo} aoMudar={setTitulo} max={80} />
      <Campo id={`desc-${cupom.id}`} rotulo="Descrição" valor={descricao} aoMudar={setDescricao} max={240} />
      <SeletorIcone id={cupom.id} icone={icone} aoEscolher={setIcone} />
      <Campo id={`custo-${cupom.id}`} rotulo={cupom.tipo === 'passa_vez' ? 'Base, além da metade da tarefa' : 'Custo'} valor={custo} aoMudar={(valor) => setCusto(valor.replace(/\D/g, '').slice(0, 4))} />
      {cupom.tipo !== 'passa_vez' && (
        <Campo id={`limite-${cupom.id}`} rotulo="Limite por semana, em branco se não houver" valor={limite} aoMudar={(valor) => setLimite(valor.replace(/\D/g, '').slice(0, 2))} />
      )}
      <Campo id={`prazo-${cupom.id}`} rotulo="Prazo em dias, em branco se não houver" valor={prazo} aoMudar={(valor) => setPrazo(valor.replace(/\D/g, '').slice(0, 2))} />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={ativo} onChange={(evento) => setAtivo(evento.target.checked)} />
        Ativo na loja
      </label>
      <button type="submit" className="min-h-11 rounded-[14px] border border-borda font-medium">
        Salvar cupom
      </button>
    </form>
  )
}

function NovoCupom({ aoSalvar }: { aoSalvar: (cupom: Cupom) => void }) {
  const [aberto, setAberto] = useState(false)
  const vazio: Cupom = {
    id: '',
    titulo: '',
    descricao: '',
    custo: 20,
    icone: 'presente',
    ativo: true,
    limiteSemana: null,
    prazoDias: null,
    tipo: 'cupom',
    ordem: 50,
  }
  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="mt-4 min-h-11 w-full rounded-[14px] border border-borda font-medium">
        Novo cupom
      </button>
    )
  }
  return (
    <div className="mt-4">
      <EditorCupom
        cupom={vazio}
        aoSalvar={(cupom) => {
          aoSalvar({ ...cupom, id: '' })
          setAberto(false)
        }}
      />
    </div>
  )
}

function Campo({
  id,
  rotulo,
  valor,
  aoMudar,
  max = 8,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  max?: number
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium" htmlFor={id}>
      {rotulo}
      <input
        id={id}
        value={valor}
        maxLength={max}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="min-h-11 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
      />
    </label>
  )
}

function SeletorIcone({ id, icone, aoEscolher }: { id: string; icone: string; aoEscolher: (codigo: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Ícone</legend>
      <div role="radiogroup" aria-label="Ícone do cupom" className="mt-2 flex flex-wrap gap-2">
        {ICONES_CUPOM.map((item) => {
          const ativo = item.codigo === icone
          return (
            <button
              key={`${id}-${item.codigo}`}
              type="button"
              role="radio"
              aria-checked={ativo}
              aria-label={item.rotulo}
              onClick={() => aoEscolher(item.codigo)}
              className={`flex size-11 items-center justify-center rounded-full ${ativo ? 'bg-fundo text-primaria ring-2 ring-primaria' : 'bg-fundo text-texto'}`}
            >
              <IconeCupom codigo={item.codigo} className="size-6" />
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
