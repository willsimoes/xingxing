import type { ReactNode } from 'react'
import { useCasa } from '../hooks/useCasa'
import { ajudaFrequencia, frequenciasRotina } from '../lib/tarefas'

export function Guia() {
  const { dados } = useCasa()
  const meta = dados?.casa.metaSemanal
  const bonus = dados?.casa.bonusPorDia
  const recompensa = dados?.casa.recompensa.trim() ?? ''
  const compra = dados?.tarefas.find((tarefa) => tarefa.tipo === 'compra' && tarefa.status === 'ativa')
  const liberada = compra?.liberaTarefaId
    ? dados?.tarefas.find((tarefa) => tarefa.id === compra.liberaTarefaId)
    : undefined

  return (
    <div>
      <h2 className="text-lg font-bold">Como funciona</h2>
      <p className="mt-2 text-sm text-texto-suave">
        A Xingxing é a casa dos dois. Vocês jogam juntos: cada um tem o próprio placar, e não existe vencedor da
        semana. A moeda se chama estrelinhas.
      </p>

      <Cartao titulo="Estrelinhas">
        <p>O número no topo é o seu, só desta semana. O cartão verde soma os dois contra a meta{meta ? ` de ${meta}` : ''}.</p>
        {bonus !== undefined && bonus > 0 ? (
          <p>Rotina atrasada vale mais {bonus} estrelinhas por dia de atraso, até alguém fazer. O bônus aparece na própria tarefa.</p>
        ) : (
          <p>Rotina atrasada não ganha estrelinha extra.</p>
        )}
        <p>Ao concluir, a estrela do topo pula. Missão paga quando a última etapa fecha. Compra da casa paga quando é marcada na lista.</p>
      </Cartao>

      <Cartao titulo="Hoje">
        <p>Entram as rotinas que vencem hoje e as atrasadas. Concluir registra quem fez, calcula a próxima data e tira a tarefa da lista do dia.</p>
        <p>Em Feitas hoje, dá para desfazer a sua conclusão, se ela ainda for a mais recente daquela tarefa. A tarefa volta e as estrelinhas saem. O que o outro fez aparece, mas só ele desfaz.</p>
      </Cartao>

      <Cartao titulo="Meta da semana">
        <p>
          A semana começa na segunda. Ela só fecha na segunda seguinte, quando alguém abre o app. Se os dois juntos
          chegaram à meta, Semanas seguidas sobe um. Se ficaram abaixo, a sequência volta a zero.
        </p>
        <p>A semana que está em curso continua aberta. Uma semana antiga sem nenhuma estrelinha, de antes de vocês começarem a fechar, não conta como derrota. Depois disso, semana vazia também zera a sequência.</p>
        {recompensa && <p>A recompensa combinada desta casa: {recompensa}</p>}
      </Cartao>

      <Cartao titulo="Saúde dos cômodos">
        <p>Cada barrinha é a média das rotinas ativas daquele cômodo. Missão e tarefa esperando uma compra ficam de fora.</p>
        <p>No dia do vencimento, a rotina vale metade. Logo depois de feita, fica cheia. Se o atraso completar um ciclo, ela zera.</p>
        <ul className="list-disc pl-5">
          <li>75% ou mais: em dia</li>
          <li>de 40% a 74%: pedindo cuidado</li>
          <li>abaixo de 40%: atrasando</li>
        </ul>
        <p>O ciclo é o tempo da rotina: 1 dia se for todo dia, os dias que vocês escolherem, cerca de 7 dividido pelas vezes na semana, 7 dias na semanal, 14 na quinzenal, 30 na mensal e a validade no filtro.</p>
        <p>A mesma barrinha aparece no título do cômodo, em Tarefas.</p>
      </Cartao>

      <Cartao titulo="Tarefas">
        <p>A lista é por cômodo, com filtro de rotinas e missões. Dá para criar, editar, arquivar e reativar. O nome cabe em 120 caracteres, as estrelinhas vão de 0 a 999 e uma missão tem no máximo 12 etapas, cada uma com até 120 caracteres.</p>
        <p>Vezes na semana vão de 1 a 7. Intervalo e validade vão de 1 a 365 dias.</p>
        <p>Rotina só se conclui no dia ou atrasada. Antes disso, ela só mostra quando volta. Tarefa esperando a compra aparece com essa etiqueta e também não marca. A próxima data anda sozinha:</p>
        <ul className="list-disc pl-5">
          {frequenciasRotina.map((item) => (
            <li key={item.id}>
              {item.rotulo}. {ajudaFrequencia(item.id)}
            </li>
          ))}
        </ul>
        <p>Missão é única. Sem etapas, marcar já conclui e arquiva. Com etapas, dá para marcar e desmarcar cada uma; as estrelinhas entram quando a última fecha e alguém toca em Concluir missão. Aí ela arquiva. Desfazer, na lista de arquivadas, devolve a missão se você concluiu e essa ainda é a conclusão mais recente.</p>
        <p>Arquivar tira a tarefa da lista do dia. Reativar traz de volta. Rotina reativada sem data volta para hoje.</p>
      </Cartao>

      <Cartao titulo="Compras">
        <p>A lista é dos dois. Dá para adicionar, marcar, desmarcar e limpar os comprados. O que um faz, o outro vê se os dois estiverem com o app aberto.</p>
        {compra ? (
          <p>
            {compra.titulo} é uma compra da casa
            {compra.estrelinhas > 0 ? ` e vale ${compra.estrelinhas} estrelinhas` : ''}.
            {liberada
              ? ` Marcar libera ${liberada.titulo}. Desmarcar devolve as estrelinhas e bloqueia de novo, se ${liberada.titulo} ainda não tiver sido feita.`
              : ' Marcar conclui a compra. Desmarcar devolve as estrelinhas.'}{' '}
            Só quem marcou desfaz essa compra.
          </p>
        ) : (
          <p>
            Uma compra da casa paga estrelinhas e pode liberar outra tarefa. Desmarcar devolve as estrelinhas e bloqueia
            de novo, se a tarefa liberada ainda não tiver sido feita. Só quem marcou desfaz.
          </p>
        )}
        <p>Item comum, como leite, não paga estrelinha. Qualquer um marca e desmarca. Limpar comprados tira os itens da lista. Estrelinhas já ganhas ficam.</p>
      </Cartao>

      <Cartao titulo="Os dois celulares">
        <p>A sessão fica neste aparelho. Fechar o app não pede a senha de novo. Sair, em Ajustes, é o que encerra.</p>
        <p>Em Ajustes também ficam o nome que o outro vê, com até 40 caracteres, e a aparência: Automático, Dia ou Noite. Automático acompanha o claro ou escuro do celular.</p>
      </Cartao>
    </div>
  )
}

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-[20px] border border-borda bg-superficie p-4">
      <h3 className="font-bold">{titulo}</h3>
      <div className="mt-2 flex flex-col gap-2 text-sm">{children}</div>
    </section>
  )
}
