-- Concluir e desfazer tarefa numa transação só.
-- Rotina atrasada ganha casa.bonus_por_dia estrelinhas por dia de atraso.
-- "N vezes por semana": cada conclusão empurra para o dia seguinte até a cota;
-- quando a cota fecha, a próxima data vai para a segunda-feira seguinte.
-- Missão concluída fica arquivada. Pode rodar de novo: create or replace.

create or replace function public.concluir_tarefa(p_tarefa_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linha public.tarefas%rowtype;
  casa_linha public.casa%rowtype;
  hoje date;
  atraso integer;
  bonus integer;
  vezes integer;
  proxima date;
  nova_id uuid;
  nova_semana date;
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
    tarefa_id,
    usuario_id,
    estrelinhas_base,
    estrelinhas_bonus,
    semana
  ) values (
    linha.id,
    (select auth.uid()),
    linha.estrelinhas,
    bonus,
    nova_semana
  )
  returning id into nova_id;

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
  end if;

  delete from public.conclusoes where id = alvo.id;
end;
$$;

revoke all on function public.concluir_tarefa(uuid) from public, anon;
revoke all on function public.desfazer_conclusao(uuid) from public, anon;
grant execute on function public.concluir_tarefa(uuid) to authenticated;
grant execute on function public.desfazer_conclusao(uuid) to authenticated;
