-- Exclusão segura de peças do catálogo (somente administrador).
-- Preserva pedidos e histórico e bloqueia peças com unidades em fluxo.
create or replace function public.catalog_delete(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.profiles := public._actor();
  c public.catalog%rowtype;
begin
  perform public._need(a.is_admin, 'Somente o administrador exclui peças do catálogo.');

  select * into c from public.catalog where id = p_id for update;
  perform public._need(c.id is not null, 'Peça não encontrada no catálogo.');

  perform public._need(not exists (
    select 1 from public.units u
    where u.part_name = c.name
      and u.model = c.model
      and u.status in (
        'Solicitada', 'Recebida', 'Em estoque da unidade', 'Devolvida',
        'Disponível', 'Aguardando manutenção', 'Em manutenção'
      )
  ), 'Não é possível excluir: esta peça ainda possui unidades em estoque ou em movimentação. Resolva essas unidades primeiro.');

  delete from public.catalog where id = p_id;
  perform public._log(a, 'Exclusão do catálogo', null,
    c.name || ' ' || c.model, 1, 'Cadastrada', 'Excluída',
    'Catálogo #' || c.id, null, null);
end;
$$;

revoke all on function public.catalog_delete(bigint) from public, anon;
grant execute on function public.catalog_delete(bigint) to authenticated;
notify pgrst, 'reload schema';
