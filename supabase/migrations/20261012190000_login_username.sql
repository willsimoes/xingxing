-- Login pelo username. Rode depois de 20261012180000_username_e_caixa.sql. Pode rodar de novo.
-- A tela pede o username. Esta função devolve só o e-mail daquela pessoa, para o Supabase entrar.
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
