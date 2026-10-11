# Projeto: app da casa (PWA gamificado para duas pessoas)

Você vai construir do zero um PWA de organização da casa e lista de compras, gamificado, usado por exatamente duas pessoas (eu e meu namorado), cada uma no seu iPhone. Leia tudo antes de começar.

## Restrições inegociáveis
- Custo zero: nada de planos pagos, nada que exija cartão de crédito, nada de App Store / Apple Developer Program.
- Só dois usuários, para sempre. Não projete para escala.
- Alvo principal: iPhone, instalado pela opção "Adicionar à Tela de Início" do Safari. Deve funcionar também no navegador do desktop.
- Interface inteira em português do Brasil.

## Antes de escrever código: verifique e me reporte
Meu conhecimento sobre planos gratuitos pode estar desatualizado. Consulte a documentação atual e me diga, em uma lista curta, o que confirmou e o que mudou:
1. Supabase plano gratuito: limites de banco, Realtime, Auth, Edge Functions e pg_cron; regra de pausa do projeto por inatividade (e se um job agendado conta como atividade).
2. Hospedagem gratuita (Vercel plano Hobby; alternativa Cloudflare Pages): limites e se permitem este uso.
3. Web Push em PWA no iOS: requisitos atuais (versão mínima, necessidade de estar instalado na Tela de Início, permissão a partir de gesto do usuário).
4. Qualquer item da stack abaixo que hoje exija cartão ou pagamento.
Se algo deixou de ser gratuito, pare e me proponha uma alternativa gratuita antes de seguir.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- vite-plugin-pwa (manifest + service worker)
- Supabase: Postgres, Auth, Realtime, Edge Functions, pg_cron
- Deploy: Vercel (plano Hobby) conectado ao repositório do GitHub
- Chaves em variáveis de ambiente (.env local e painel da Vercel); nunca commitar segredos. Inclua um .env.example.

## PWA e ícone no iPhone
- manifest com name, short_name, theme_color, background_color, start_url e display: "standalone".
- Ícones 192x192 e 512x512 (incluindo maskable) no manifest.
- Tag <link rel="apple-touch-icon"> com PNG 180x180, pois o iOS nem sempre usa os ícones do manifest.
- Meta tags para iOS: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-mobile-web-app-title, viewport com viewport-fit=cover, e respeito às safe areas (env(safe-area-inset-*)).
- Gere um ícone provisório simples (posso trocar depois) e deixe claro em que pasta substituí-lo.
- Tela de "como instalar": se o app for aberto no Safari do iPhone fora do modo standalone, mostre instruções (Compartilhar → Adicionar à Tela de Início).
- Layout mobile-first, alvos de toque grandes, navegação por abas na parte inferior.

## Login (apenas dois usuários)
- Tela de login com e-mail e senha (Supabase Auth).
- Sem tela de cadastro e sem "criar conta". O cadastro público deve ficar desativado no Supabase.
- Os dois usuários serão criados manualmente por mim no painel do Supabase. Me dê o passo a passo.
- Sessão persistente: não pedir login de novo a cada abertura.
- Tabela profiles (id, nome, avatar/emoji, cor) ligada ao auth.users.
- Row Level Security em todas as tabelas: apenas usuários autenticados leem e escrevem. Nada acessível anonimamente.

## Funcionalidades da primeira versão
1. **Rotinas**: tarefas recorrentes com frequência e pontos. Ao concluir, registra quem fez e quando, e calcula a próxima data.
2. **Missões**: tarefas únicas, opcionalmente com etapas (checklist).
3. **Lista de compras** compartilhada: adicionar, marcar como comprado, limpar comprados. Uma tarefa do tipo "compra" aparece na lista; ao ser comprada, pode liberar outra tarefa (ex.: "comprar filtro" libera "trocar filtros").
4. **Pontos e meta semanal do casal**: soma dos pontos dos dois contra uma meta configurável, com recompensa combinada (texto livre) e contador de semanas seguidas batendo a meta.
5. **Recompensa acumulada**: rotina atrasada vale um bônus crescente de pontos até alguém fazer.
6. **Tempo real**: qualquer mudança feita por um aparece no outro sem recarregar (Supabase Realtime).
7. **Notificações push** (detalhes abaixo).
8. CRUD de tarefas dentro do app (criar, editar, arquivar, mudar pontos e frequência).

Tom da gamificação: cooperativo. Mostre o placar individual de cada um, mas sem "vencedor da semana"; o destaque é a meta conjunta.

Deixe o modelo de dados preparado, mas NÃO implemente agora: lojinha de cupons, conquistas com títulos engraçados, "saúde" dos cômodos, tarefa do dia valendo o dobro.

## Notificações
- Web Push com chaves VAPID; inscrições salvas em uma tabela push_subscriptions.
- Botão "Ativar notificações" nas configurações (a permissão precisa partir de um toque do usuário; no iOS só funciona com o app instalado na Tela de Início).
- Envio por Supabase Edge Function.
- Gatilhos: (a) quando um conclui uma tarefa, o outro é avisado; (b) resumo diário das rotinas do dia e atrasadas, agendado com pg_cron em horário configurável; (c) item adicionado à lista de compras (com opção de desligar).
- Preferências de notificação por usuário.

## Dados iniciais (seed)
Crie um script de seed com as tarefas abaixo. Formato: tarefa — tipo/frequência — pontos.

**Banheiro**
- Limpar banheiro — rotina semanal — 40
- Trocar lixo do banheiro — rotina 2x por semana — 10
- Lavar toalhas de mão — rotina semanal — 15
- Lavar tapetes — rotina quinzenal — 20
- Consertar vazamentos nos rejuntes — missão — 80

**Cozinha**
- Limpar a cozinha — rotina semanal — 40
- Limpar pia — rotina diária — 10
- Trocar lixo da cozinha — rotina a cada 2 dias — 10
- Lavar panos de prato — rotina semanal — 15
- Lavar garrafas d'água — rotina semanal — 10
- Limpar geladeira e recolher lixos que acumulam — rotina quinzenal — 30
- Lavar lixeira — rotina mensal — 25
- Comprar filtro — compra — 15 (libera "Trocar filtros")
- Trocar filtros — rotina conforme validade do filtro — 20
- Procurar limpeza profissional da máquina de lavar — missão — 30

**Sala**
- Limpar a sala — rotina semanal — 30
- Trocar água das plantas e regá-las — rotina 2x por semana — 10
- Lavar capas de almofada — rotina mensal — 20

**Geral**
- Limpar capacho da entrada — rotina quinzenal — 10
- Limpar aspirador de pó — rotina mensal — 20
- Colar rodapés e outras coisas soltando — missão — 50
- Chamar montador para aparafusar cadeiras da sala — missão — 30
- Móvel para cantinho do café + micro-ondas + airfryer — missão em etapas (medir espaço, pesquisar, comprar, montar) — 60

## Telas
- Login
- Hoje: rotinas do dia e atrasadas, progresso da meta semanal, placar dos dois
- Tarefas: por cômodo, com filtro rotinas/missões
- Compras
- Perfil/Configurações: meta semanal, recompensa, notificações, sair

Visual divertido e leve: cores vivas, emojis por cômodo, uma pequena animação ao concluir tarefa e ao bater a meta.

## Como trabalhar
1. Faça a verificação da seção "Antes de escrever código" e me reporte.
2. Me apresente o modelo de dados (tabelas, colunas, políticas RLS) e a estrutura de pastas, e espere meu ok.
3. Implemente em etapas, nesta ordem: base do projeto + PWA + ícone → login → tarefas e pontos → tempo real → lista de compras → meta semanal → notificações → deploy.
4. Entregue migrations SQL versionadas para o Supabase, não instruções soltas de clicar no painel.
5. Ao final de cada etapa, diga como testar no iPhone.
6. Escreva um README com: criação do projeto no Supabase, criação dos dois usuários, variáveis de ambiente, geração das chaves VAPID, deploy na Vercel e instalação no iPhone.
7. Tudo que eu precisar fazer manualmente (criar contas, copiar chaves), liste de forma explícita, passo a passo. Sou iniciante nessas ferramentas.