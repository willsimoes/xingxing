-- Lista de compras ligada a tarefas do tipo compra, e fechamento da meta semanal.
-- Comprar uma tarefa arquiva ela, paga as estrelinhas e, se houver, libera a tarefa seguinte.
-- A semana fecha sozinha quando alguém abre o app depois da segunda: bateu a meta, a sequência sobe; não bateu, volta a zero.
-- Pode rodar de novo: create or replace e add column if not exists.

alter table public.casa
  add column if not exists ultima_semana_bateu boolean;

comment on column public.casa.ultima_semana_bateu is
  'Se a última semana fechada bateu a meta. Nulo enquanto nenhuma semana com atividade foi julgada.';

comment on column public.casa.ultima_semana_fechada is
  'Segunda-feira da última semana julgada. Na estreia, a semana anterior à atual, sem contar como derrota.';

create or replace function public.comprar_tarefa(p_tarefa_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  hoje date;
  nova_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception using message = 'Entre de novo para concluir.';
  end if;

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
    tarefa_id,
    usuario_id,
    estrelinhas_base,
    estrelinhas_bonus,
    semana
  ) values (
    linha.id,
    (select auth.uid()),
    linha.estrelinhas,
    0,
    public.segunda_da_semana(now())
  )
  returning id into nova_id;

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
    nome,
    tarefa_id,
    comprado,
    comprado_em,
    comprado_por,
    criado_por
  ) values (
    linha.titulo,
    linha.id,
    true,
    now(),
    (select auth.uid()),
    (select auth.uid())
  );

  return nova_id;
end;
$$;

create or replace function public.desfazer_conclusao(p_conclusao_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  alvo public.conclusoes%rowtype;
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  hoje date;
  atraso integer;
begin
  if (select auth.uid()) is null then
    raise exception using message = 'Entre de novo para desfazer.';
  end if;

  select * into alvo
  from public.conclusoes
  where id = p_conclusao_id
    and usuario_id = (select auth.uid());

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

  delete from public.conclusoes where id = alvo.id;
end;
$$;

create or replace function public.fechar_semanas()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  casa_linha public.casa%rowtype;
  segunda_atual date;
  segunda_anterior date;
  alvo date;
  primeira date;
  soma integer;
  bateu boolean;
  seguidas integer;
  fechadas integer := 0;
  ultima_bateu boolean := null;
  ultima_soma integer := 0;
  ultima_semana date := null;
begin
  if (select auth.uid()) is null then
    raise exception using message = 'Entre de novo para fechar a semana.';
  end if;

  select * into casa_linha from public.casa where id = 1 for update;
  if not found then
    raise exception using message = 'A casa ainda não foi configurada.';
  end if;

  segunda_atual := public.segunda_da_semana(now());
  segunda_anterior := segunda_atual - 7;

  if casa_linha.ultima_semana_fechada is not null
     and casa_linha.ultima_semana_fechada >= segunda_anterior then
    return jsonb_build_object('fechadas', 0, 'atualizou', false);
  end if;

  if casa_linha.ultima_semana_fechada is null then
    select min(conclusao.semana) into primeira
    from public.conclusoes conclusao
    where conclusao.semana < segunda_atual;

    if primeira is null then
      update public.casa
      set ultima_semana_fechada = segunda_anterior,
          ultima_semana_bateu = null
      where id = 1;
      return jsonb_build_object('fechadas', 0, 'atualizou', true);
    end if;
  else
    primeira := casa_linha.ultima_semana_fechada + 7;
  end if;

  seguidas := casa_linha.semanas_seguidas;
  alvo := primeira;

  while alvo < segunda_atual loop
    select coalesce(sum(conclusao.estrelinhas_base + conclusao.estrelinhas_bonus), 0)::integer
      into soma
    from public.conclusoes conclusao
    where conclusao.semana = alvo;

    bateu := soma >= casa_linha.meta_semanal;
    if bateu then
      seguidas := seguidas + 1;
    else
      seguidas := 0;
    end if;

    fechadas := fechadas + 1;
    ultima_bateu := bateu;
    ultima_soma := soma;
    ultima_semana := alvo;
    alvo := alvo + 7;

    if fechadas > 520 then
      raise exception using message = 'Há semanas demais para fechar de uma vez.';
    end if;
  end loop;

  if fechadas = 0 or ultima_semana is null then
    update public.casa
    set ultima_semana_fechada = segunda_anterior,
        ultima_semana_bateu = null
    where id = 1;
    return jsonb_build_object('fechadas', 0, 'atualizou', true);
  end if;

  update public.casa
  set semanas_seguidas = seguidas,
      ultima_semana_fechada = ultima_semana,
      ultima_semana_bateu = ultima_bateu
  where id = 1;

  return jsonb_build_object(
    'fechadas', fechadas,
    'atualizou', true,
    'bateu', ultima_bateu,
    'soma', ultima_soma,
    'meta', casa_linha.meta_semanal,
    'seguidas', seguidas,
    'semana', ultima_semana
  );
end;
$$;

revoke all on function public.comprar_tarefa(uuid) from public, anon;
revoke all on function public.desfazer_conclusao(uuid) from public, anon;
revoke all on function public.fechar_semanas() from public, anon;
grant execute on function public.comprar_tarefa(uuid) to authenticated;
grant execute on function public.desfazer_conclusao(uuid) to authenticated;
grant execute on function public.fechar_semanas() to authenticated;
