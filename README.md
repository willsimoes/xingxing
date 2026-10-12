# Xingxing

PWA da casa para duas pessoas. Esta etapa entrega as notificações, o commit e o deploy.

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

Faça isso depois da migration. O banco cria a linha em `profiles` sozinho quando o usuário nasce. O nome e o username iniciais saem da parte do e-mail antes do `@`. Dá para trocar o nome, o username e o emoji em Ajustes. O nome pode ficar em branco: aí o app chama a pessoa só pelo username.

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

- Nome Xingxing, mascote e o texto “Casa em dia, estrelinhas no bolso” na tela de login. A entrada pede username e senha. Não há botão de criar conta.
- Tema matchá e sakura. Em Ajustes, Aparência: Automático (padrão), Dia ou Noite. A escolha fica no navegador e vale antes da tela pintar.
- No modo Automático, o app acompanha o claro/escuro do sistema na hora.
- Depois de entrar: as abas Hoje, Tarefas, Compras e Ajustes. O botão redondo no canto superior esquerdo abre o guia. No topo ficam o @username e as estrelinhas desta semana. O sino, no canto superior direito, mostra os últimos avisos.
- **Hoje**: rotinas que vencem hoje e as atrasadas. Atrasada ganha 2 estrelinhas a mais por dia (dá para mudar depois em `casa.bonus_por_dia`). Ao concluir, a estrela do topo pula, a próxima data é calculada e a tarefa sai da lista do dia.
- O cartão verde soma as estrelinhas dos dois contra a meta (300). Os dois placares ficam lado a lado, sem vencedor. Quando uma semana termina, o app fecha a anterior: se a casa bateu a meta, “Semanas seguidas” sobe; se não bateu, volta a zero. A semana em curso não fecha antes da segunda seguinte.
- **Saúde dos cômodos**: em Hoje, uma barrinha por cômodo. No dia em que a rotina vence ela fica pela metade, sobe quando alguém conclui e desce se atrasar. A mesma barrinha aparece no título de cada cômodo em Tarefas.
- **Tarefas**: por cômodo, com filtro Rotinas / Missões. Dá para criar, editar, arquivar e reativar. Missão pode ter etapas; as estrelinhas entram quando a última etapa fecha.
- O que um faz aparece para o outro sem recarregar a página, se os dois estiverem com o app aberto.
- **Compras**: lista compartilhada. Dá para adicionar, marcar como comprado e limpar os comprados. “Comprar filtro” entra sozinha, vale 15 estrelinhas e, ao ser marcada, libera “Trocar filtros”. Desmarcar devolve as estrelinhas e bloqueia de novo, desde que a tarefa liberada ainda não tenha sido feita.
- A sessão fica neste navegador. Fechar a aba não pede a senha de novo. Sair é que encerra.
- **Notificações**, em Ajustes: ligar neste aparelho, escolher o que avisar e o horário do resumo. O sino no topo lista os 20 avisos mais recentes mesmo sem push. O aviso no celular só sai depois do passo a passo de notificações abaixo. No iPhone, só com o app aberto pelo ícone da Tela de Início.

## Testar no computador

1. Com o `.env` preenchido e o SQL novo já rodado, rode `npm run dev` e abra o endereço local.
2. Entre com o username e a senha. O username inicial sai da parte do e-mail antes do `@`, em minúsculas e sem ponto. Dá para trocar em Ajustes.
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
4. Abra pelo ícone, entre com o username e a senha, e confira o nome Xingxing e o desenho da macaca.
5. Feche o app e abra de novo pelo ícone: a sessão continua.
6. Em Ajustes do iPhone, alterne o modo escuro: no Automático o app muda entre dia e noite. Depois teste Dia e Noite dentro do app.

No computador, o equivalente de instalação agora é `npm run build` e `npm run preview`, e no Chrome usar “Instalar app” se o menu oferecer.

## Notificações

O app guarda a inscrição do aparelho e as preferências. Quem envia o aviso é uma função do Supabase. Sem os passos abaixo, o botão em Ajustes funciona, mas nenhum aviso sai.

No iPhone o aviso pede iOS 16.4 ou mais novo, o Xingxing na Tela de Início e um toque seu em **Ativar notificações**. No Safari, dentro de uma aba, o iPhone não oferece isso.

As chaves deste computador já foram geradas. A pública está em `src/lib/vapid.ts`. A privada e o segredo do envio estão em `.cursor/segredos-locais.json`, que não entra no git. Abra esse arquivo no Cursor quando o passo pedir um valor. Não cole a chave privada em lugar nenhum do repositório.

Se um dia precisar de chaves novas, rode `npm run vapid`, troque a pública em `src/lib/vapid.ts`, atualize os segredos no Supabase e peça para os dois tocarem em **Ativar notificações** de novo.

### 1. Ligar pg_cron e pg_net

1. No painel do Supabase, abra **Database** e depois **Extensions**.
2. Procure `pg_net`. Se estiver desligada, ligue.
3. Procure `pg_cron`. Ligue também.
4. Espere as duas ficarem verdes.

### 2. Rodar o SQL das notificações

1. Abra **SQL Editor** → **New query**.
2. Copie o arquivo inteiro `supabase/migrations/20261012143000_notificacoes.sql`, cole e clique em **Run**.
3. `Success. No rows returned` está certo. Um aviso amarelo sobre extensão significa que o passo 1 não ficou ligado: ligue e rode o arquivo de novo.
4. Recarregue o app.

### Username, emoji e caixa de avisos

Rode este arquivo depois do SQL de notificações. Sem ele o app não entra: falta a coluna `username`. Pode rodar de novo.

1. No **SQL Editor**, clique em **New query**.
2. Copie o arquivo inteiro `supabase/migrations/20261012180000_username_e_caixa.sql`, cole e clique em **Run**.
3. `Success. No rows returned` está certo. Um aviso amarelo sobre realtime não impede o sino: recarregue o app e abra o sino mesmo assim.
4. Recarregue o app.

Não rode de novo o arquivo `20261012143000_notificacoes.sql` depois deste. Aquele arquivo recria o envio sem a caixa do sino.

### Login pelo username

Rode este arquivo depois do anterior. Sem ele a tela pede o username, mas o banco não acha a conta. Pode rodar de novo.

1. No **SQL Editor**, clique em **New query**.
2. Copie o arquivo inteiro `supabase/migrations/20261012190000_login_username.sql`, cole e clique em **Run**.
3. `Success. No rows returned` está certo. Recarregue o app e entre com o username e a senha.

### 3. Guardar o segredo no Vault

Ainda no **SQL Editor**, nova query. Troque `COLE_O_SEGREDO` pelo valor `notificacaoSegredo` do arquivo `.cursor/segredos-locais.json`. A URL já é a do projeto.

```sql
select vault.create_secret('https://nbvvsymwkvofsybolfdi.supabase.co', 'project_url');
select vault.create_secret('COLE_O_SEGREDO', 'notificacao_segredo');
```

Se disser que o segredo já existe, não crie de novo. Para trocar o valor:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'notificacao_segredo'),
  'COLE_O_SEGREDO'
);
```

### 4. Publicar a função que envia

Isto pede o Supabase CLI, uma vez. No PowerShell, na pasta do app:

```powershell
npx supabase login
npx supabase link --project-ref nbvvsymwkvofsybolfdi
npx supabase secrets set VAPID_PUBLIC_KEY="cole a vapidPublica" VAPID_PRIVATE_KEY="cole a vapidPrivada" VAPID_SUBJECT="mailto:teste.cursor.xingxing@example.com" NOTIFICACAO_SEGREDO="cole o notificacaoSegredo"
npx supabase functions deploy enviar-push --no-verify-jwt
```

`login` abre o navegador. Os quatro valores saem de `.cursor/segredos-locais.json`. A função não aceita a chave pública do app: só o banco, com esse segredo, consegue pedir o envio.

### 5. O que cada aviso faz

- Um conclui uma tarefa: o outro recebe, se **Quando o outro conclui** estiver ligado.
- Alguém adiciona um item na lista (leite, não a compra da casa já marcada): o outro recebe, se **Lista de compras** estiver ligado.
- Todo dia, no horário de Ajustes e no fuso da casa: quem deixou **Resumo do dia** ligado recebe as rotinas de hoje e as atrasadas. Se não houver nenhuma, não chega aviso. O relógio olha o minuto uma vez por minuto; mudar o horário vale no próximo dia nesse minuto.
- **Desligar neste aparelho** remove só esta inscrição. O outro celular não muda.

## Deploy na Vercel

O repositório já está ligado à Vercel, no plano Hobby. O push da `main` publica sozinho. O endereço de produção é:

https://xingxing-xingxing12.vercel.app

Hoje esse endereço pede login da Vercel antes de abrir o app. No iPhone isso impede instalar e receber aviso. Desligue a trava:

1. Abra [o projeto na Vercel](https://vercel.com/xingxing12/xingxing).
2. Vá em **Settings** → **Deployment Protection**.
3. Em **Vercel Authentication**, desligue para Production. Se a opção tiver outro nome, o efeito é o mesmo: visitante sem conta Vercel precisa conseguir abrir o site.
4. Salve.
5. Abra de novo https://xingxing-xingxing12.vercel.app. Tem de aparecer o Xingxing, sem tela de login da Vercel.

Se a tela pedir a URL do Supabase, as variáveis não entraram no build. Em **Settings** → **Environment Variables**, crie as duas para Production e faça **Redeploy**:

```bash
VITE_SUPABASE_URL=https://nbvvsymwkvofsybolfdi.supabase.co
VITE_SUPABASE_ANON_KEY=a chave publishable do .env
```

A chave é a que começa com `sb_publishable_`. Não cole a secret nem a service_role.

No Supabase, abra **Authentication** → **URL Configuration**. Em **Site URL**, cole `https://xingxing-xingxing12.vercel.app`. Em **Redirect URLs**, cole o mesmo endereço. Salve.

No iPhone, com a trava desligada:

1. Abra o site no Safari.
2. Compartilhar → Adicionar à Tela de Início.
3. Abra pelo ícone, entre, e em Ajustes toque em **Ativar notificações**.
4. Aceite o pedido do sistema.

## Banco

O esquema está em `supabase/migrations/20261011190000_esquema_inicial.sql`. Concluir e desfazer estão em `supabase/migrations/20261012070000_concluir_e_desfazer.sql`. Compras e o fechamento da meta estão em `supabase/migrations/20261012120000_compras_e_fechamento.sql`. As notificações estão em `supabase/migrations/20261012143000_notificacoes.sql` e em `supabase/functions/enviar-push/index.ts`. Username, emoji e a caixa do sino estão em `supabase/migrations/20261012180000_username_e_caixa.sql`. O login pelo username está em `supabase/migrations/20261012190000_login_username.sql`. As tarefas da casa estão em `supabase/seed.sql`. As tabelas não devem ser redesenhadas. Quem está logado lê e escreve; visitante anônimo não lê nada.
