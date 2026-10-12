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
      <h2 id="guia-titulo" tabIndex={-1} className="text-lg font-bold">
        Como funciona
      </h2>
      <p className="mt-2 text-sm text-texto-suave">
        A Xingxing é a casa dos dois. Vocês jogam juntos: cada um tem o próprio placar, e não existe vencedor da
        semana. A moeda se chama estrelinhas.
      </p>

      <Cartao titulo="Cantos da tela">
        <p>O botão redondo no canto superior esquerdo abre este guia. Toque de novo, ou escolha uma aba embaixo, para voltar à tela em que você estava.</p>
        <p>O sino no canto superior direito mostra os últimos avisos. O número é o que ainda não foi aberto.</p>
      </Cartao>

      <Cartao titulo="Estrelinhas">
        <p>O número no topo é o seu, só desta semana. O cartão verde soma os dois contra a meta{meta ? ` de ${meta}` : ''}.</p>
        <p>Na aba Loja, Ganhas é tudo o que você já conquistou. Para gastar é o que ainda dá para usar num cupom ou no cofrinho. Gastar não mexe no número da semana.</p>
        {bonus !== undefined && bonus > 0 ? (
          <p>Rotina atrasada vale mais {bonus} estrelinhas por dia de atraso, até alguém fazer. O bônus aparece na própria tarefa.</p>
        ) : (
          <p>Rotina atrasada não ganha estrelinha extra.</p>
        )}
        <p>Ao concluir, a estrela do topo pula. Missão paga quando a última etapa fecha. Compra da casa paga quando é marcada na lista. O extrato, na loja, mostra de onde veio cada estrelinha.</p>
      </Cartao>

      <Cartao titulo="Hoje">
        <p>Entram as rotinas que vencem hoje e as atrasadas. Concluir registra quem fez, calcula a próxima data e tira a tarefa da lista do dia.</p>
        <p>Em Feitas hoje, dá para desfazer a sua conclusão, se ela ainda for a mais recente daquela tarefa. A tarefa volta. Se essas estrelinhas ainda estavam para gastar, o saldo da loja acompanha. O que o outro fez aparece como @username, mas só ele desfaz.</p>
      </Cartao>

      <Cartao titulo="Meta da semana">
        <p>
          A semana começa na segunda. Ela só fecha na segunda seguinte, quando alguém abre o app. Se os dois juntos
          chegaram à meta, Semanas seguidas sobe um. Se ficaram abaixo, a sequência volta a zero.
        </p>
        <p>A semana que está em curso continua aberta. Uma semana antiga sem nenhuma estrelinha, de antes de vocês começarem a fechar, não conta como derrota. Depois disso, semana vazia também zera a sequência.</p>
        {recompensa && <p>A recompensa combinada desta casa: {recompensa}</p>}
      </Cartao>

      <Cartao titulo="Loja">
        <p>A aba Loja lista os cupons da casa. Cada um gasta o próprio saldo, e outra pessoa da casa cumpre. Se houver mais de uma, o resgate pede quem. Resgatar pede confirmação e avisa essa pessoa. Ela marca feito, e quem resgatou carimba Cumprido.</p>
        <p>Passa a vez custa a base do cupom mais metade das estrelinhas da tarefa. O outro pode aceitar ou devolver. Devolver recoloca as estrelinhas para gastar. O limite da semana fica em Ajustes.</p>
        <p>O cofrinho é um desejo dos dois. Cada um deposita do próprio saldo. A barra mostra a parte de cada um. Quando enche, o desejo está cumprido e o próximo se combina em Ajustes.</p>
        <p>Em Ajustes dá para mudar custo, ícone, limite, prazo e o desejo do cofrinho, e também criar um cupom novo.</p>
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

      <Cartao titulo="Notificações">
        <p>
          Em Ajustes, Ativar notificações liga o aviso neste aparelho. O toque tem de ser seu. No iPhone, só funciona
          com o Xingxing aberto pelo ícone da Tela de Início, no iOS 16.4 ou mais novo. No Safari, o botão explica isso
          e não pede permissão.
        </p>
        <p>Quando um conclui uma tarefa, o outro recebe. Item novo na lista também avisa, e esse aviso tem interruptor próprio. Cupom resgatado, cupom feito, carimbo, Passa a vez e cofrinho cheio também avisam.</p>
        <p>
          O resumo do dia lista as rotinas de hoje e as atrasadas, no horário escolhido em Ajustes. O horário vale para
          os dois. Desligar neste aparelho tira o aviso daqui; o outro celular continua.
        </p>
        <p>
          Esses avisos também entram no sino, os 20 mais recentes, mesmo sem o push deste aparelho. Abrir o sino marca
          como lido. Quem aparece no texto é o @username.
        </p>
      </Cartao>

      <Cartao titulo="Os dois celulares">
        <p>Para entrar, use o username e a senha. O e-mail fica só na conta. A sessão fica neste aparelho. Fechar o app não pede a senha de novo. Sair, em Ajustes, é o que encerra.</p>
        <p>
          Em Ajustes ficam o emoji, o nome e o username. O nome tem até 40 caracteres e pode ficar em branco. O username
          tem de 3 a 20: letras minúsculas, números e _. Dá para preencher só o username, sem o nome.
        </p>
        <p>
          No topo, nas tarefas, nas compras e nos avisos, a pessoa aparece como @username. O nome, se existir, fica em
          Ajustes, na lista de quem também está na casa.
        </p>
        <p>A aparência fica em Automático, Dia ou Noite. Automático acompanha o claro ou escuro do celular.</p>
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
