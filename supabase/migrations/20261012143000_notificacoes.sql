-- Avisos push: conclusão, item novo na lista e resumo diário.
-- Se 20261012180000_username_e_caixa.sql já rodou, não rode este arquivo de novo:
-- ele recria o envio sem a caixa do sino e sem o username.
-- Pode rodar de novo só antes de 20261012180000_username_e_caixa.sql. Se a tarefa do usuário falhar por causa do aviso, a conclusão continua.
-- O envio só sai depois dos segredos no Vault e da função enviar-push. Sem isso, nada quebra: o aviso é ignorado.
-- Antes de rodar, ligue pg_net e pg_cron em Database → Extensions.

create extension if not exists pg_net;
create extension if not exists pg_cron;

alter table public.casa
  add column if not exists ultimo_resumo date;

comment on column public.casa.ultimo_resumo is
  'Dia local em que o resumo diário já foi enfileirado. Evita mandar duas vezes.';

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
  select profiles.nome into nome
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

  select profiles.nome into nome
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

create or replace function public.disparar_resumo_diario()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  casa_linha public.casa%rowtype;
  agora_local timestamp;
  hoje date;
  atrasadas integer;
  do_dia integer;
  amostra text;
  ids uuid[];
  corpo text;
  total integer;
begin
  select * into casa_linha from public.casa where id = 1;
  if not found then
    return;
  end if;

  agora_local := now() at time zone casa_linha.fuso;
  if to_char(agora_local, 'HH24:MI') <> to_char(casa_linha.horario_resumo, 'HH24:MI') then
    return;
  end if;

  hoje := agora_local::date;
  if casa_linha.ultimo_resumo is not null and casa_linha.ultimo_resumo >= hoje then
    return;
  end if;

  select
    count(*) filter (where tarefas.proxima_data < hoje),
    count(*) filter (where tarefas.proxima_data = hoje)
  into atrasadas, do_dia
  from public.tarefas
  where tarefas.tipo = 'rotina'
    and tarefas.status = 'ativa'
    and tarefas.proxima_data is not null
    and tarefas.proxima_data <= hoje;

  total := coalesce(atrasadas, 0) + coalesce(do_dia, 0);

  update public.casa set ultimo_resumo = hoje where id = 1;

  if total = 0 then
    return;
  end if;

  select string_agg(lista.titulo, ', ' order by lista.proxima_data, lista.titulo)
  into amostra
  from (
    select tarefas.titulo, tarefas.proxima_data
    from public.tarefas
    where tarefas.tipo = 'rotina'
      and tarefas.status = 'ativa'
      and tarefas.proxima_data is not null
      and tarefas.proxima_data <= hoje
    order by tarefas.proxima_data, tarefas.titulo
    limit 4
  ) as lista;

  corpo := do_dia || ' para hoje';
  if atrasadas > 0 then
    corpo := corpo || ', ' || atrasadas || case when atrasadas = 1 then ' atrasada' else ' atrasadas' end;
  end if;
  corpo := corpo || ': ' || coalesce(amostra, '');
  if total > 4 then
    corpo := corpo || '…';
  end if;

  select coalesce(array_agg(preferencias.usuario_id), array[]::uuid[])
  into ids
  from public.preferencias_notificacao as preferencias
  where preferencias.receber_resumo;

  perform public.enfileirar_notificacao(ids, 'Rotinas de hoje', corpo, '/');
exception
  when others then
    raise warning 'resumo diario: %', sqlerrm;
end;
$$;

revoke all on function public.enfileirar_notificacao(uuid[], text, text, text) from public, anon, authenticated;
revoke all on function public.notificar_conclusao() from public, anon, authenticated;
revoke all on function public.notificar_item_compra() from public, anon, authenticated;
revoke all on function public.disparar_resumo_diario() from public, anon, authenticated;

drop trigger if exists notificar_depois_de_concluir on public.conclusoes;
create trigger notificar_depois_de_concluir
  after insert on public.conclusoes
  for each row execute function public.notificar_conclusao();

drop trigger if exists notificar_depois_de_item on public.itens_compra;
create trigger notificar_depois_de_item
  after insert on public.itens_compra
  for each row execute function public.notificar_item_compra();

do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'xingxing-resumo';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
  perform cron.schedule(
    'xingxing-resumo',
    '* * * * *',
    'select public.disparar_resumo_diario()'
  );
exception
  when others then
    raise warning 'pg_cron: %. Ligue a extensão pg_cron e rode este arquivo de novo.', sqlerrm;
end $$;
