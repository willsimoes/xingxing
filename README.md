# Xingxing

PWA da casa para duas pessoas. Esta etapa entrega o app instalável, a identidade visual e o login. Tarefas, tempo real, compras, meta e notificações vêm depois.

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
- Depois de entrar: as abas de antes, o seu nome no topo (vindo de `profiles`) e, em Ajustes, o nome da outra pessoa, a troca do seu nome e o botão Sair.
- A sessão fica neste navegador. Fechar a aba não pede a senha de novo. Sair é que encerra.

## Testar no computador

1. Com o `.env` preenchido, rode `npm run dev` e abra o endereço local.
2. Entre com o e-mail e a senha criados no painel. A tela seguinte é a casa, com o seu nome embaixo de Xingxing.
3. Feche a aba, abra de novo o mesmo endereço: deve continuar dentro, sem pedir senha.
4. Em Ajustes, confira os dois nomes, troque o seu e clique em **Salvar nome**. No **Table Editor**, a coluna `nome` muda.
5. Clique em **Sair**. A tela de login volta. Uma senha errada mostra “E-mail ou senha não conferem.”
6. Para testar a outra pessoa no mesmo computador, use uma janela anônima.

## Testar no iPhone

O ícone na Tela de Início e o modo standalone pedem HTTPS. No `npm run dev` o endereço da rede local é HTTP, então o Safari do iPhone ainda não instala o app de verdade. O login no ícone da Tela de Início fica para o deploy.

Dá para espiar pelo Safari, no mesmo Wi-Fi do computador:

1. Pare o app e rode `npm run dev -- --host`.
2. Use o endereço **Network** que o Vite mostrar (não o `localhost`).
3. A tela de login abre. Entrar funciona, e a sessão fica naquele Safari.
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

O esquema está em `supabase/migrations/20261011190000_esquema_inicial.sql`. As tarefas da casa estão em `supabase/seed.sql`. As tabelas não devem ser redesenhadas. Quem está logado lê e escreve; visitante anônimo não lê nada. O app, nesta etapa, usa `profiles` (nome, emoji e cor) com essas regras.
