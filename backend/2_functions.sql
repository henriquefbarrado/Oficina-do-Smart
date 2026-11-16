-- =====================================================================
-- functions.sql  |  ORDEM DE EXECUÇÃO: 2 de 7
-- Regras de negócio. TODA alteração de estoque passa por aqui.
--  * private.*  -> auxiliares internos (não expostos pela API)
--  * public.*   -> RPCs que o frontend chama com supabase.rpc('nome', {...})
-- Todas as RPCs são SECURITY DEFINER com search_path vazio e validam o
-- usuário via auth.uid() + tabela profiles (nunca por dados do frontend).
-- =====================================================================

grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------
-- 1. Auxiliares de identidade (usados também pelas políticas RLS)
-- ---------------------------------------------------------------------
create or replace function private.user_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.active
$$;

create or replace function private.user_store_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.store_id from public.profiles p where p.id = (select auth.uid()) and p.active
$$;

create or replace function private.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.active)
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.active and p.role = 'admin')
$$;

create or replace function private.is_stock_manager() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.active and p.role = 'stock_manager')
$$;

create or replace function private.central_store_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select s.id from public.stores s where s.kind = 'central'
$$;

-- ---------------------------------------------------------------------
-- 2. Validações reutilizáveis
-- ---------------------------------------------------------------------
create or replace function private.require_actor() returns public.profiles
language plpgsql stable security definer set search_path = '' as $$
declare
  v public.profiles;
begin
  select * into v from public.profiles p where p.id = auth.uid() and p.active;
  if not found then
    raise exception 'Acesso negado: usuário não autenticado ou inativo.'
      using errcode = '42501', hint = 'forbidden';
  end if;
  return v;
end $$;

create or replace function private.require_role(p_actor public.profiles, p_roles public.user_role[])
returns void language plpgsql set search_path = '' as $$
begin
  if not (p_actor.role = any (p_roles)) then
    raise exception 'Seu perfil (%) não tem permissão para esta operação.', p_actor.role
      using errcode = '42501', hint = 'forbidden';
  end if;
end $$;

-- Decide a unidade da operação SEM confiar no frontend:
--  admin -> precisa informar a unidade; demais -> sempre a unidade do próprio perfil.
create or replace function private.resolve_store(p_actor public.profiles, p_store_id uuid)
returns uuid language plpgsql set search_path = '' as $$
begin
  if p_actor.role = 'admin' then
    if p_store_id is null then
      raise exception 'Informe a unidade.' using errcode = '22023', hint = 'invalid_store';
    end if;
    return p_store_id;
  end if;
  if p_store_id is not null and p_store_id <> p_actor.store_id then
    raise exception 'Você só pode operar na sua própria unidade.' using errcode = '42501', hint = 'forbidden';
  end if;
  return p_actor.store_id;
end $$;

create or replace function private.assert_quantity(p_quantity integer) returns void
language plpgsql set search_path = '' as $$
begin
  if p_quantity is null or p_quantity <= 0 or p_quantity > 1000000 then
    raise exception 'Quantidade inválida: informe um número inteiro maior que zero.'
      using errcode = '22023', hint = 'invalid_quantity';
  end if;
end $$;

create or replace function private.assert_text(p_text text, p_min integer, p_max integer, p_label text)
returns void language plpgsql set search_path = '' as $$
begin
  if p_text is null or length(btrim(p_text)) < p_min or length(p_text) > p_max then
    raise exception '% deve ter entre % e % caracteres.', p_label, p_min, p_max
      using errcode = '22023', hint = 'invalid_text';
  end if;
end $$;

create or replace function private.assert_product(p_product_id uuid, p_require_active boolean default true)
returns void language plpgsql set search_path = '' as $$
begin
  perform 1 from public.products p
   where p.id = p_product_id and (not p_require_active or p.active);
  if not found then
    raise exception 'Produto inexistente ou inativo.' using errcode = '22023', hint = 'invalid_product';
  end if;
end $$;

-- Converte [{"product_id": "...", "<chave>": 3}, ...] em linhas, validando tudo.
create or replace function private.parse_items(p_items jsonb, p_qty_key text, p_allow_zero boolean default false)
returns table (item_product_id uuid, item_qty integer)
language plpgsql set search_path = '' as $$
declare
  v_el   jsonb;
  v_pid  uuid;
  v_qty  integer;
  v_seen uuid[] := '{}';
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Informe ao menos um item.' using errcode = '22023', hint = 'invalid_items';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Máximo de 100 itens por operação.' using errcode = '22023', hint = 'invalid_items';
  end if;
  for v_el in select e.value from jsonb_array_elements(p_items) e loop
    begin
      v_pid := (v_el ->> 'product_id')::uuid;
      v_qty := (v_el ->> p_qty_key)::integer;
    exception when others then
      raise exception 'Item inválido: %', v_el::text using errcode = '22023', hint = 'invalid_items';
    end;
    if v_pid is null or v_qty is null or v_qty < 0 or v_qty > 1000000 or (v_qty = 0 and not p_allow_zero) then
      raise exception 'Item inválido: %', v_el::text using errcode = '22023', hint = 'invalid_items';
    end if;
    if v_pid = any (v_seen) then
      raise exception 'Produto repetido na lista de itens.' using errcode = '22023', hint = 'invalid_items';
    end if;
    v_seen := v_seen || v_pid;
    item_product_id := v_pid;
    item_qty := v_qty;
    return next;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. NÚCLEO: única porta de entrada para alterar saldo
--    * trava a linha do saldo (FOR UPDATE) -> duas operações simultâneas na mesma
--      unidade+produto são executadas uma de cada vez
--    * recusa saldo negativo
--    * grava a movimentação E atualiza o saldo na mesma transação
--    * idempotência: a mesma chave do mesmo usuário não gera duas movimentações
-- ---------------------------------------------------------------------
create or replace function private.apply_movement(
  p_store_id uuid, p_product_id uuid, p_type public.movement_type, p_delta integer, p_actor uuid,
  p_counterpart uuid default null, p_reason text default null,
  p_ref_type text default null, p_ref_id uuid default null, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_balance  public.stock_balances;
  v_existing uuid;
  v_new      integer;
  v_id       uuid;
  v_sku      text;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'A quantidade da movimentação não pode ser zero.' using errcode = '22023', hint = 'invalid_quantity';
  end if;

  perform 1 from public.stores s where s.id = p_store_id and s.active;
  if not found then
    raise exception 'Unidade inexistente ou inativa.' using errcode = '22023', hint = 'invalid_store';
  end if;
  perform 1 from public.products p where p.id = p_product_id;
  if not found then
    raise exception 'Produto inexistente.' using errcode = '22023', hint = 'invalid_product';
  end if;

  insert into public.stock_balances (store_id, product_id, quantity)
  values (p_store_id, p_product_id, 0)
  on conflict (store_id, product_id) do nothing;

  select * into v_balance from public.stock_balances b
   where b.store_id = p_store_id and b.product_id = p_product_id
   for update;

  if p_idempotency_key is not null then
    select m.id into v_existing from public.stock_movements m
     where m.performed_by = p_actor and m.idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  v_new := v_balance.quantity + p_delta;
  if v_new < 0 then
    select p.sku into v_sku from public.products p where p.id = p_product_id;
    raise exception 'Estoque insuficiente para %: disponível %, necessário %.', v_sku, v_balance.quantity, -p_delta
      using errcode = 'P0001', hint = 'insufficient_stock';
  end if;

  insert into public.stock_movements
    (store_id, counterpart_store_id, product_id, movement_type, quantity_delta, balance_before,
     balance_after, reason, reference_type, reference_id, performed_by, idempotency_key)
  values
    (p_store_id, p_counterpart, p_product_id, p_type, p_delta, v_balance.quantity,
     v_new, p_reason, p_ref_type, p_ref_id, p_actor, p_idempotency_key)
  returning id into v_id;

  update public.stock_balances set quantity = v_new where id = v_balance.id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 4. Movimentações diretas
-- ---------------------------------------------------------------------
create or replace function public.register_entry(
  p_store_id uuid, p_product_id uuid, p_quantity integer,
  p_reason text default null, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_store uuid;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_store := private.resolve_store(v_actor, p_store_id);
  perform private.assert_quantity(p_quantity);
  perform private.assert_product(p_product_id, true);
  return private.apply_movement(v_store, p_product_id, 'entry', p_quantity, v_actor.id,
                                null, p_reason, null, null, p_idempotency_key);
end $$;

create or replace function public.register_exit(
  p_store_id uuid, p_product_id uuid, p_quantity integer,
  p_reason text default null, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_store uuid;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_store := private.resolve_store(v_actor, p_store_id);
  perform private.assert_quantity(p_quantity);
  return private.apply_movement(v_store, p_product_id, 'exit', -p_quantity, v_actor.id,
                                null, p_reason, null, null, p_idempotency_key);
end $$;

-- Registro de utilização (consumo). Funcionário: sempre na própria unidade.
create or replace function public.register_consumption(
  p_product_id uuid, p_quantity integer,
  p_reason text default null, p_idempotency_key uuid default null, p_store_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_store uuid;
begin
  v_actor := private.require_actor();
  v_store := private.resolve_store(v_actor, p_store_id);
  perform private.assert_quantity(p_quantity);
  return private.apply_movement(v_store, p_product_id, 'consumption', -p_quantity, v_actor.id,
                                null, p_reason, null, null, p_idempotency_key);
end $$;

-- Ajuste para a quantidade contada. Justificativa obrigatória.
create or replace function public.adjust_stock(
  p_store_id uuid, p_product_id uuid, p_new_quantity integer, p_reason text,
  p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor    public.profiles;
  v_store    uuid;
  v_current  integer;
  v_existing uuid;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_store := private.resolve_store(v_actor, p_store_id);
  if p_new_quantity is null or p_new_quantity < 0 or p_new_quantity > 1000000 then
    raise exception 'Quantidade inválida: informe um inteiro maior ou igual a zero.'
      using errcode = '22023', hint = 'invalid_quantity';
  end if;
  perform private.assert_text(p_reason, 3, 500, 'A justificativa');
  perform private.assert_product(p_product_id, false);

  insert into public.stock_balances (store_id, product_id, quantity)
  values (v_store, p_product_id, 0)
  on conflict (store_id, product_id) do nothing;
  select b.quantity into v_current from public.stock_balances b
   where b.store_id = v_store and b.product_id = p_product_id for update;

  if p_idempotency_key is not null then
    select m.id into v_existing from public.stock_movements m
     where m.performed_by = v_actor.id and m.idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;
  if p_new_quantity = v_current then
    raise exception 'O saldo atual já é %.', v_current using errcode = '22023', hint = 'no_change';
  end if;
  return private.apply_movement(v_store, p_product_id, 'adjustment', p_new_quantity - v_current,
                                v_actor.id, null, p_reason, null, null, p_idempotency_key);
end $$;

-- ---------------------------------------------------------------------
-- 5. Solicitações (loja -> estoque central)
-- ---------------------------------------------------------------------
create or replace function private.lock_request(p_id uuid) returns public.stock_requests
language plpgsql security definer set search_path = '' as $$
declare
  v public.stock_requests;
begin
  select * into v from public.stock_requests r where r.id = p_id for update;
  if not found then
    raise exception 'Solicitação não encontrada.' using errcode = 'P0002', hint = 'not_found';
  end if;
  return v;
end $$;

create or replace function private.lock_transfer(p_id uuid) returns public.stock_transfers
language plpgsql security definer set search_path = '' as $$
declare
  v public.stock_transfers;
begin
  select * into v from public.stock_transfers t where t.id = p_id for update;
  if not found then
    raise exception 'Transferência não encontrada.' using errcode = 'P0002', hint = 'not_found';
  end if;
  return v;
end $$;

-- p_items: [{"product_id": "<uuid>", "quantity": 5}, ...]
create or replace function public.create_stock_request(
  p_items jsonb, p_notes text default null, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_id    uuid;
  v_item  record;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['employee']::public.user_role[]);
  perform 1 from public.stores s where s.id = v_actor.store_id and s.kind = 'branch' and s.active;
  if not found then
    raise exception 'Sua unidade não pode criar solicitações.' using errcode = '42501', hint = 'forbidden';
  end if;
  if p_notes is not null and length(p_notes) > 500 then
    raise exception 'Observação muito longa (máximo 500 caracteres).' using errcode = '22023', hint = 'invalid_text';
  end if;

  begin
    insert into public.stock_requests (requesting_store_id, requested_by, notes, idempotency_key)
    values (v_actor.store_id, v_actor.id, p_notes, p_idempotency_key)
    returning id into v_id;
  exception when unique_violation then
    select r.id into v_id from public.stock_requests r
     where r.requested_by = v_actor.id and r.idempotency_key = p_idempotency_key;
    if v_id is null then raise; end if;
    return v_id;
  end;

  for v_item in select * from private.parse_items(p_items, 'quantity') loop
    perform private.assert_product(v_item.item_product_id, true);
    insert into public.stock_request_items (request_id, product_id, quantity_requested)
    values (v_id, v_item.item_product_id, v_item.item_qty);
  end loop;
  return v_id;
end $$;

create or replace function public.approve_stock_request(p_request_id uuid, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_req   public.stock_requests;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_req := private.lock_request(p_request_id);
  if v_req.status <> 'pending' then
    raise exception 'A solicitação não está pendente (status atual: %).', v_req.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;
  update public.stock_request_items set quantity_approved = quantity_requested where request_id = v_req.id;
  update public.stock_requests
     set status = 'approved', decided_by = v_actor.id, decided_at = now(), decision_notes = p_notes
   where id = v_req.id;
end $$;

-- p_items: [{"product_id": "<uuid>", "quantity_approved": 3}, ...]  (itens omitidos = 0)
create or replace function public.partially_approve_stock_request(
  p_request_id uuid, p_items jsonb, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor    public.profiles;
  v_req      public.stock_requests;
  v_row      record;
  v_total    integer := 0;
  v_all_full boolean := true;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_req := private.lock_request(p_request_id);
  if v_req.status <> 'pending' then
    raise exception 'A solicitação não está pendente (status atual: %).', v_req.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;

  if exists (select 1 from private.parse_items(p_items, 'quantity_approved', true) a
              where not exists (select 1 from public.stock_request_items i
                                 where i.request_id = v_req.id and i.product_id = a.item_product_id)) then
    raise exception 'A lista contém produto que não faz parte da solicitação.'
      using errcode = '22023', hint = 'invalid_items';
  end if;

  for v_row in
    select i.id as item_id, i.quantity_requested as requested, coalesce(a.item_qty, 0) as approved
      from public.stock_request_items i
      left join private.parse_items(p_items, 'quantity_approved', true) a on a.item_product_id = i.product_id
     where i.request_id = v_req.id
  loop
    if v_row.approved > v_row.requested then
      raise exception 'A quantidade aprovada não pode ser maior que a solicitada.'
        using errcode = '22023', hint = 'invalid_quantity';
    end if;
    update public.stock_request_items set quantity_approved = v_row.approved where id = v_row.item_id;
    v_total := v_total + v_row.approved;
    if v_row.approved < v_row.requested then v_all_full := false; end if;
  end loop;

  if v_total = 0 then
    raise exception 'Nenhum item aprovado: use a recusa da solicitação.' using errcode = '22023', hint = 'invalid_items';
  end if;
  update public.stock_requests
     set status = case when v_all_full then 'approved'::public.request_status
                       else 'partially_approved'::public.request_status end,
         decided_by = v_actor.id, decided_at = now(), decision_notes = p_notes
   where id = v_req.id;
end $$;

create or replace function public.reject_stock_request(p_request_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_req   public.stock_requests;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  perform private.assert_text(p_reason, 3, 500, 'O motivo da recusa');
  v_req := private.lock_request(p_request_id);
  if v_req.status <> 'pending' then
    raise exception 'A solicitação não está pendente (status atual: %).', v_req.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;
  update public.stock_request_items set quantity_approved = 0 where request_id = v_req.id;
  update public.stock_requests
     set status = 'rejected', decided_by = v_actor.id, decided_at = now(), decision_notes = p_reason
   where id = v_req.id;
end $$;

create or replace function public.cancel_stock_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_req   public.stock_requests;
begin
  v_actor := private.require_actor();
  v_req := private.lock_request(p_request_id);
  if not (v_actor.role = 'admin' or v_req.requested_by = v_actor.id) then
    raise exception 'Você só pode cancelar solicitações feitas por você.' using errcode = '42501', hint = 'forbidden';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Só é possível cancelar solicitações pendentes (status atual: %).', v_req.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;
  update public.stock_requests set status = 'cancelled' where id = v_req.id;
end $$;

-- "Separar": cria a transferência (central -> loja) com as quantidades aprovadas.
create or replace function public.prepare_request_shipment(p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_req   public.stock_requests;
  v_tr    uuid;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  v_req := private.lock_request(p_request_id);
  if v_req.status not in ('approved', 'partially_approved') then
    raise exception 'A solicitação precisa estar aprovada para ser separada (status atual: %).', v_req.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;

  insert into public.stock_transfers (request_id, origin_store_id, destination_store_id, created_by)
  values (v_req.id, private.central_store_id(), v_req.requesting_store_id, v_actor.id)
  returning id into v_tr;

  insert into public.stock_transfer_items (transfer_id, product_id, quantity)
  select v_tr, i.product_id, i.quantity_approved
    from public.stock_request_items i
   where i.request_id = v_req.id and i.quantity_approved > 0;

  update public.stock_requests set status = 'preparing' where id = v_req.id;
  return v_tr;
end $$;

-- ---------------------------------------------------------------------
-- 6. Transferências (produto sai da origem no envio, entra no destino no recebimento)
-- ---------------------------------------------------------------------
-- p_items: [{"product_id": "<uuid>", "quantity": 5}, ...]
create or replace function public.create_transfer(
  p_origin_store_id uuid, p_destination_store_id uuid, p_items jsonb,
  p_notes text default null, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_id    uuid;
  v_item  record;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  if v_actor.role = 'stock_manager' and p_origin_store_id is distinct from v_actor.store_id then
    raise exception 'O responsável pelo estoque central só envia a partir do estoque central.'
      using errcode = '42501', hint = 'forbidden';
  end if;
  if p_origin_store_id is null or p_destination_store_id is null or p_origin_store_id = p_destination_store_id then
    raise exception 'Origem e destino devem ser unidades diferentes.' using errcode = '22023', hint = 'invalid_store';
  end if;
  perform 1 from public.stores s
   where s.id in (p_origin_store_id, p_destination_store_id) and s.active
  having count(*) = 2;
  if not found then
    raise exception 'Unidade de origem ou destino inexistente ou inativa.' using errcode = '22023', hint = 'invalid_store';
  end if;
  if p_notes is not null and length(p_notes) > 500 then
    raise exception 'Observação muito longa (máximo 500 caracteres).' using errcode = '22023', hint = 'invalid_text';
  end if;

  begin
    insert into public.stock_transfers (origin_store_id, destination_store_id, notes, created_by, idempotency_key)
    values (p_origin_store_id, p_destination_store_id, p_notes, v_actor.id, p_idempotency_key)
    returning id into v_id;
  exception when unique_violation then
    select t.id into v_id from public.stock_transfers t
     where t.created_by = v_actor.id and t.idempotency_key = p_idempotency_key;
    if v_id is null then raise; end if;
    return v_id;
  end;

  for v_item in select * from private.parse_items(p_items, 'quantity') loop
    perform private.assert_product(v_item.item_product_id, true);
    insert into public.stock_transfer_items (transfer_id, product_id, quantity)
    values (v_id, v_item.item_product_id, v_item.item_qty);
  end loop;
  return v_id;
end $$;

-- ENVIO: debita a origem e deixa a mercadoria "em trânsito" (o destino ainda não recebe nada).
create or replace function public.ship_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_tr    public.stock_transfers;
  v_item  record;
begin
  v_actor := private.require_actor();
  v_tr := private.lock_transfer(p_transfer_id);
  if not (v_actor.role = 'admin' or (v_actor.role = 'stock_manager' and v_actor.store_id = v_tr.origin_store_id)) then
    raise exception 'Você não pode enviar transferências desta unidade.' using errcode = '42501', hint = 'forbidden';
  end if;
  if v_tr.status <> 'preparing' then
    raise exception 'A transferência não está em separação (status atual: %).', v_tr.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;

  for v_item in
    select i.product_id, i.quantity from public.stock_transfer_items i
     where i.transfer_id = v_tr.id order by i.product_id
  loop
    perform private.apply_movement(v_tr.origin_store_id, v_item.product_id, 'transfer_out', -v_item.quantity,
              v_actor.id, v_tr.destination_store_id, 'Envio da transferência #' || v_tr.transfer_number,
              'stock_transfer', v_tr.id, null);
  end loop;

  update public.stock_transfers
     set status = 'in_transit', shipped_by = v_actor.id, shipped_at = now()
   where id = v_tr.id;
  if v_tr.request_id is not null then
    update public.stock_requests set status = 'shipped' where id = v_tr.request_id;
  end if;
end $$;

-- RECEBIMENTO: credita o destino. A trava na linha da transferência impede receber duas vezes.
create or replace function public.receive_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_tr    public.stock_transfers;
  v_item  record;
begin
  v_actor := private.require_actor();
  v_tr := private.lock_transfer(p_transfer_id);
  if not (v_actor.role = 'admin' or v_actor.store_id = v_tr.destination_store_id) then
    raise exception 'Somente a unidade de destino pode confirmar o recebimento.'
      using errcode = '42501', hint = 'forbidden';
  end if;
  if v_tr.status = 'received' then
    raise exception 'Esta transferência já foi recebida.' using errcode = 'P0001', hint = 'already_received';
  end if;
  if v_tr.status <> 'in_transit' then
    raise exception 'A transferência não está em trânsito (status atual: %).', v_tr.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;

  for v_item in
    select i.product_id, i.quantity from public.stock_transfer_items i
     where i.transfer_id = v_tr.id order by i.product_id
  loop
    perform private.apply_movement(v_tr.destination_store_id, v_item.product_id, 'transfer_in', v_item.quantity,
              v_actor.id, v_tr.origin_store_id, 'Recebimento da transferência #' || v_tr.transfer_number,
              'stock_transfer', v_tr.id, null);
  end loop;

  update public.stock_transfers
     set status = 'received', received_by = v_actor.id, received_at = now()
   where id = v_tr.id;
  if v_tr.request_id is not null then
    update public.stock_requests set status = 'received' where id = v_tr.request_id;
  end if;
end $$;

-- Cancela somente transferências ainda não enviadas (nada foi debitado).
create or replace function public.cancel_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_tr    public.stock_transfers;
begin
  v_actor := private.require_actor();
  v_tr := private.lock_transfer(p_transfer_id);
  if not (v_actor.role = 'admin' or (v_actor.role = 'stock_manager' and v_actor.store_id = v_tr.origin_store_id)) then
    raise exception 'Você não pode cancelar transferências desta unidade.' using errcode = '42501', hint = 'forbidden';
  end if;
  if v_tr.status <> 'preparing' then
    raise exception 'Só é possível cancelar transferências em separação (status atual: %).', v_tr.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;
  update public.stock_transfers set status = 'cancelled' where id = v_tr.id;
  if v_tr.request_id is not null then
    update public.stock_requests r
       set status = case when exists (select 1 from public.stock_request_items i
                                       where i.request_id = r.id and i.quantity_approved < i.quantity_requested)
                         then 'partially_approved'::public.request_status
                         else 'approved'::public.request_status end
     where r.id = v_tr.request_id;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 7. Devoluções (loja -> estoque central)
--    "good": a peça volta ao saldo do central. "defective"/"damaged": sai do saldo da
--    loja e NÃO entra no central (fica baixada; o motivo fica no histórico).
-- ---------------------------------------------------------------------
create or replace function public.request_return(
  p_product_id uuid, p_quantity integer, p_reason text, p_condition public.return_condition,
  p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor   public.profiles;
  v_id      uuid;
  v_balance integer;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['employee']::public.user_role[]);
  perform private.assert_quantity(p_quantity);
  perform private.assert_text(p_reason, 3, 500, 'O motivo');
  perform private.assert_product(p_product_id, false);
  if p_condition is null then
    raise exception 'Informe o estado da peça.' using errcode = '22023', hint = 'invalid_items';
  end if;
  select b.quantity into v_balance from public.stock_balances b
   where b.store_id = v_actor.store_id and b.product_id = p_product_id;
  if coalesce(v_balance, 0) < p_quantity then
    raise exception 'Sua unidade possui apenas % unidade(s) deste produto.', coalesce(v_balance, 0)
      using errcode = 'P0001', hint = 'insufficient_stock';
  end if;

  begin
    insert into public.stock_returns (store_id, product_id, quantity, reason, condition, requested_by, idempotency_key)
    values (v_actor.store_id, p_product_id, p_quantity, p_reason, p_condition, v_actor.id, p_idempotency_key)
    returning id into v_id;
  exception when unique_violation then
    select r.id into v_id from public.stock_returns r
     where r.requested_by = v_actor.id and r.idempotency_key = p_idempotency_key;
    if v_id is null then raise; end if;
  end;
  return v_id;
end $$;

create or replace function public.reject_return(p_return_id uuid, p_notes text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_ret   public.stock_returns;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  perform private.assert_text(p_notes, 3, 500, 'O motivo da recusa');
  select * into v_ret from public.stock_returns r where r.id = p_return_id for update;
  if not found then
    raise exception 'Devolução não encontrada.' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_ret.status <> 'requested' then
    raise exception 'A devolução já foi tratada (status atual: %).', v_ret.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;
  update public.stock_returns
     set status = 'rejected', resolved_by = v_actor.id, resolved_at = now(), resolution_notes = p_notes
   where id = v_ret.id;
end $$;

create or replace function public.receive_return(p_return_id uuid, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor public.profiles;
  v_ret   public.stock_returns;
  v_ref   text;
begin
  v_actor := private.require_actor();
  perform private.require_role(v_actor, array['admin', 'stock_manager']::public.user_role[]);
  select * into v_ret from public.stock_returns r where r.id = p_return_id for update;
  if not found then
    raise exception 'Devolução não encontrada.' using errcode = 'P0002', hint = 'not_found';
  end if;
  if v_ret.status <> 'requested' then
    raise exception 'A devolução já foi tratada (status atual: %).', v_ret.status
      using errcode = 'P0001', hint = 'invalid_status';
  end if;

  v_ref := 'Devolução #' || v_ret.return_number || ' (' || v_ret.condition || '): ' || v_ret.reason;
  perform private.apply_movement(v_ret.store_id, v_ret.product_id, 'return_out', -v_ret.quantity, v_actor.id,
            private.central_store_id(), left(v_ref, 500), 'stock_return', v_ret.id, null);
  if v_ret.condition = 'good' then
    perform private.apply_movement(private.central_store_id(), v_ret.product_id, 'return_in', v_ret.quantity,
              v_actor.id, v_ret.store_id, left(v_ref, 500), 'stock_return', v_ret.id, null);
  end if;
  update public.stock_returns
     set status = 'received', resolved_by = v_actor.id, resolved_at = now(), resolution_notes = p_notes
   where id = v_ret.id;
end $$;

-- ---------------------------------------------------------------------
-- 8. Consultas (SECURITY INVOKER: a RLS do usuário que chama continua valendo)
-- ---------------------------------------------------------------------
create or replace function public.get_stock_balance(p_store_id uuid default null, p_product_id uuid default null)
returns table (
  store_id uuid, store_name text, store_kind public.store_kind,
  product_id uuid, sku text, product_name text, unit_of_measure text,
  quantity integer, min_quantity integer, below_minimum boolean)
language sql stable set search_path = '' as $$
  select b.store_id, s.name, s.kind, b.product_id, p.sku, p.name, p.unit_of_measure,
         b.quantity, coalesce(b.min_quantity, p.min_stock),
         b.quantity < coalesce(b.min_quantity, p.min_stock)
    from public.stock_balances b
    join public.stores   s on s.id = b.store_id
    join public.products p on p.id = b.product_id
   where (p_store_id is null or b.store_id = p_store_id)
     and (p_product_id is null or b.product_id = p_product_id)
   order by s.kind, s.name, p.name
$$;

create or replace function public.get_movement_history(
  p_store_id uuid default null, p_product_id uuid default null,
  p_from timestamptz default null, p_to timestamptz default null,
  p_performed_by uuid default null, p_limit integer default 100, p_offset integer default 0)
returns table (
  id uuid, created_at timestamptz, store_id uuid, store_name text,
  counterpart_store_id uuid, counterpart_store_name text,
  product_id uuid, sku text, product_name text, movement_type public.movement_type,
  quantity_delta integer, balance_after integer, reason text,
  reference_type text, reference_id uuid, performed_by uuid, performed_by_name text)
language sql stable set search_path = '' as $$
  select m.id, m.created_at, m.store_id, s.name, m.counterpart_store_id, cs.name,
         m.product_id, p.sku, p.name, m.movement_type, m.quantity_delta, m.balance_after, m.reason,
         m.reference_type, m.reference_id, m.performed_by, u.full_name
    from public.stock_movements m
    join public.stores   s  on s.id = m.store_id
    join public.products p  on p.id = m.product_id
    left join public.stores   cs on cs.id = m.counterpart_store_id
    left join public.profiles u  on u.id = m.performed_by
   where (p_store_id is null or m.store_id = p_store_id)
     and (p_product_id is null or m.product_id = p_product_id)
     and (p_performed_by is null or m.performed_by = p_performed_by)
     and (p_from is null or m.created_at >= p_from)
     and (p_to is null or m.created_at < p_to)
   order by m.seq desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------
-- 9. Privilégios de execução
--    * funções do schema private: ninguém chama direto, exceto os auxiliares de identidade
--      usados pelas políticas RLS
--    * funções do schema public (RPCs): só usuários logados (nunca anon)
-- ---------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.user_role(), private.user_store_id(), private.is_active_user(),
                          private.is_admin(), private.is_stock_manager(), private.central_store_id()
  to authenticated;

revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
