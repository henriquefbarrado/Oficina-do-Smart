-- =====================================================================
-- Oficina do Smart - Migração: Estoque Central visível para TODOS
-- (administrador, técnico e funcionário). Rode inteiro no Supabase >
-- SQL Editor. Não apaga dados e pode ser rodado mais de uma vez.
-- Não tem senhas.
-- =====================================================================
-- A função abaixo devolve as peças disponíveis do estoque central (local 0)
-- para qualquer usuário ATIVO, sem depender das políticas da tabela units.
-- É só leitura: ninguém consegue alterar nada por ela.
create or replace function public.central_units()
returns setof public.units
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.*
  from public.units u
  where u.loc_store_id = 0
    and u.status in ('Recebida', 'Disponível', 'Devolvida')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
$$;

revoke all on function public.central_units() from public, anon;
grant execute on function public.central_units() to authenticated;
