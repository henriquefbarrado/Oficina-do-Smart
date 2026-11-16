-- =====================================================================
-- Oficina do Smart - Migração: administradores múltiplos + Estoque Central visível
-- Rode INTEIRO no Supabase > SQL Editor, com o banco que já está em uso.
-- Não apaga dados e pode ser rodado mais de uma vez. Não tem senhas.
-- =====================================================================

-- 1) Permitir mais de um administrador --------------------------------
--    Remove qualquer trava "só um admin" (índice/constraint única sobre is_admin).
do $$
declare r record;
begin
  for r in select c.conname from pg_constraint c
           where c.conrelid = 'public.profiles'::regclass and c.contype in ('u','x')
             and pg_get_constraintdef(c.oid) ilike '%is_admin%' loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
  for r in select i.indexname from pg_indexes i
           where i.schemaname = 'public' and i.tablename = 'profiles'
             and i.indexdef ilike 'create unique index%' and i.indexdef ilike '%is_admin%' loop
    execute format('drop index if exists public.%I', r.indexname);
  end loop;
end $$;

-- 2) Função que promove / rebaixa administrador (só admin executa) -----
create or replace function public.admin_set_admin(p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin and active) then
    raise exception 'Somente administradores podem alterar perfis de acesso.';
  end if;
  if p_user = auth.uid() and not p_on then
    raise exception 'Você não pode remover o seu próprio acesso de administrador.';
  end if;
  update public.profiles set is_admin = p_on where id = p_user;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;
end $$;

revoke all on function public.admin_set_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;

-- 3) Todos os usuários ativos podem VER o Estoque Central (id 0) -------
--    Só leitura. Quem movimenta continua sendo o administrador.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

revoke all on function public.is_active_user() from public, anon;
grant execute on function public.is_active_user() to authenticated;

drop policy if exists units_select_estoque_central on public.units;
create policy units_select_estoque_central on public.units
  for select to authenticated
  using (loc_store_id = 0 and public.is_active_user());

-- 4) Se o Patrick ainda NÃO for administrador, troque o e-mail e rode: --
-- update public.profiles set is_admin = true where email = 'EMAIL_DO_PATRICK';

-- 5) Diagnóstico (só informa; nada é alterado) -------------------------
--    Se "Tornar admin" der erro depois, copie o resultado desta consulta.
select tgname as gatilho_em_profiles, pg_get_triggerdef(oid) as definicao
from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;
