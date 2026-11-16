-- =====================================================================
-- Oficina do Smart - Migração: excluir usuário (somente administrador)
-- Rode inteiro no Supabase > SQL Editor. Não apaga dados existentes e
-- pode ser rodado mais de uma vez. Não tem senhas.
-- =====================================================================
create or replace function public.admin_delete_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin and active) then
    raise exception 'Somente administradores podem excluir usuários.';
  end if;
  if p_user = auth.uid() then
    raise exception 'Você não pode excluir o seu próprio acesso.';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'Usuário não encontrado.';
  end if;
  begin
    delete from public.profiles where id = p_user;
    delete from auth.users where id = p_user;
  exception when foreign_key_violation then
    raise exception 'Este usuário tem histórico no sistema e não pode ser excluído. Use "Desativar".';
  end;
end $$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
