-- Username, emoji com tamanho limitado e caixa dos últimos avisos.
-- Rode depois de 20261012143000_notificacoes.sql. Pode rodar de novo.
-- Sem este arquivo, o app não lê o perfil: a coluna username ainda não existe.

alter table public.profiles
  add column if not exists username text;

create or replace function public.normalizar_username(origem text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  base text;
begin
  base := translate(
    lower(coalesce(origem, '')),
    'áàâãäåéèêëíìîïóòôõöúùûüýÿçñ',
    'aaaaaaeeeeiiiioooooouuuuyycn'
  );
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');
  base := left(base, 20);
  if coalesce(length(base), 0) < 3 then
    base := rpad(coalesce(base, ''), 3, 'x');
  end if;
  return base;
end;
$$;

revoke all on function public.normalizar_username(text) from public, anon, authenticated;

do $$
declare
  linha record;
  candidato text;
  n integer;
begin
  for linha in
    select id, nome
    from public.profiles
    where username is null
    order by criado_em
  loop
    candidato := public.normalizar_username(linha.nome);
    n := 0;
    while exists (select 1 from public.profiles where username = candidato) loop
      n := n + 1;
      candidato := left(public.normalizar_username(linha.nome), 20 - length(n::text)) || n::text;
    end loop;
    update public.profiles set username = candidato where id = linha.id;
  end loop;
end $$;

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_idx on public.profiles (username);

do $$
begin
  alter table public.profiles
    add constraint profiles_username_formato check (username ~ '^[a-z0-9_]{3,20}$');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_emoji_tamanho check (char_length(emoji) between 1 and 32);
exception
  when duplicate_object then null;
end $$;

comment on column public.profiles.username is
  'Identificador curto, único. O app chama a pessoa por ele. O nome pode ficar vazio.';

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidato text;
  n integer := 0;
  nome_inicial text;
begin
  nome_inicial := coalesce(nullif(split_part(new.email, '@', 1), ''), 'Alguém');
  base := public.normalizar_username(nome_inicial);
  candidato := base;
  while exists (select 1 from public.profiles where username = candidato) loop
    n := n + 1;
    candidato := left(base, 20 - length(n::text)) || n::text;
  end loop;

  insert into public.profiles (id, nome, username)
  values (new.id, nome_inicial, candidato);

  insert into public.preferencias_notificacao (usuario_id)
  values (new.id);

  return new;
end;
$$;

revoke all on function public.criar_perfil() from public, anon, authenticated;

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null,
  corpo text not null,
  criada_em timestamptz not null default now(),
  lida boolean not null default false
);

comment on table public.notificacoes is
  'Caixa do sino. Uma linha por destinatário, gravada mesmo se o push não sair.';

create index if not exists notificacoes_usuario_idx
  on public.notificacoes (usuario_id, criada_em desc);

alter table public.notificacoes enable row level security;

drop policy if exists notificacoes_le_as_suas on public.notificacoes;
create policy notificacoes_le_as_suas
  on public.notificacoes for select to authenticated
  using (usuario_id = (select auth.uid()));

revoke all on table public.notificacoes from anon, public;
grant select on table public.notificacoes to authenticated;

alter table public.notificacoes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
exception
  when others then
    raise warning 'realtime notificacoes: %', sqlerrm;
end $$;

create or replace function public.marcar_notificacoes_lidas()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notificacoes
  set lida = true
  where usuario_id = (select auth.uid())
    and lida = false;
end;
$$;

revoke all on function public.marcar_notificacoes_lidas() from public, anon;
grant execute on function public.marcar_notificacoes_lidas() to authenticated;

create or replace function public.enfileirar_notificacao(
  p_destinatarios uuid[],
  p_titulo text,
  p_corpo text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_segredo text;
begin
  if p_destinatarios is null or cardinality(p_destinatarios) = 0 then
    return;
  end if;

  insert into public.notificacoes (usuario_id, titulo, corpo)
  select destinatario, left(coalesce(p_titulo, ''), 80), left(coalesce(p_corpo, ''), 240)
  from unnest(p_destinatarios) as destinatario;

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'project_url'
  limit 1;

  select decrypted_secret into v_segredo
  from vault.decrypted_secrets
  where name = 'notificacao_segredo'
  limit 1;

  if coalesce(v_url, '') = '' or coalesce(v_segredo, '') = '' then
    raise warning 'notificacao sem project_url ou notificacao_segredo no vault';
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/enviar-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-xingxing-segredo', v_segredo
    ),
    body := jsonb_build_object(
      'destinatarios', to_jsonb(p_destinatarios),
      'titulo', left(p_titulo, 80),
      'corpo', left(p_corpo, 240),
      'url', left(coalesce(nullif(p_url, ''), '/'), 200)
    )
  );
end;
$$;

create or replace function public.notificar_conclusao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nome text;
  titulo text;
  total integer;
  ids uuid[];
begin
  select case
    when coalesce(profiles.username, '') <> '' then '@' || profiles.username
    else profiles.nome
  end
  into nome
  from public.profiles
  where profiles.id = new.usuario_id;

  select tarefas.titulo into titulo
  from public.tarefas
  where tarefas.id = new.tarefa_id;

  total := new.estrelinhas_base + new.estrelinhas_bonus;

  select coalesce(array_agg(preferencias.usuario_id), array[]::uuid[])
  into ids
  from public.preferencias_notificacao as preferencias
  where preferencias.usuario_id <> new.usuario_id
    and preferencias.avisar_conclusao;

  perform public.enfileirar_notificacao(
    ids,
    'Xingxing',
    coalesce(nome, 'Alguém') || ' concluiu ' || coalesce(titulo, 'uma tarefa')
      || '. +' || total || ' estrelinhas.',
    '/'
  );
  return new;
exception
  when others then
    raise warning 'notificacao conclusao: %', sqlerrm;
    return new;
end;
$$;

create or replace function public.notificar_item_compra()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nome text;
  ids uuid[];
begin
  if new.comprado or new.criado_por is null then
    return new;
  end if;

  select case
    when coalesce(profiles.username, '') <> '' then '@' || profiles.username
    else profiles.nome
  end
  into nome
  from public.profiles
  where profiles.id = new.criado_por;

  select coalesce(array_agg(preferencias.usuario_id), array[]::uuid[])
  into ids
  from public.preferencias_notificacao as preferencias
  where preferencias.usuario_id <> new.criado_por
    and preferencias.avisar_compras;

  perform public.enfileirar_notificacao(
    ids,
    'Lista de compras',
    coalesce(nome, 'Alguém') || ' colocou ' || new.nome || ' na lista.',
    '/'
  );
  return new;
exception
  when others then
    raise warning 'notificacao compra: %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.enfileirar_notificacao(uuid[], text, text, text) from public, anon, authenticated;
revoke all on function public.notificar_conclusao() from public, anon, authenticated;
revoke all on function public.notificar_item_compra() from public, anon, authenticated;

-- A tela de login pede o username. Esta função devolve só o e-mail daquela pessoa, para o Supabase entrar.
-- Anônimo não lê a tabela profiles; a função corre como dona e não lista as outras contas.
create or replace function public.email_por_username(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select users.email
  from public.profiles
  join auth.users as users on users.id = profiles.id
  where profiles.username = lower(regexp_replace(trim(coalesce(p_username, '')), '^@+', ''))
  limit 1;
$$;

revoke all on function public.email_por_username(text) from public;
grant execute on function public.email_por_username(text) to anon, authenticated;
