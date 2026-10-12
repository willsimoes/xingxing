-- Lojinha e dois saldos de estrelinhas.
-- Ganhas alimentam o placar e não caem quando se gasta. O disponível cai no cupom e no cofrinho.
-- Desfazer a própria conclusão grava uma correção, para concluir e desfazer não gerar estrelinhas infinitas.
-- Pode rodar de novo: create or replace, add column if not exists e insert onde ainda não existe.
-- Cálculo no banco, para os dois celulares verem o mesmo número.

create table if not exists public.motivos (
  codigo text primary key,
  conta_nas_ganhas boolean not null,
  conta_na_meta boolean not null,
  conta_no_disponivel boolean not null,
  permite_negativo boolean not null default false
);

comment on table public.motivos is
  'Tipos de movimento. Um tipo novo entra aqui, sem reescrever a soma. Conquista fica para depois.';

insert into public.motivos (codigo, conta_nas_ganhas, conta_na_meta, conta_no_disponivel, permite_negativo)
values
  ('tarefa', true, true, true, false),
  ('bonus', true, true, true, false),
  ('sorte', true, true, true, false),
  ('gratidao', true, true, true, false),
  ('combo', true, true, true, false),
  ('desafio', true, true, true, false),
  ('sequencia', true, false, true, false),
  ('cupom', false, false, true, true),
  ('cofrinho', false, false, true, true),
  ('correcao', true, true, true, true)
on conflict (codigo) do nothing;

create table if not exists public.parametros (
  chave text primary key,
  valor integer not null,
  rotulo text not null
);

insert into public.parametros (chave, valor, rotulo)
values ('passa_vez_limite', 1, 'Passa a vez por semana, por pessoa')
on conflict (chave) do nothing;

create table if not exists public.movimentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  quantidade integer not null check (quantidade <> 0 and quantidade between -99999 and 99999),
  motivo text not null references public.motivos (codigo),
  descricao text not null default '' check (char_length(descricao) <= 200),
  referencia_id uuid,
  semana date not null,
  criado_em timestamptz not null default now()
);

comment on table public.movimentos is
  'Histórico de estrelinhas. Os saldos são a soma desta tabela.';

create index if not exists movimentos_usuario_idx
  on public.movimentos (usuario_id, criado_em desc);

create index if not exists movimentos_referencia_idx
  on public.movimentos (referencia_id);

alter table public.cupons
  add column if not exists icone text not null default 'presente',
  add column if not exists limite_semana integer,
  add column if not exists prazo_dias integer,
  add column if not exists tipo text not null default 'cupom',
  add column if not exists ordem integer not null default 0;

alter table public.cupons drop constraint if exists cupons_tipo_check;
alter table public.cupons
  add constraint cupons_tipo_check check (tipo in ('cupom', 'passa_vez'));

alter table public.cupons drop constraint if exists cupons_limite_check;
alter table public.cupons
  add constraint cupons_limite_check check (limite_semana is null or limite_semana > 0);

alter table public.cupons drop constraint if exists cupons_prazo_check;
alter table public.cupons
  add constraint cupons_prazo_check check (prazo_dias is null or (prazo_dias > 0 and prazo_dias <= 90));

create unique index if not exists cupons_um_passa_vez
  on public.cupons (tipo)
  where tipo = 'passa_vez';

create table if not exists public.resgates (
  id uuid primary key default gen_random_uuid(),
  cupom_id uuid not null references public.cupons (id),
  quem_resgatou uuid not null references public.profiles (id) on delete cascade,
  quem_cumpre uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pendente', 'feito', 'cumprido', 'aceito', 'negociado')),
  tarefa_id uuid references public.tarefas (id) on delete set null,
  prazo timestamptz,
  estrelinhas integer not null check (estrelinhas >= 0),
  semana date not null,
  criado_em timestamptz not null default now(),
  feito_em timestamptz,
  confirmado_em timestamptz,
  check (quem_resgatou <> quem_cumpre)
);

create index if not exists resgates_resgatou_idx on public.resgates (quem_resgatou, criado_em desc);
create index if not exists resgates_cumpre_idx on public.resgates (quem_cumpre, status);

create table if not exists public.cofrinhos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 80),
  descricao text not null default '' check (char_length(descricao) <= 240),
  icone text not null default 'pote',
  custo integer not null check (custo > 0 and custo <= 9999),
  status text not null default 'aberto' check (status in ('aberto', 'completo')),
  criado_em timestamptz not null default now(),
  completo_em timestamptz,
  atualizado_em timestamptz not null default now()
);

drop trigger if exists cofrinhos_atualizado_em on public.cofrinhos;
create trigger cofrinhos_atualizado_em
  before update on public.cofrinhos
  for each row execute function public.tocar_atualizado_em();

create unique index if not exists cofrinhos_um_aberto
  on public.cofrinhos (status)
  where status = 'aberto';

insert into public.cupons (titulo, descricao, custo, icone, tipo, ordem)
select v.titulo, v.descricao, v.custo, v.icone, v.tipo, v.ordem
from (
  values
    ('Escolher o filme ou série da noite', 'Quem resgata escolhe o que assistir.', 30, 'filme', 'cupom', 1),
    ('Escolher o jantar ou delivery', 'A noite, o prato é de quem resgatou.', 40, 'prato', 'cupom', 2),
    ('Café da manhã na cama', 'Bandeja, carinho e sem pressa.', 80, 'xicara', 'cupom', 3),
    ('Massagem de 15 minutos', 'Quinze minutos só para a outra pessoa.', 60, 'maos', 'cupom', 4),
    ('Dia sem lavar louça', 'A pia fica com quem cumpre o cupom.', 50, 'esponja', 'cupom', 5),
    ('Escolher o programa do fim de semana', 'O passeio ou o descanso sai da escolha de quem resgatou.', 100, 'sol', 'cupom', 6)
) as v (titulo, descricao, custo, icone, tipo, ordem)
where not exists (
  select 1 from public.cupons cupom where cupom.titulo = v.titulo
);

insert into public.cupons (titulo, descricao, custo, icone, tipo, ordem)
select
  'Passa a vez',
  'Uma tarefa específica vai para o outro. Dá para aceitar ou devolver.',
  40,
  'troca',
  'passa_vez',
  7
where not exists (select 1 from public.cupons cupom where cupom.tipo = 'passa_vez');

insert into public.cofrinhos (titulo, descricao, icone, custo)
select 'Jantar fora', 'Um desejo maior, depositado pelos dois.', 'pote', 400
where not exists (select 1 from public.cofrinhos);

drop function if exists public.registrar_movimento(uuid, integer, text, text, uuid);

create or replace function public.registrar_movimento(
  p_usuario uuid,
  p_quantidade integer,
  p_motivo text,
  p_descricao text,
  p_referencia uuid,
  p_semana date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  motivo_linha public.motivos%rowtype;
  nova_id uuid;
  semana date;
begin
  if p_quantidade = 0 then
    raise exception using message = 'O movimento precisa de estrelinhas.';
  end if;

  select * into motivo_linha from public.motivos where codigo = p_motivo;
  if not found then
    raise exception using message = 'Esse tipo de estrelinha ainda não existe.';
  end if;

  if p_quantidade < 0 and not motivo_linha.permite_negativo then
    raise exception using message = 'Esse tipo de estrelinha só entra, não sai.';
  end if;

  semana := coalesce(p_semana, public.segunda_da_semana(now()));

  insert into public.movimentos (usuario_id, quantidade, motivo, descricao, referencia_id, semana)
  values (
    p_usuario,
    p_quantidade,
    p_motivo,
    left(coalesce(p_descricao, ''), 200),
    p_referencia,
    semana
  )
  returning id into nova_id;

  return nova_id;
end;
$$;

create or replace function public.saldo_disponivel(p_usuario uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(movimento.quantidade), 0)::integer
  from public.movimentos movimento
  join public.motivos motivo on motivo.codigo = movimento.motivo
  where movimento.usuario_id = p_usuario
    and motivo.conta_no_disponivel;
$$;

create or replace function public.meus_saldos()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  ganhas integer;
  disponivel integer;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select
    coalesce(sum(movimento.quantidade) filter (where motivo.conta_nas_ganhas), 0)::integer,
    coalesce(sum(movimento.quantidade) filter (where motivo.conta_no_disponivel), 0)::integer
  into ganhas, disponivel
  from public.movimentos movimento
  join public.motivos motivo on motivo.codigo = movimento.motivo
  where movimento.usuario_id = eu;

  return jsonb_build_object('ganhas', ganhas, 'disponivel', disponivel);
end;
$$;

create or replace function public.nome_curto(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    case
      when coalesce(profiles.username, '') <> '' then '@' || profiles.username
      else nullif(profiles.nome, '')
    end,
    'Alguém'
  )
  from public.profiles
  where profiles.id = p_id;
$$;

create or replace function public.avisar_loja(p_destino uuid, p_titulo text, p_corpo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_destino is null then
    return;
  end if;
  perform public.enfileirar_notificacao(array[p_destino], p_titulo, p_corpo, '/');
exception
  when others then
    raise warning 'notificacao loja: %', sqlerrm;
end;
$$;

create or replace function public.pessoa_que_cumpre(p_quem uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  quantos integer;
  outro uuid;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  if p_quem is not null then
    if p_quem = eu then
      raise exception using message = 'O cupom é cumprido pela outra pessoa.';
    end if;
    if not exists (select 1 from public.profiles where id = p_quem) then
      raise exception using message = 'Não achei essa pessoa.';
    end if;
    return p_quem;
  end if;

  select count(*)::integer into quantos from public.profiles where id <> eu;
  if quantos = 0 then
    raise exception using message = 'Falta a outra pessoa na casa para cumprir o cupom.';
  end if;
  if quantos > 1 then
    raise exception using message = 'Escolha quem vai cumprir o cupom.';
  end if;

  select profiles.id into outro from public.profiles where profiles.id <> eu limit 1;
  return outro;
end;
$$;

create or replace function public.aportes_cofrinho()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  alvo uuid;
begin
  if (select auth.uid()) is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select cofrinho.id into alvo
  from public.cofrinhos cofrinho
  where cofrinho.status = 'aberto'
  order by cofrinho.criado_em desc
  limit 1;

  if alvo is null then
    select cofrinho.id into alvo
    from public.cofrinhos cofrinho
    order by cofrinho.criado_em desc
    limit 1;
  end if;

  if alvo is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'usuario_id', pessoa.id,
          'total', coalesce(soma.total, 0),
          'ordem', pessoa.ordem
        )
        order by pessoa.ordem
      )
      from (
        select
          profiles.id,
          row_number() over (order by profiles.criado_em, profiles.id) as ordem
        from public.profiles
      ) as pessoa
      left join (
        select
          movimento.usuario_id,
          (-sum(movimento.quantidade))::integer as total
        from public.movimentos movimento
        where movimento.motivo = 'cofrinho'
          and movimento.referencia_id = alvo
        group by movimento.usuario_id
      ) as soma on soma.usuario_id = pessoa.id
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.icone_de_cupom(p_icone text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_icone in (
    'filme', 'prato', 'xicara', 'maos', 'esponja', 'sol', 'troca', 'pote', 'presente',
    'flor', 'livro', 'musica', 'jogo', 'bolo', 'casa', 'lua', 'passo', 'gota', 'carta', 'estrela'
  );
$$;

create or replace function public.concluir_tarefa(p_tarefa_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  passa public.resgates%rowtype;
  eu uuid := (select auth.uid());
  hoje date;
  atraso integer;
  bonus integer;
  vezes integer;
  proxima date;
  nova_id uuid;
  nova_semana date;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para concluir.';
  end if;

  perform 1 from public.profiles where id = eu for update;

  select * into casa_linha from public.casa where id = 1;
  if not found then
    raise exception using message = 'A casa ainda não foi configurada.';
  end if;

  hoje := (now() at time zone casa_linha.fuso)::date;

  select * into linha from public.tarefas where id = p_tarefa_id for update;
  if not found then
    raise exception using message = 'Não achei essa tarefa.';
  end if;

  select * into passa
  from public.resgates
  where tarefa_id = linha.id
    and status in ('pendente', 'aceito')
  order by criado_em desc
  limit 1
  for update;

  if found and (passa.status = 'pendente' or passa.quem_cumpre <> eu) then
    raise exception using message = 'Essa tarefa está num cupom Passa a vez. Dá para aceitar ou devolver na loja.';
  end if;

  if linha.status <> 'ativa' then
    raise exception using message = 'Essa tarefa não está disponível.';
  end if;

  if linha.tipo = 'compra' then
    raise exception using message = 'Essa tarefa fica na lista de compras.';
  end if;

  if linha.tipo = 'missao' and exists (
    select 1 from public.etapas etapa
    where etapa.tarefa_id = linha.id and etapa.concluida = false
  ) then
    raise exception using message = 'Falta concluir as etapas.';
  end if;

  if linha.tipo = 'rotina' and (linha.proxima_data is null or linha.proxima_data > hoje) then
    raise exception using message = 'Essa rotina não está pendente agora.';
  end if;

  atraso := 0;
  if linha.tipo = 'rotina' and linha.proxima_data is not null and linha.proxima_data < hoje then
    atraso := hoje - linha.proxima_data;
  end if;
  bonus := atraso * casa_linha.bonus_por_dia;
  nova_semana := public.segunda_da_semana(now());

  insert into public.conclusoes (
    tarefa_id, usuario_id, estrelinhas_base, estrelinhas_bonus, semana
  ) values (
    linha.id, eu, linha.estrelinhas, bonus, nova_semana
  )
  returning id into nova_id;

  if linha.estrelinhas > 0 then
    perform public.registrar_movimento(eu, linha.estrelinhas, 'tarefa', linha.titulo, nova_id);
  end if;
  if bonus > 0 then
    perform public.registrar_movimento(eu, bonus, 'bonus', 'Bônus · ' || linha.titulo, nova_id);
  end if;

  if passa.id is not null and passa.status = 'aceito' and passa.quem_cumpre = eu then
    update public.resgates
    set status = 'cumprido', confirmado_em = now()
    where id = passa.id;
    perform public.avisar_loja(
      passa.quem_resgatou,
      'Passa a vez',
      public.nome_curto(eu) || ' fez ' || linha.titulo || '.'
    );
  end if;

  if linha.tipo = 'missao' then
    update public.tarefas
    set status = 'arquivada', proxima_data = null
    where id = linha.id;
    return nova_id;
  end if;

  select count(*)::integer into vezes
  from public.conclusoes conclusao
  where conclusao.tarefa_id = linha.id
    and conclusao.semana = nova_semana;

  proxima := case linha.frequencia
    when 'diaria' then hoje + 1
    when 'semanal' then hoje + 7
    when 'quinzenal' then hoje + 14
    when 'mensal' then (hoje + interval '1 month')::date
    when 'a_cada_n_dias' then hoje + linha.intervalo
    when 'validade' then hoje + linha.intervalo
    when 'n_vezes_por_semana' then
      case
        when linha.intervalo is null or vezes >= linha.intervalo
          then hoje + (8 - extract(isodow from hoje)::integer)
        else hoje + 1
      end
    else hoje + 1
  end;

  update public.tarefas
  set proxima_data = proxima
  where id = linha.id;

  return nova_id;
end;
$$;

create or replace function public.desfazer_conclusao(p_conclusao_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo public.conclusoes%rowtype;
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  eu uuid := (select auth.uid());
  hoje date;
  atraso integer;
  soma integer;
  disponivel integer;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para desfazer.';
  end if;

  perform 1 from public.profiles where id = eu for update;

  select * into alvo
  from public.conclusoes
  where id = p_conclusao_id
    and usuario_id = eu;

  if not found then
    raise exception using message = 'Não achei essa conclusão.';
  end if;

  if exists (
    select 1
    from public.conclusoes conclusao
    where conclusao.tarefa_id = alvo.tarefa_id
      and (conclusao.quando, conclusao.id) > (alvo.quando, alvo.id)
  ) then
    raise exception using message = 'Só dá para desfazer a conclusão mais recente.';
  end if;

  select coalesce(sum(movimento.quantidade), 0)::integer into soma
  from public.movimentos movimento
  where movimento.referencia_id = alvo.id
    and movimento.motivo in ('tarefa', 'bonus');

  disponivel := public.saldo_disponivel(eu);
  if soma > 0 and disponivel - soma < 0 then
    raise exception using message = 'Essas estrelinhas já estão na lojinha.';
  end if;

  select * into casa_linha from public.casa where id = 1;
  if not found then
    raise exception using message = 'A casa ainda não foi configurada.';
  end if;

  hoje := (now() at time zone casa_linha.fuso)::date;
  atraso := 0;
  if casa_linha.bonus_por_dia > 0 then
    atraso := alvo.estrelinhas_bonus / casa_linha.bonus_por_dia;
  end if;

  select * into linha from public.tarefas where id = alvo.tarefa_id for update;
  if found and linha.tipo = 'missao' then
    update public.tarefas
    set status = 'ativa', proxima_data = null
    where id = linha.id;
  elsif found and linha.tipo = 'rotina' then
    update public.tarefas
    set proxima_data = hoje - atraso
    where id = linha.id;
  elsif found and linha.tipo = 'compra' then
    if linha.libera_tarefa_id is not null then
      perform 1 from public.tarefas where id = linha.libera_tarefa_id for update;
      if exists (
        select 1
        from public.conclusoes conclusao
        where conclusao.tarefa_id = linha.libera_tarefa_id
      ) then
        raise exception using message = 'A tarefa liberada já foi feita.';
      end if;

      update public.tarefas
      set status = 'bloqueada', proxima_data = null
      where id = linha.libera_tarefa_id
        and status = 'ativa';
    end if;

    update public.tarefas
    set status = 'ativa'
    where id = linha.id;

    delete from public.itens_compra where tarefa_id = linha.id;
  end if;

  if soma > 0 then
    perform public.registrar_movimento(
      eu,
      -soma,
      'correcao',
      'Tarefa voltou · ' || coalesce(linha.titulo, 'Tarefa'),
      alvo.id,
      alvo.semana
    );
  end if;

  update public.resgates
  set status = 'aceito', confirmado_em = null
  where tarefa_id = alvo.tarefa_id
    and quem_cumpre = eu
    and status = 'cumprido'
    and semana = alvo.semana;

  delete from public.conclusoes where id = alvo.id;
end;
$$;

create or replace function public.comprar_tarefa(p_tarefa_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  eu uuid := (select auth.uid());
  hoje date;
  nova_id uuid;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para concluir.';
  end if;

  perform 1 from public.profiles where id = eu for update;

  select * into casa_linha from public.casa where id = 1;
  if not found then
    raise exception using message = 'A casa ainda não foi configurada.';
  end if;

  hoje := (now() at time zone casa_linha.fuso)::date;

  select * into linha from public.tarefas where id = p_tarefa_id for update;
  if not found then
    raise exception using message = 'Não achei essa tarefa.';
  end if;

  if linha.tipo <> 'compra' or linha.status <> 'ativa' then
    raise exception using message = 'Essa compra não está disponível.';
  end if;

  if linha.libera_tarefa_id is not null then
    perform 1 from public.tarefas where id = linha.libera_tarefa_id for update;
  end if;

  insert into public.conclusoes (
    tarefa_id, usuario_id, estrelinhas_base, estrelinhas_bonus, semana
  ) values (
    linha.id, eu, linha.estrelinhas, 0, public.segunda_da_semana(now())
  )
  returning id into nova_id;

  if linha.estrelinhas > 0 then
    perform public.registrar_movimento(eu, linha.estrelinhas, 'tarefa', linha.titulo, nova_id);
  end if;

  update public.tarefas
  set status = 'arquivada', proxima_data = null
  where id = linha.id;

  if linha.libera_tarefa_id is not null then
    update public.tarefas
    set status = 'ativa',
        proxima_data = case when tipo = 'rotina' then hoje else proxima_data end
    where id = linha.libera_tarefa_id
      and status = 'bloqueada';
  end if;

  delete from public.itens_compra where tarefa_id = linha.id;

  insert into public.itens_compra (
    nome, tarefa_id, comprado, comprado_em, comprado_por, criado_por
  ) values (
    linha.titulo, linha.id, true, now(), eu, eu
  );

  return nova_id;
end;
$$;

create or replace function public.resgatar_cupom(
  p_cupom_id uuid,
  p_tarefa_id uuid default null,
  p_quem uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  cupom public.cupons%rowtype;
  tarefa public.tarefas%rowtype;
  quem uuid;
  custo integer;
  usados integer;
  limite integer;
  nova_id uuid;
  semana date;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para resgatar.';
  end if;

  perform 1 from public.profiles where id = eu for update;
  quem := public.pessoa_que_cumpre(p_quem);
  semana := public.segunda_da_semana(now());

  select * into cupom from public.cupons where id = p_cupom_id for update;
  if not found or not cupom.ativo then
    raise exception using message = 'Esse cupom não está na loja.';
  end if;

  if cupom.tipo = 'passa_vez' then
    if p_tarefa_id is null then
      raise exception using message = 'Escolha a tarefa para passar a vez.';
    end if;

    select * into tarefa from public.tarefas where id = p_tarefa_id for update;
    if not found or tarefa.status <> 'ativa' or tarefa.tipo = 'compra' then
      raise exception using message = 'Essa tarefa não dá para passar a vez.';
    end if;

    if exists (
      select 1 from public.resgates resgate
      where resgate.tarefa_id = tarefa.id
        and resgate.status in ('pendente', 'aceito')
    ) then
      raise exception using message = 'Essa tarefa já está num Passa a vez.';
    end if;

    select parametros.valor into limite
    from public.parametros
    where parametros.chave = 'passa_vez_limite';
    limite := coalesce(limite, 1);

    select count(*)::integer into usados
    from public.resgates resgate
    join public.cupons cupom_vez on cupom_vez.id = resgate.cupom_id
    where resgate.quem_resgatou = eu
      and cupom_vez.tipo = 'passa_vez'
      and resgate.semana = semana
      and resgate.status <> 'negociado';

    if usados >= limite then
      raise exception using message = 'O Passa a vez desta semana já foi usado.';
    end if;

    custo := cupom.custo + ((tarefa.estrelinhas + 1) / 2);
  else
    if p_tarefa_id is not null then
      raise exception using message = 'Esse cupom não pede tarefa.';
    end if;
    custo := cupom.custo;

    if cupom.limite_semana is not null then
      select count(*)::integer into usados
      from public.resgates resgate
      where resgate.cupom_id = cupom.id
        and resgate.quem_resgatou = eu
        and resgate.semana = semana
        and resgate.status <> 'negociado';

      if usados >= cupom.limite_semana then
        raise exception using message = 'Esse cupom já foi resgatado o bastante nesta semana.';
      end if;
    end if;
  end if;

  if public.saldo_disponivel(eu) < custo then
    raise exception using message = 'Ainda faltam estrelinhas para esse cupom.';
  end if;

  insert into public.resgates (
    cupom_id, quem_resgatou, quem_cumpre, status, tarefa_id, prazo, estrelinhas, semana
  ) values (
    cupom.id,
    eu,
    quem,
    'pendente',
    case when cupom.tipo = 'passa_vez' then tarefa.id else null end,
    case
      when cupom.prazo_dias is null then null
      else now() + make_interval(days => cupom.prazo_dias)
    end,
    custo,
    semana
  )
  returning id into nova_id;

  perform public.registrar_movimento(
    eu,
    -custo,
    'cupom',
    cupom.titulo || case when cupom.tipo = 'passa_vez' then ' · ' || tarefa.titulo else '' end,
    nova_id
  );

  if cupom.tipo = 'passa_vez' then
    perform public.avisar_loja(
      quem,
      'Passa a vez',
      public.nome_curto(eu) || ' quer passar ' || tarefa.titulo || '. Dá para aceitar ou devolver.'
    );
  else
    perform public.avisar_loja(
      quem,
      'Lojinha',
      public.nome_curto(eu) || ' resgatou ' || cupom.titulo || '. Quando der, é com você.'
    );
  end if;

  return nova_id;
end;
$$;

create or replace function public.marcar_cupom_feito(p_resgate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  resgate public.resgates%rowtype;
  cupom public.cupons%rowtype;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select * into resgate from public.resgates where id = p_resgate_id for update;
  if not found or resgate.quem_cumpre <> eu or resgate.status <> 'pendente' then
    raise exception using message = 'Esse cupom não está com você para cumprir.';
  end if;

  select * into cupom from public.cupons where id = resgate.cupom_id;
  if cupom.tipo = 'passa_vez' then
    raise exception using message = 'O Passa a vez se aceita ou se devolve.';
  end if;

  update public.resgates
  set status = 'feito', feito_em = now()
  where id = resgate.id;

  perform public.avisar_loja(
    resgate.quem_resgatou,
    'Lojinha',
    public.nome_curto(eu) || ' fez ' || coalesce(cupom.titulo, 'o cupom') || '. Falta o seu carimbo.'
  );
end;
$$;

create or replace function public.confirmar_cupom(p_resgate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  resgate public.resgates%rowtype;
  cupom public.cupons%rowtype;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select * into resgate from public.resgates where id = p_resgate_id for update;
  if not found or resgate.quem_resgatou <> eu or resgate.status <> 'feito' then
    raise exception using message = 'Esse cupom ainda não está pronto para o carimbo.';
  end if;

  select * into cupom from public.cupons where id = resgate.cupom_id;

  update public.resgates
  set status = 'cumprido', confirmado_em = now()
  where id = resgate.id;

  perform public.avisar_loja(
    resgate.quem_cumpre,
    'Lojinha',
    public.nome_curto(eu) || ' carimbou Cumprido em ' || coalesce(cupom.titulo, 'o cupom') || '.'
  );
end;
$$;

create or replace function public.aceitar_passa_vez(p_resgate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  resgate public.resgates%rowtype;
  titulo text;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select * into resgate from public.resgates where id = p_resgate_id for update;
  if not found or resgate.quem_cumpre <> eu or resgate.status <> 'pendente' then
    raise exception using message = 'Esse Passa a vez não está esperando você.';
  end if;

  if not exists (
    select 1 from public.cupons cupom
    where cupom.id = resgate.cupom_id and cupom.tipo = 'passa_vez'
  ) then
    raise exception using message = 'Esse cupom não é um Passa a vez.';
  end if;

  select tarefas.titulo into titulo from public.tarefas where id = resgate.tarefa_id;

  update public.resgates set status = 'aceito' where id = resgate.id;

  perform public.avisar_loja(
    resgate.quem_resgatou,
    'Passa a vez',
    public.nome_curto(eu) || ' aceitou ' || coalesce(titulo, 'a tarefa') || '.'
  );
end;
$$;

create or replace function public.negociar_passa_vez(p_resgate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  resgate public.resgates%rowtype;
begin
  if eu is null then
    raise exception using message = 'Entre de novo.';
  end if;

  select * into resgate from public.resgates where id = p_resgate_id for update;
  if not found or resgate.quem_cumpre <> eu or resgate.status <> 'pendente' then
    raise exception using message = 'Esse Passa a vez não está esperando você.';
  end if;

  perform 1 from public.profiles where id = resgate.quem_resgatou for update;

  if not exists (
    select 1 from public.cupons cupom
    where cupom.id = resgate.cupom_id and cupom.tipo = 'passa_vez'
  ) then
    raise exception using message = 'Esse cupom não é um Passa a vez.';
  end if;

  update public.resgates
  set status = 'negociado', confirmado_em = now()
  where id = resgate.id;

  perform public.registrar_movimento(
    resgate.quem_resgatou,
    resgate.estrelinhas,
    'cupom',
    'Devolvido · Passa a vez',
    resgate.id
  );

  perform public.avisar_loja(
    resgate.quem_resgatou,
    'Passa a vez',
    public.nome_curto(eu) || ' devolveu o Passa a vez. As estrelinhas voltaram para a lojinha.'
  );
end;
$$;

create or replace function public.depositar_cofrinho(p_quantidade integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  cofrinho public.cofrinhos%rowtype;
  ja integer;
  colocar integer;
  ids uuid[];
begin
  if eu is null then
    raise exception using message = 'Entre de novo para depositar.';
  end if;

  if p_quantidade is null or p_quantidade < 1 then
    raise exception using message = 'Escolha quantas estrelinhas depositar.';
  end if;

  perform 1 from public.profiles where id = eu for update;

  select * into cofrinho
  from public.cofrinhos
  where status = 'aberto'
  order by criado_em
  limit 1
  for update;

  if not found then
    raise exception using message = 'O cofrinho já encheu. O próximo desejo se combina nos ajustes.';
  end if;

  select coalesce((-sum(movimento.quantidade))::integer, 0) into ja
  from public.movimentos movimento
  where movimento.motivo = 'cofrinho'
    and movimento.referencia_id = cofrinho.id;

  if ja >= cofrinho.custo then
    update public.cofrinhos
    set status = 'completo', completo_em = coalesce(completo_em, now())
    where id = cofrinho.id;
    raise exception using message = 'O cofrinho já encheu.';
  end if;

  colocar := least(p_quantidade, cofrinho.custo - ja);
  if public.saldo_disponivel(eu) < colocar then
    raise exception using message = 'Ainda faltam estrelinhas para esse depósito.';
  end if;

  perform public.registrar_movimento(eu, -colocar, 'cofrinho', cofrinho.titulo, cofrinho.id);

  if ja + colocar >= cofrinho.custo then
    update public.cofrinhos
    set status = 'completo', completo_em = now()
    where id = cofrinho.id;

    select coalesce(array_agg(profiles.id), array[]::uuid[]) into ids from public.profiles;
    begin
      perform public.enfileirar_notificacao(
        ids,
        'Cofrinho',
        'O cofrinho ' || cofrinho.titulo || ' encheu.',
        '/'
      );
    exception
      when others then
        raise warning 'notificacao cofrinho: %', sqlerrm;
    end;
  else
    update public.cofrinhos set titulo = cofrinho.titulo where id = cofrinho.id;
  end if;
end;
$$;

create or replace function public.salvar_cupom(
  p_id uuid,
  p_titulo text,
  p_descricao text,
  p_icone text,
  p_custo integer,
  p_limite integer,
  p_prazo integer,
  p_ativo boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_descricao text := trim(coalesce(p_descricao, ''));
  nova_id uuid;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para salvar o cupom.';
  end if;

  if char_length(v_titulo) < 1 or char_length(v_titulo) > 80 then
    raise exception using message = 'O nome do cupom fica entre 1 e 80 caracteres.';
  end if;
  if char_length(v_descricao) > 240 then
    raise exception using message = 'A descrição fica em até 240 caracteres.';
  end if;
  if not public.icone_de_cupom(p_icone) then
    raise exception using message = 'Escolha um ícone da lista.';
  end if;
  if p_custo is null or p_custo < 0 or p_custo > 9999 then
    raise exception using message = 'O custo fica entre 0 e 9999 estrelinhas.';
  end if;
  if p_limite is not null and (p_limite < 1 or p_limite > 99) then
    raise exception using message = 'O limite da semana fica entre 1 e 99, ou em branco.';
  end if;
  if p_prazo is not null and (p_prazo < 1 or p_prazo > 90) then
    raise exception using message = 'O prazo fica entre 1 e 90 dias, ou em branco.';
  end if;

  if p_id is null then
    insert into public.cupons (titulo, descricao, custo, icone, limite_semana, prazo_dias, tipo, ativo, ordem)
    values (v_titulo, v_descricao, p_custo, p_icone, p_limite, p_prazo, 'cupom', coalesce(p_ativo, true), 50)
    returning id into nova_id;
    return nova_id;
  end if;

  update public.cupons
  set titulo = v_titulo,
      descricao = v_descricao,
      custo = p_custo,
      icone = p_icone,
      limite_semana = p_limite,
      prazo_dias = p_prazo,
      ativo = coalesce(p_ativo, ativo)
  where id = p_id
  returning id into nova_id;

  if nova_id is null then
    raise exception using message = 'Não achei esse cupom.';
  end if;
  return nova_id;
end;
$$;

create or replace function public.salvar_cofrinho(
  p_titulo text,
  p_descricao text,
  p_custo integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  v_titulo text := trim(coalesce(p_titulo, ''));
  v_descricao text := trim(coalesce(p_descricao, ''));
  aberto public.cofrinhos%rowtype;
  ja integer;
  nova_id uuid;
begin
  if eu is null then
    raise exception using message = 'Entre de novo para salvar o cofrinho.';
  end if;

  if char_length(v_titulo) < 1 or char_length(v_titulo) > 80 then
    raise exception using message = 'O desejo fica entre 1 e 80 caracteres.';
  end if;
  if char_length(v_descricao) > 240 then
    raise exception using message = 'A descrição fica em até 240 caracteres.';
  end if;
  if p_custo is null or p_custo < 1 or p_custo > 9999 then
    raise exception using message = 'O custo do cofrinho fica entre 1 e 9999.';
  end if;

  select * into aberto
  from public.cofrinhos
  where status = 'aberto'
  order by criado_em
  limit 1
  for update;

  if not found then
    insert into public.cofrinhos (titulo, descricao, icone, custo)
    values (v_titulo, v_descricao, 'pote', p_custo)
    returning id into nova_id;
    return nova_id;
  end if;

  select coalesce((-sum(movimento.quantidade))::integer, 0) into ja
  from public.movimentos movimento
  where movimento.motivo = 'cofrinho'
    and movimento.referencia_id = aberto.id;

  if ja > p_custo then
    raise exception using message = 'O custo ficou menor do que o que já foi depositado.';
  end if;

  update public.cofrinhos
  set titulo = v_titulo, descricao = v_descricao, custo = p_custo
  where id = aberto.id
  returning id into nova_id;

  if ja = p_custo then
    update public.cofrinhos
    set status = 'completo', completo_em = coalesce(completo_em, now())
    where id = nova_id;
  end if;

  return nova_id;
end;
$$;

create or replace function public.salvar_parametro(p_chave text, p_valor integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using message = 'Entre de novo.';
  end if;

  if p_chave = 'passa_vez_limite' then
    if p_valor is null or p_valor < 1 or p_valor > 7 then
      raise exception using message = 'O limite do Passa a vez fica entre 1 e 7 por semana.';
    end if;
  else
    raise exception using message = 'Esse ajuste ainda não está na lojinha.';
  end if;

  update public.parametros set valor = p_valor where chave = p_chave;
  if not found then
    raise exception using message = 'Não achei esse ajuste.';
  end if;
end;
$$;

revoke all on function public.registrar_movimento(uuid, integer, text, text, uuid, date) from public, anon, authenticated;
revoke all on function public.saldo_disponivel(uuid) from public, anon, authenticated;
revoke all on function public.nome_curto(uuid) from public, anon, authenticated;
revoke all on function public.avisar_loja(uuid, text, text) from public, anon, authenticated;
revoke all on function public.pessoa_que_cumpre(uuid) from public, anon, authenticated;
revoke all on function public.icone_de_cupom(text) from public, anon, authenticated;

revoke all on function public.meus_saldos() from public, anon;
revoke all on function public.aportes_cofrinho() from public, anon;
revoke all on function public.resgatar_cupom(uuid, uuid, uuid) from public, anon;
revoke all on function public.marcar_cupom_feito(uuid) from public, anon;
revoke all on function public.confirmar_cupom(uuid) from public, anon;
revoke all on function public.aceitar_passa_vez(uuid) from public, anon;
revoke all on function public.negociar_passa_vez(uuid) from public, anon;
revoke all on function public.depositar_cofrinho(integer) from public, anon;
revoke all on function public.salvar_cupom(uuid, text, text, text, integer, integer, integer, boolean) from public, anon;
revoke all on function public.salvar_cofrinho(text, text, integer) from public, anon;
revoke all on function public.salvar_parametro(text, integer) from public, anon;

grant execute on function public.meus_saldos() to authenticated;
grant execute on function public.aportes_cofrinho() to authenticated;
grant execute on function public.resgatar_cupom(uuid, uuid, uuid) to authenticated;
grant execute on function public.marcar_cupom_feito(uuid) to authenticated;
grant execute on function public.confirmar_cupom(uuid) to authenticated;
grant execute on function public.aceitar_passa_vez(uuid) to authenticated;
grant execute on function public.negociar_passa_vez(uuid) to authenticated;
grant execute on function public.depositar_cofrinho(integer) to authenticated;
grant execute on function public.salvar_cupom(uuid, text, text, text, integer, integer, integer, boolean) to authenticated;
grant execute on function public.salvar_cofrinho(text, text, integer) to authenticated;
grant execute on function public.salvar_parametro(text, integer) to authenticated;

alter table public.motivos enable row level security;
alter table public.parametros enable row level security;
alter table public.movimentos enable row level security;
alter table public.resgates enable row level security;
alter table public.cofrinhos enable row level security;

drop policy if exists motivos_le on public.motivos;
create policy motivos_le on public.motivos for select to authenticated using (true);

drop policy if exists parametros_le on public.parametros;
create policy parametros_le on public.parametros for select to authenticated using (true);

drop policy if exists movimentos_le on public.movimentos;
create policy movimentos_le on public.movimentos for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or motivo = 'cofrinho'
  );

drop policy if exists resgates_le on public.resgates;
create policy resgates_le on public.resgates for select to authenticated using (true);

drop policy if exists cofrinhos_le on public.cofrinhos;
create policy cofrinhos_le on public.cofrinhos for select to authenticated using (true);

drop policy if exists cupons_insere on public.cupons;
drop policy if exists cupons_atualiza on public.cupons;
drop policy if exists cupons_apaga on public.cupons;

revoke all on table
  public.motivos,
  public.parametros,
  public.movimentos,
  public.resgates,
  public.cofrinhos
from anon, public;

revoke insert, update, delete on table public.cupons from authenticated;

grant select on table public.motivos to authenticated;
grant select on table public.parametros to authenticated;
grant select on table public.movimentos to authenticated;
grant select on table public.resgates to authenticated;
grant select on table public.cofrinhos to authenticated;

alter table public.movimentos replica identity full;
alter table public.resgates replica identity full;
alter table public.cofrinhos replica identity full;
alter table public.cupons replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'movimentos'
  ) then
    alter publication supabase_realtime add table public.movimentos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resgates'
  ) then
    alter publication supabase_realtime add table public.resgates;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cofrinhos'
  ) then
    alter publication supabase_realtime add table public.cofrinhos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cupons'
  ) then
    alter publication supabase_realtime add table public.cupons;
  end if;
exception
  when others then
    raise warning 'realtime loja: %', sqlerrm;
end $$;

insert into public.movimentos (usuario_id, quantidade, motivo, descricao, referencia_id, semana, criado_em)
select
  conclusao.usuario_id,
  conclusao.estrelinhas_base,
  'tarefa',
  left(coalesce(tarefa.titulo, 'Tarefa'), 200),
  conclusao.id,
  conclusao.semana,
  conclusao.quando
from public.conclusoes conclusao
left join public.tarefas tarefa on tarefa.id = conclusao.tarefa_id
where conclusao.estrelinhas_base > 0
  and not exists (
    select 1 from public.movimentos movimento
    where movimento.referencia_id = conclusao.id
      and movimento.motivo = 'tarefa'
  );

insert into public.movimentos (usuario_id, quantidade, motivo, descricao, referencia_id, semana, criado_em)
select
  conclusao.usuario_id,
  conclusao.estrelinhas_bonus,
  'bonus',
  left('Bônus · ' || coalesce(tarefa.titulo, 'Tarefa'), 200),
  conclusao.id,
  conclusao.semana,
  conclusao.quando
from public.conclusoes conclusao
left join public.tarefas tarefa on tarefa.id = conclusao.tarefa_id
where conclusao.estrelinhas_bonus > 0
  and not exists (
    select 1 from public.movimentos movimento
    where movimento.referencia_id = conclusao.id
      and movimento.motivo = 'bonus'
  );
