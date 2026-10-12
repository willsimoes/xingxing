# Xingxing

PWA da casa para duas pessoas. Esta etapa entrega a lista de compras, o fechamento da meta semanal e a saúde dos cômodos. As notificações vêm depois.

## Requisitos

Node.js 20 ou mais recente. Neste computador o Node foi atualizado para a versão 24, porque a 14 não roda o Vite atual.

## Rodar no computador

```bash
npm install
npm run icones
npm run dev
```

Abra o endereço que o Vite mostrar (em geral `http://localhost:5173`).

`npm run icones` lê `public/icons/icon.svg` e gera os PNGs. Se você trocar o desenho, rode de novo.

Sem o arquivo `.env`, o app abre uma tela pedindo a URL e a chave do Supabase. O login só aparece depois do passo a passo abaixo. Sempre que salvar o `.env`, pare o app e rode `npm run dev` de novo.

## Preparar o Supabase

O plano é o Free. Ele não pede cartão. A senha do banco (a do projeto) e a senha de cada pessoa no app são coisas diferentes: guarde as duas.

1. Abra [https://supabase.com/dashboard](https://supabase.com/dashboard) e crie a conta (GitHub ou e-mail). Se pedir organização, crie uma com o seu nome: é só a pasta dos projetos.
2. Clique em **New project**.
3. Nome: `Xingxing`.
4. Em **Database password**, clique em gerar e guarde essa senha num lugar seu. Ela abre o Postgres, não o app.
5. Região: **South America (São Paulo)**, se aparecer. Se o nome vier um pouco diferente, escolha América do Sul.
6. Plano: **Free**. Não escolha Pro.
7. Crie o projeto e espere ele ficar pronto (cerca de um ou dois minutos).

### Desligar o cadastro público

Quem entra no app são só as duas pessoas criadas no painel. O botão de criar usuário no painel continua funcionando com o cadastro público desligado.

1. Abra **Project Settings** (a engrenagem) e depois **Authentication**. O atalho é a página de Authentication nas configurações do projeto.
2. Em **User Signups**, desligue **Allow new users to sign up**.
3. Clique em **Save** e espere a confirmação.
4. Se existir **Allow anonymous sign-ins**, deixe desligado.
5. Não desligue o provedor **Email**. Sem ele, o login com senha para de funcionar. O que fica desligado é só o cadastro de gente nova.

### Aplicar a migration e as tarefas

Rode a migration uma vez só. Se aparecer `already exists`, ela já foi aplicada: não cole de novo.

1. No menu da esquerda, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra no Cursor o arquivo `supabase/migrations/20261011190000_esquema_inicial.sql`, copie o arquivo inteiro e cole no editor.
4. Clique em **Run**. O resultado `Success. No rows returned` está certo.
5. Abra outra query, copie o arquivo inteiro `supabase/seed.sql`, cole e clique em **Run**.

### Aplicar a conclusão das tarefas

Esta query é nova. Rode uma vez, depois da migration e do seed. Se aparecer que a função já existe, pode rodar de novo: ela se substitui.

1. No **SQL Editor**, clique em **New query**.
2. Abra `supabase/migrations/20261012070000_concluir_e_desfazer.sql`, copie o arquivo inteiro, cole e clique em **Run**.
3. O resultado `Success. No rows returned` está certo.
4. Pare o `npm run dev` e rode de novo.

### Fechar a meta e a lista de compras

Esta query é nova. Rode uma vez, depois das anteriores. Se aparecer que a função já existe, pode rodar de novo: ela se substitui.

1. No **SQL Editor**, clique em **New query**.
2. Abra `supabase/migrations/20261012120000_compras_e_fechamento.sql`, copie o arquivo inteiro, cole e clique em **Run**.
3. O resultado `Success. No rows returned` está certo.
4. Recarregue o app. Se ele já estava aberto, feche a aba e abra de novo.

### Criar as duas pessoas

Faça isso depois da migration. O banco cria a linha em `profiles` sozinho quando o usuário nasce. O nome inicial é a parte do e-mail antes do `@`. Dá para trocar em Ajustes, dentro do app.

1. Menu **Authentication** → **Users**.
2. **Add user** → **Create new user**. Não use **Send invitation**: o app ainda não tem página para concluir um convite.
3. E-mail e senha da primeira pessoa. A senha precisa ter pelo menos 6 caracteres. Anote as duas senhas.
4. Ligue **Auto Confirm User**. Sem isso o app recusa a entrada.
5. Confirme a criação e repita para a segunda pessoa.
6. Abra **Table Editor** → `profiles`. Devem existir duas linhas. Se a tabela estiver vazia, a migration rodou depois dos usuários (ou não rodou): apague os usuários em **Authentication** → **Users** e crie os dois de novo.

Não existe “esqueci a senha” no app ainda. Para trocar, abra **Authentication** → **Users**, clique na pessoa e use a opção de alterar a senha.

### Colar a URL e a chave no .env

A chave publishable pode ir no app. A chave secret não.

1. No projeto, clique em **Connect** (ou abra **Project Settings** → **API Keys**).
2. Copie a **Project URL**. Ela parece com `https://alguma-coisa.supabase.co`.
3. Copie a chave **publishable**, que começa com `sb_publishable_`. Se o projeto só mostrar a chave **anon** antiga, copie essa. As duas servem.
4. Não copie nada que comece com `sb_secret_` nem a chave `service_role`. Essas passam por cima da segurança do banco.
5. Na pasta do app, copie `.env.example` para um arquivo chamado `.env`.
6. Preencha:

```bash
VITE_SUPABASE_URL=https://alguma-coisa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

7. Salve. Pare o `npm run dev` e rode de novo.

O `.env` não entra no git.

## O que já dá para ver

- Nome Xingxing, mascote e o texto “Casa em dia, estrelinhas no bolso” na tela de login. Não há botão de criar conta.
- Tema matchá e sakura. Em Ajustes, Aparência: Automático (padrão), Dia ou Noite. A escolha fica no navegador e vale antes da tela pintar.
- No modo Automático, o app acompanha o claro/escuro do sistema na hora.
- Depois de entrar: as abas, o seu nome no topo e, ao lado, as suas estrelinhas desta semana.
- **Hoje**: rotinas que vencem hoje e as atrasadas. Atrasada ganha 2 estrelinhas a mais por dia (dá para mudar depois em `casa.bonus_por_dia`). Ao concluir, a estrela do topo pula, a próxima data é calculada e a tarefa sai da lista do dia.
- O cartão verde soma as estrelinhas dos dois contra a meta (300). Os dois placares ficam lado a lado, sem vencedor. Quando uma semana termina, o app fecha a anterior: se a casa bateu a meta, “Semanas seguidas” sobe; se não bateu, volta a zero. A semana em curso não fecha antes da segunda seguinte.
- **Saúde dos cômodos**: em Hoje, uma barrinha por cômodo. No dia em que a rotina vence ela fica pela metade, sobe quando alguém conclui e desce se atrasar. A mesma barrinha aparece no título de cada cômodo em Tarefas.
- **Tarefas**: por cômodo, com filtro Rotinas / Missões. Dá para criar, editar, arquivar e reativar. Missão pode ter etapas; as estrelinhas entram quando a última etapa fecha.
- O que um faz aparece para o outro sem recarregar a página, se os dois estiverem com o app aberto.
- **Compras**: lista compartilhada. Dá para adicionar, marcar como comprado e limpar os comprados. “Comprar filtro” entra sozinha, vale 15 estrelinhas e, ao ser marcada, libera “Trocar filtros”. Desmarcar devolve as estrelinhas e bloqueia de novo, desde que a tarefa liberada ainda não tenha sido feita.
- A sessão fica neste navegador. Fechar a aba não pede a senha de novo. Sair é que encerra.

## Testar no computador

1. Com o `.env` preenchido e o SQL novo já rodado, rode `npm run dev` e abra o endereço local.
2. Entre com o e-mail e a senha criados no painel.
3. Em **Hoje**, as rotinas do seed aparecem. Se o seed rodou em outro dia, elas entram como atrasadas e mostram o bônus. Conclua “Limpar pia”: ela some de hoje, as estrelinhas sobem no topo e no placar, e a próxima data no banco fica para amanhã.
4. Toque de novo na caixa, em **Feitas hoje**, para desfazer. A tarefa volta e as estrelinhas saem.
5. Em **Tarefas**, abra a missão do móvel, marque as quatro etapas. Na última, ela arquiva e paga 60 estrelinhas. **Desfazer** na lista de arquivadas devolve a missão.
6. Crie uma rotina, mude as estrelinhas, arquive e reative.
7. Em **Compras**, “Comprar filtro” aparece com 15 estrelinhas e a etiqueta “Libera Trocar filtros”. Marque. As estrelinhas sobem e, em Tarefas, “Trocar filtros” deixa de estar bloqueada. Desmarque em Compras: as estrelinhas saem e o filtro volta a ficar bloqueado.
8. Adicione “leite”, marque como comprado e toque em **Limpar comprados**. O item some. Com a outra pessoa numa janela anônima, um item novo aparece do outro lado sem recarregar.
9. Em **Hoje**, as barrinhas dos cômodos começam pela metade, porque as rotinas do seed vencem hoje. Conclua “Limpar pia”: a barrinha da cozinha sobe. Se uma rotina ficar atrasada, a barrinha desce.
10. Com a outra pessoa numa janela anônima, conclua uma tarefa num lado e veja o outro atualizar sozinho.
11. Feche a aba e abra de novo: a sessão continua. Em Ajustes, **Sair** volta para o login.

A meta da semana só fecha depois da meia-noite de domingo, no fuso da casa. Para ver o fechamento agora, no SQL Editor:

```sql
update public.conclusoes
set semana = (select public.segunda_da_semana(now()) - 7)
where semana = (select public.segunda_da_semana(now()));

update public.casa
set ultima_semana_fechada = null, ultima_semana_bateu = null, semanas_seguidas = 0
where id = 1;
```

Recarregue o app. Se a soma daquela semana chegou a 300, “Semanas seguidas” fica em 1 e o cartão diz que a semana passada bateu a meta. Se ficou abaixo, a sequência continua em 0. Essa query mexe nos dados de teste: use só no computador, e não precisa dela no uso normal.

## Testar no iPhone

O ícone na Tela de Início e o modo standalone pedem HTTPS. No `npm run dev` o endereço da rede local é HTTP, então o Safari do iPhone ainda não instala o app de verdade. O login no ícone da Tela de Início fica para o deploy.

Dá para espiar pelo Safari, no mesmo Wi-Fi do computador:

1. Pare o app e rode `npm run dev -- --host`.
2. Use o endereço **Network** que o Vite mostrar (não o `localhost`).
3. A tela de login abre. Entrar funciona, e a sessão fica naquele Safari. Concluir uma tarefa funciona igual ao computador.
4. Adicionar à Tela de Início continua sem valer nesse endereço HTTP.

Quando o deploy existir, no Safari do iPhone:

1. Abra o site.
2. Toque em Compartilhar.
3. Toque em Adicionar à Tela de Início.
4. Abra pelo ícone, entre com o e-mail e a senha, e confira o nome Xingxing e o desenho da macaca.
5. Feche o app e abra de novo pelo ícone: a sessão continua.
6. Em Ajustes do iPhone, alterne o modo escuro: no Automático o app muda entre dia e noite. Depois teste Dia e Noite dentro do app.

No computador, o equivalente de instalação agora é `npm run build` e `npm run preview`, e no Chrome usar “Instalar app” se o menu oferecer.

## Banco

O esquema está em `supabase/migrations/20261011190000_esquema_inicial.sql`. Concluir e desfazer estão em `supabase/migrations/20261012070000_concluir_e_desfazer.sql`. Compras e o fechamento da meta estão em `supabase/migrations/20261012120000_compras_e_fechamento.sql`. As tarefas da casa estão em `supabase/seed.sql`. As tabelas não devem ser redesenhadas. Quem está logado lê e escreve; visitante anônimo não lê nada.
