-- =====================================================================
-- Oficina do Smart - Migração: excluir peça do estoque + cadastrar loja
-- Rode inteiro no Supabase > SQL Editor. Não apaga dados existentes,
-- pode ser rodado mais de uma vez e não tem senhas.
-- Só o administrador consegue usar as duas funções (verificado no banco).
-- =====================================================================

-- 1) EXCLUIR PEÇA (aba Estoques) --------------------------------------
-- Tira a peça do catálogo e das prateleiras (estoque central e lojas).
-- As unidades em estoque ficam com o status "Descartada" em vez de serem
-- apagadas, então o histórico e o rastro de cada código continuam intactos.
-- Peças já utilizadas/descartadas antes não são mexidas.
-- Bloqueia se a peça ainda tem unidade pedida, em manutenção, em devolução
-- ou em transferência pendente (resolva isso primeiro).
create or replace function public.stock_part_delete(p_name text, p_model text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.profiles := public._actor();
  v_label text := btrim(coalesce(p_name, '')) || ' ' || btrim(coalesce(p_model, ''));
  v_cat   bigint;
  v_n     integer := 0;
begin
  perform public._need(a.is_admin, 'Somente o administrador exclui peças do estoque.');
  perform public._need(btrim(coalesce(p_name, '')) <> '', 'Informe a peça.');

  select id into v_cat from public.catalog
   where name = btrim(p_name) and model = btrim(coalesce(p_model, '')) for update;

  perform public._need(not exists (
    select 1 from public.units u
     where u.part_name = btrim(p_name) and u.model = btrim(coalesce(p_model, ''))
       and (
            u.status in ('Solicitada', 'Aguardando manutenção', 'Em manutenção')
         or (u.status in ('Recebida', 'Devolvida', 'Disponível') and u.loc_store_id <> 0)
       )
  ), 'Não é possível excluir: esta peça tem unidade pedida, em manutenção ou em devolução. Resolva isso primeiro.');

  perform public._need(not exists (
    select 1 from public.transfers t
     where t.part_label = v_label
       and t.status in ('Aguardando OK da loja de origem', 'Aguardando aprovação do admin')
  ), 'Não é possível excluir: existe transferência pendente desta peça.');

  update public.units u
     set status = 'Descartada'
   where u.part_name = btrim(p_name) and u.model = btrim(coalesce(p_model, ''))
     and (
          (u.loc_store_id = 0 and u.status in ('Recebida', 'Devolvida', 'Disponível'))
       or u.status = 'Em estoque da unidade'
     );
  get diagnostics v_n = row_count;

  perform public._need(v_n > 0 or v_cat is not null, 'Peça não encontrada.');

  if v_cat is not null then
    delete from public.catalog where id = v_cat;
  end if;

  perform public._log(a, 'Exclusão de peça do estoque', null,
    v_label, v_n::int, 'Em estoque', 'Descartada',
    'Estoques', null, null);

  return v_n;
end;
$$;

revoke all on function public.stock_part_delete(text, text) from public, anon;
grant execute on function public.stock_part_delete(text, text) to authenticated;

-- 2) CADASTRAR LOJA (aba Estoques) ------------------------------------
-- Cria um novo local de estoque (loja). Ele passa a aparecer como coluna
-- em Estoques e nas listas de loja (saída do central, transferências,
-- pedidos, usuários etc.).
create or replace function public.store_create(p_name text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.profiles := public._actor();
  v_name text := btrim(coalesce(p_name, ''));
  v_id   bigint;
begin
  perform public._need(a.is_admin, 'Somente o administrador cadastra lojas.');
  perform public._need(char_length(v_name) between 2 and 60, 'Informe o nome da loja (2 a 60 caracteres).');

  lock table public.stores in share row exclusive mode;

  perform public._need(not exists (
    select 1 from public.stores where lower(name) = lower(v_name)
  ), 'Já existe uma loja com esse nome.');

  select coalesce(max(id), 0) + 1 into v_id from public.stores;

  begin
    insert into public.stores (id, name, kind) values (v_id, v_name, 'loja');
  exception when generated_always then
    insert into public.stores (id, name, kind) overriding system value values (v_id, v_name, 'loja');
  end;

  perform public._log(a, 'Cadastro de loja', v_id::int, v_name, 1, 'Nova', 'Cadastrada',
    'Loja #' || v_id, null, null);

  return v_id;
end;
$$;

revoke all on function public.store_create(text) from public, anon;
grant execute on function public.store_create(text) to authenticated;

notify pgrst, 'reload schema';
