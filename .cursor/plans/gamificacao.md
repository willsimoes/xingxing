# Xingxing: meta semanal, lojinha e estímulos

Plano combinado em 12 de outubro de 2026.

Implementado em 12 de outubro de 2026: dois saldos, extrato, lojinha de cupons, Passa a vez e cofrinho. SQL em `supabase/migrations/20261012200000_loja_e_saldos.sql`. Aba Loja e ajustes da loja.

Ainda não implementado: meta sugerida, retrospectiva, lanternas, folga, marcos, estrela da sorte, atraso em percentual, combo, gratidão, desafio, galho de cerejeira e falas. Conquistas continuam fora.

O desenho abaixo segue valendo para o que falta. A loja já segue a parte de cupons, resgates, cofrinho, motivos e movimentos.

Fora de escopo: conquistas. Não implementar. O histórico de estrelinhas precisa aceitar tipo novo de movimento no futuro (uma linha em `motivos`, sem reescrever a soma).

Nada pode exigir plano pago do Supabase. Cálculo fica em SQL (`pg_cron` e `pg_net` já usados). Push continua na Edge Function `enviar-push`. Confete, lanternas e galho são desenho no app.

## Princípios

- Tom cooperativo. Placar individual, sem perdedor e sem vencedor da semana.
- Nada de punição. Ninguém perde estrelinha por atraso. Nenhuma mensagem soa como cobrança ou culpa. O estímulo é sempre ganhar algo.
- A moeda é estrelinhas, com o ícone de estrela em `--destaque`. Nunca "pontos".
- Recompensas pequenas e frequentes, e algumas grandes e raras.
- Só tokens do tema (`--primaria`, `--secundaria`, `--destaque`, `--matcha-forte` e os demais) e ícones SVG de traço arredondado. Funções novas não usam emoji. Emoji que já existe em perfil e cômodo permanece.
- Todo número ajustável fica em `parametros` ou no custo do próprio cupom, editável em Ajustes. Não fixar no código.
- Semana de segunda a domingo, fuso `America/Sao_Paulo`.
- `prefers-reduced-motion`: animação vira transição de opacidade.
- Cada mudança visível atualiza `src/telas/Guia.tsx` na mesma tarefa.
- Saldos e bônus rodam no banco, para os dois celulares verem o mesmo número.

## Decisão já fechada: desfazer

Desfazer a própria conclusão devolve a tarefa e tira aquelas estrelinhas, gravando um movimento `correcao` negativo. Sem isso, concluir e desfazer geraria estrelinhas infinitas.

O saldo ganho não cai por atraso nem por gasto. Gasto só mexe no saldo disponível. O texto nunca fala em perda: a tarefa voltou.

## O que já existe (não duplicar)

- `conclusoes` guarda `estrelinhas_base` e `estrelinhas_bonus`. O placar da semana é a soma, hoje calculada no app. A conclusão continua existindo como registro de quem fez a tarefa.
- `concluir_tarefa` soma `casa.bonus_por_dia` (padrão 2) por dia de atraso. Vai virar percentual. `tarefas.dobro` existe e não faz nada: usar para a estrela da sorte.
- `desfazer_conclusao` apaga a conclusão. Passa a gravar `correcao` em vez de só apagar o saldo.
- `casa`: `meta_semanal` padrão 300, `recompensa`, `semanas_seguidas`, `ultima_semana_fechada`, `ultima_semana_bateu`, `bonus_por_dia`, `horario_resumo` (padrão 8h), `fuso`. Meta e recompensa não têm campo em Ajustes. A barra do cartão verde é uma só, na cor secundária.
- `fechar_semanas()` roda quando alguém abre o app depois da segunda. Semana vazia anterior ao primeiro uso não zera a sequência. Não há retrospectiva nem histórico.
- Saúde dos cômodos já calcula 0–100 (`src/lib/saude.ts`, `Barrinha`). A barrinha vira galho; o cálculo permanece.
- Notificações: caixa do sino (20 mais recentes), push, interruptores de conclusão, compra e resumo. Sem teto diário e sem silêncio.
- `cupons` é só título, descrição, custo e ativo, sem tela. Aproveitar essa tabela.
- `conquistas` e `conquistas_desbloqueadas` ficam intocadas.

## Ordem de implementação

Uma etapa por vez, e ao final dizer como testar com dois usuários (dois navegadores) e no iPhone.

1. Dois saldos + histórico (extrato)
2. Meta semanal e retrospectiva
3. Lojinha e cofrinho
4. Estrela da sorte, recompensa acumulada e combo
5. Gratidão e desafio da semana
6. Saúde dos cômodos (galho)
7. Reações da Xingxing

Migrations SQL versionadas. Seeds de cupons, desafios e falas.

## Motivos

Tabela `motivos` (`codigo` text, `conta_nas_ganhas`, `conta_na_meta`, `conta_no_disponivel`).

| codigo | ganhas | meta | disponível |
| --- | --- | --- | --- |
| tarefa, bonus, sorte, gratidao, combo, desafio | sim | sim | sim |
| sequencia | sim | não | sim |
| cupom, cofrinho | não | não | sim |
| correcao | sim | sim | sim |

O bônus de sequência entra depois que a meta já foi batida, então não empurra a própria semana. Conquista futura é um insert nessa tabela.

## Movimentos

`movimentos`: `usuario_id`, `quantidade` (positivo ou negativo), `motivo`, `semana` (a segunda), `criado_em`, `referencia_id` opcional (conclusão, resgate, depósito, gratidão).

Ninguém insere direto pelo app. Só funções do banco, na mesma transação de concluir, comprar ou desfazer.

Funções estáveis:

- ganhas = soma em que o motivo conta nas ganhas
- disponível = soma em que o motivo conta no disponível
- meta da semana = soma daquela segunda, dos dois, em que o motivo conta na meta

Extrato: cada um lê só os próprios movimentos. A barra da meta usa a função de soma, não o extrato do outro.

RLS: movimentos e gratidões, cada um lê os seus. Resgates, os dois leem e ninguém insere direto. Parâmetros, semanas, cupons, cofrinho, desafios e falas, os dois leem. Parâmetros, os dois atualizam.

## Parâmetros

`parametros`: chave, valor inteiro, rótulo. Editável em Ajustes.

Seed: sugestão da meta 80; bônus de sequência 10 até 50; atraso 10% ao dia até 100% (dobro); gratidão 2, limite 5 por dia para quem recebe; combo de 3 tarefas = 5, combo de 5 = 15; base do Passa a vez 40 e limite 1 por semana por pessoa; no máximo 3 avisos automáticos por dia; silêncio 22h–8h; até 8 lanternas visíveis.

Custo de cada cupom fica em `cupons.custo`, também editável. `casa.bonus_por_dia` deixa de ser a regra. Gravar `dias_atraso` na conclusão, porque o desfazer hoje reconstrói o atraso dividindo o bônus pelo valor fixo, e isso quebra com percentual.

## Casa e semanas

`casa` ganha: se a meta foi ajustada à mão, se a recompensa já travou (trava ao bater 100%) e o mês em que a folga foi usada. Meta, recompensa, sequência e última semana fechada continuam aqui.

Sugestão: 80% das estrelinhas possíveis das rotinas daquela semana, arredondado. Enquanto a meta não tiver sido editada à mão, a segunda atualiza para a sugestão. Botão "usar a sugestão" em Ajustes. Recompensa é texto livre, editável até a meta ser batida.

Barra única no cartão "Meta da semana" (`--matcha-forte`), somando os dois, com a parte de cada um visível: quem entrou primeiro na casa em `--primaria`, o outro em `--secundaria`.

Sequência: lanternas de papel acesas, uma por semana, até 8, depois número. Ao bater a meta, cada um ganha +10 por semana de sequência, até +50.

Folga: um coringa por mês, escolha dos dois, não automática. Mantém a sequência e não paga bônus de sequência.

Marcos: notificação e animação ao atingir 50%, 80% e 100%. Aos 100%, confete de pétalas de sakura e carimbo "Meta cumprida". `marcos_semana` (semana + 50, 80 ou 100) garante um aviso só.

`semanas` e `semana_pessoas`: por semana fechada e por pessoa, estrelinhas que contaram na meta, tarefas feitas, obrigados recebidos, cômodo mais cuidado, se bateu, se foi folga, sequência resultante e bônus concedido. Tela simples do histórico.

Retrospectiva no fechamento: estrelinhas de cada um, tarefas feitas, cômodo mais cuidado, quantos obrigados cada um recebeu, se bateram a meta e a recompensa. Cartão na abertura seguinte. `retrospectivas_vistas` para cada um dispensar o seu.

Fechamento oficial: domingo 21h no fuso da casa, função idempotente. O cron existente roda a cada minuto e a função só age na hora local. Se o agendamento falhar, abrir o app depois da segunda chama a mesma função, sem julgar a semana duas vezes. O `fechar_semanas()` atual é substituído por isso, não duplicado.

## Lojinha

`cupons` ganha ícone (código de um conjunto de cerca de 20 SVGs), limite opcional de resgates na semana, prazo opcional em dias e tipo `cupom` ou `passa_vez`.

Seed, custos ajustáveis:

- Escolher o filme ou série da noite: 30
- Escolher o jantar ou delivery: 40
- Café da manhã na cama: 80
- Massagem de 15 minutos: 60
- Dia sem lavar louça: 50
- Escolher o programa do fim de semana: 100
- Passa a vez (uma tarefa): 40 + metade das estrelinhas da tarefa
- Cofrinho inicial à parte: "Jantar fora" (400)

`resgates`: quem resgatou, quem cumpre, cupom, valor debitado, semana, status (`pendente`, `feito`, `cumprido`, `aceito`, `negociado`), tarefa opcional e prazo.

Fluxo: resgatar (se houver saldo) → confirmação → movimento negativo + aviso ao outro → pendente → quem cumpre marca feito → quem resgatou confirma (carimbo "Cumprido").

Tela "Meus cupons": disponíveis na loja, resgatados por mim, a cumprir por mim.

Passa a vez: transfere uma tarefa específica. O outro aceita ou negocia (devolve as estrelinhas ao disponível). Limite de 1 por semana por pessoa.

`cofrinhos`: um desejo aberto. Cada depósito é movimento `cofrinho`. Barra com a parte de cada um. Ao completar, status `completo` e comemoração.

## Outros estímulos

Estrela da sorte: `estrelas_sorte` (dia, tarefa). Função idempotente na meia-noite local sorteia uma rotina pendente. Concluir grava a base e outro movimento `sorte` do mesmo valor. Destaque com estrela dourada brilhante no Hoje.

Atraso: +10% do valor da rotina por dia, até o dobro. Texto convite: "vale 18 estrelinhas hoje".

Combo: no próprio concluir, uma vez por patamar por pessoa por dia. 3 tarefas no dia = +5; 5 = +15.

Gratidão: botão "Obrigado!" na tarefa que o outro concluiu. Uma vez por conclusão. +2 para quem fez, no máximo 5 por dia para quem recebe. Aviso carinhoso. Movimento `gratidao`.

Desafios: `desafios` (código, texto, bônus, ativo) com pelo menos 10 no seed, e `desafio_semana` sorteado na segunda. Avaliação no banco. Ao cumprir, os dois ganham. Exemplos: zerar as atrasadas, cuidar de todos os cômodos, cada um fazer uma tarefa pesada.

Saúde: o mesmo número de hoje vira galho de cerejeira, de botão a florescendo. Ao concluir uma rotina daquele cômodo, o galho floresce.

Falas: `falas` (texto, ocasião `concluir`, `meta`, `dia_livre`, `retrospectiva`), pelo menos 15 no seed. A frase sai do identificador do evento, para os dois celulares mostrarem a mesma. Exemplos: "Uma mão só e olha essa casa!", "Mais uma estrelinha pro bolso", "Hoje a casa descansa, e vocês também."

Notificações gentis: silêncio por pessoa em `preferencias_notificacao`, padrão 22h–8h. Teto de 3 por dia só para avisos automáticos (resumo, marcos, estrela, desafio, retrospectiva). Conclusão, cupom, gratidão e compra ficam de fora, porque o outro gerou. Durante o silêncio o sino grava; o push espera o horário abrir. O resumo diário existente fica com texto leve.

## Jobs

No `pg_cron` que já existe, uma vez por minuto, agindo só na hora local:

- meia-noite: estrela da sorte; na segunda, também o desafio
- domingo 21h: fechar a semana, pagar o bônus de sequência, gravar a retrospectiva e avisar
- resumo diário atual permanece

## Como testar, quando implementar

Dois navegadores, um com `teste.cursor.xingxing@example.com` e outro com a segunda conta da casa. No iPhone, pelo ícone da Tela de Início (push só no iOS 16.4+). Se o teste mudar dados da casa, voltar ao estado anterior. Não copiar a senha para o repositório nem para o chat.
