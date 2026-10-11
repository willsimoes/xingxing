-- Xingxing: esquema inicial.
-- Só usuários autenticados acessam as tabelas. Anônimo não tem política, então não lê nada.
-- O cadastro público se desliga no painel do Auth (não dá para fazer isso só com SQL).

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  emoji text not null default '🌟',
  cor text not null default '#4F6B3A',
  criado_em timestamptz not null default now()
);

create table public.preferencias_notificacao (
  usuario_id uuid primary key references public.profiles (id) on delete cascade,
  avisar_conclusao boolean not null default true,
  avisar_compras boolean not null default true,
  receber_resumo boolean not null default true
);

create table public.casa (
  id integer primary key default 1 check (id = 1),
  meta_semanal integer not null default 300 check (meta_semanal > 0),
  recompensa text not null default '',
  horario_resumo time not null default '08:00',
  fuso text not null default 'America/Sao_Paulo',
  bonus_por_dia integer not null default 2 check (bonus_por_dia >= 0),
  semanas_seguidas integer not null default 0 check (semanas_seguidas >= 0),
  ultima_semana_fechada date
);

insert into public.casa (id) values (1);

create table public.comodos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  emoji text not null,
  ordem integer not null
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  comodo_id uuid references public.comodos (id),
  titulo text not null,
  tipo text not null check (tipo in ('rotina', 'missao', 'compra')),
  estrelinhas integer not null check (estrelinhas >= 0),
  frequencia text not null default 'nenhuma' check (frequencia in (
    'nenhuma',
    'diaria',
    'a_cada_n_dias',
    'n_vezes_por_semana',
    'semanal',
    'quinzenal',
    'mensal',
    'validade'
  )),
  intervalo integer check (intervalo is null or intervalo > 0),
  proxima_data date,
  status text not null default 'ativa' check (status in ('ativa', 'bloqueada', 'arquivada')),
  libera_tarefa_id uuid references public.tarefas (id) on delete set null,
  dobro boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint frequencia_pede_intervalo check (
    (
      frequencia in ('a_cada_n_dias', 'n_vezes_por_semana', 'validade')
      and intervalo is not null
    )
    or frequencia not in ('a_cada_n_dias', 'n_vezes_por_semana', 'validade')
  )
);

comment on column public.tarefas.dobro is 'Reservado para a tarefa do dia valer o dobro. Sem efeito nesta versão.';
comment on column public.tarefas.intervalo is 'Dias (a cada n dias ou validade) ou vezes na semana.';

create trigger tarefas_atualizado_em
  before update on public.tarefas
  for each row execute function public.tocar_atualizado_em();

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas (id) on delete cascade,
  titulo text not null,
  ordem integer not null,
  concluida boolean not null default false,
  concluida_em timestamptz,
  concluida_por uuid references public.profiles (id),
  unique (tarefa_id, ordem)
);

create table public.conclusoes (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  quando timestamptz not null default now(),
  estrelinhas_base integer not null check (estrelinhas_base >= 0),
  estrelinhas_bonus integer not null default 0 check (estrelinhas_bonus >= 0),
  semana date not null
);

comment on column public.conclusoes.semana is 'Segunda-feira da semana, no fuso da casa. Calculada com public.segunda_da_semana.';

create table public.itens_compra (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tarefa_id uuid references public.tarefas (id) on delete set null,
  comprado boolean not null default false,
  comprado_em timestamptz,
  comprado_por uuid references public.profiles (id),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  chave_auth text not null,
  criado_em timestamptz not null default now()
);

create table public.cupons (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  custo integer not null check (custo >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

comment on table public.cupons is 'Lojinha. Tabela pronta, sem tela nesta versão.';

create table public.conquistas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  descricao text not null default ''
);

create table public.conquistas_desbloqueadas (
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  conquista_id uuid not null references public.conquistas (id) on delete cascade,
  quando timestamptz not null default now(),
  primary key (usuario_id, conquista_id)
);

comment on table public.conquistas is 'Conquistas. Tabela pronta, sem tela nesta versão.';

create index tarefas_status_idx on public.tarefas (status);
create index tarefas_proxima_idx on public.tarefas (proxima_data);
create index conclusoes_semana_idx on public.conclusoes (semana);
create index conclusoes_usuario_idx on public.conclusoes (usuario_id);
create index itens_compra_comprado_idx on public.itens_compra (comprado);

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Alguém'));

  insert into public.preferencias_notificacao (usuario_id)
  values (new.id);

  return new;
end;
$$;

revoke all on function public.criar_perfil() from public, anon, authenticated;

create or replace function public.segunda_da_semana(instante timestamptz)
returns date
language sql
stable
set search_path = ''
as $$
  select (instante at time zone casa.fuso)::date
    - (extract(isodow from (instante at time zone casa.fuso))::integer - 1)
  from public.casa
  where casa.id = 1;
$$;

grant execute on function public.segunda_da_semana(timestamptz) to authenticated;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

alter table public.profiles enable row level security;
alter table public.preferencias_notificacao enable row level security;
alter table public.casa enable row level security;
alter table public.comodos enable row level security;
alter table public.tarefas enable row level security;
alter table public.etapas enable row level security;
alter table public.conclusoes enable row level security;
alter table public.itens_compra enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.cupons enable row level security;
alter table public.conquistas enable row level security;
alter table public.conquistas_desbloqueadas enable row level security;

create policy profiles_leem
  on public.profiles for select to authenticated
  using (true);

create policy profiles_atualiza_o_seu
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy preferencias_leem
  on public.preferencias_notificacao for select to authenticated
  using (true);

create policy preferencias_atualiza_a_sua
  on public.preferencias_notificacao for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy casa_le
  on public.casa for select to authenticated
  using (true);

create policy casa_atualiza
  on public.casa for update to authenticated
  using (true)
  with check (true);

create policy conclusoes_leem
  on public.conclusoes for select to authenticated
  using (true);

create policy conclusoes_insere_a_sua
  on public.conclusoes for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy conclusoes_apaga_a_sua
  on public.conclusoes for delete to authenticated
  using (usuario_id = (select auth.uid()));

create policy push_do_usuario
  on public.push_subscriptions for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'comodos',
    'tarefas',
    'etapas',
    'itens_compra',
    'cupons',
    'conquistas',
    'conquistas_desbloqueadas'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tabela || '_le',
      tabela
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      tabela || '_insere',
      tabela
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      tabela || '_atualiza',
      tabela
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      tabela || '_apaga',
      tabela
    );
  end loop;
end $$;

revoke all on table
  public.profiles,
  public.preferencias_notificacao,
  public.casa,
  public.comodos,
  public.tarefas,
  public.etapas,
  public.conclusoes,
  public.itens_compra,
  public.push_subscriptions,
  public.cupons,
  public.conquistas,
  public.conquistas_desbloqueadas
from anon, public;

grant select, update on table public.profiles to authenticated;
grant select, update on table public.preferencias_notificacao to authenticated;
grant select, update on table public.casa to authenticated;
grant select, insert, delete on table public.conclusoes to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table
  public.comodos,
  public.tarefas,
  public.etapas,
  public.itens_compra,
  public.cupons,
  public.conquistas,
  public.conquistas_desbloqueadas
to authenticated;

alter table public.tarefas replica identity full;
alter table public.etapas replica identity full;
alter table public.conclusoes replica identity full;
alter table public.itens_compra replica identity full;
alter table public.casa replica identity full;
alter table public.profiles replica identity full;

alter publication supabase_realtime add table
  public.tarefas,
  public.etapas,
  public.conclusoes,
  public.itens_compra,
  public.casa,
  public.profiles;
